#!/usr/bin/env node
/**
 * Emergency duplicate audit — county drill-down pages and catalog merge.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "data/audits/county-page-duplicates.json");

const BUNDLES = [
  { source: "main", path: "data/seed-events.json", priority: 0 },
  { source: "demo", path: "data/seed-events-public-demo.json", priority: 1 },
  { source: "party", path: "data/ingestion/political-party-meetings-approved-events.json", priority: 2 },
  { source: "school", path: "data/ingestion/school-events-approved-events.json", priority: 3 },
  { source: "fair_festival", path: "data/ingestion/fair-festival-approved-events.json", priority: 4 },
  { source: "county_fair", path: "data/ingestion/county-fair-approved-events.json", priority: 5 },
  { source: "historic_political", path: "data/ingestion/historic-political-events-approved-events.json", priority: 6 },
  { source: "top250_festival", path: "data/ingestion/top250-city-festival-approved-events.json", priority: 7 },
  { source: "agriculture", path: "data/agriculture/agriculture-event-approved-events.json", priority: 8 },
];

const COUNTIES = JSON.parse(fs.readFileSync(path.join(ROOT, "data/arkansas-counties.json"), "utf8")).counties;

function normalizeText(value) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getEventCanonicalKey(event) {
  const date = (event.startAt ?? event.start_at ?? "").slice(0, 10);
  return `${normalizeText(event.title)}|${date}|${normalizeText(event.city || event.county)}|${normalizeText(event.county)}`;
}

function getPartyMeetingCanonicalKey(event) {
  const isParty = event.category === "public_party_meeting" || event.partyLabel || event.party_label;
  if (!isParty) return null;
  const when = (event.startAt ?? event.start_at ?? "").slice(0, 16);
  const party = (event.partyLabel ?? event.party_label ?? "").toLowerCase();
  return `party|${normalizeText(event.county)}|${party}|${when}|${normalizeText(event.title)}`;
}

function canonicalKey(event) {
  return getPartyMeetingCanonicalKey(event) ?? getEventCanonicalKey(event);
}

function dedupeEvents(events) {
  const bySlug = new Map();
  for (const e of events) {
    if (e.slug) bySlug.set(e.slug, e);
  }
  const byCanonical = new Map();
  for (const e of bySlug.values()) {
    byCanonical.set(canonicalKey(e), e);
  }
  return [...byCanonical.values()];
}

function dedupeCatalogEvents(tagged) {
  tagged.sort((a, b) => a.priority - b.priority);
  const bySlug = new Map();
  for (const { event } of tagged) {
    if (event.slug) bySlug.set(event.slug, event);
  }
  return dedupeEvents([...bySlug.values()]);
}

function loadTaggedEvents() {
  const tagged = [];
  for (const bundle of BUNDLES) {
    const p = path.join(ROOT, bundle.path);
    if (!fs.existsSync(p)) continue;
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    for (const event of data.events ?? []) {
      tagged.push({ event, priority: bundle.priority, source: bundle.source });
    }
  }
  return tagged;
}

function groupByCounty(events) {
  const map = new Map();
  for (const e of events) {
    if (!e.county) continue;
    const list = map.get(e.county) ?? [];
    list.push(e);
    map.set(e.county, list);
  }
  return map;
}

function findDuplicates(events, county, { uiExclusive = false } = {}) {
  const findings = [];

  const slugGroups = new Map();
  for (const e of events) {
    if (!e.slug) continue;
    const g = slugGroups.get(e.slug) ?? [];
    g.push(e);
    slugGroups.set(e.slug, g);
  }
  for (const [slug, group] of slugGroups) {
    if (group.length > 1) {
      findings.push({
        county,
        duplicate_type: "event_slug",
        keys: [slug],
        count: group.length,
        sources: group.map((e) => e._source ?? "unknown"),
        suggested_fix: "dedupeBySlug before county render",
      });
    }
  }

  const tdcGroups = new Map();
  for (const e of events) {
    const k = getEventCanonicalKey(e);
    const g = tdcGroups.get(k) ?? [];
    g.push(e);
    tdcGroups.set(k, g);
  }
  for (const [k, group] of tdcGroups) {
    if (group.length > 1) {
      findings.push({
        county,
        duplicate_type: "title_date_city",
        keys: [k, ...group.map((e) => e.slug)],
        count: group.length,
        sources: group.map((e) => e._source ?? "unknown"),
        suggested_fix: "dedupeByCanonicalKey in seed merge — prefer approved bundle",
      });
    }
  }

  const partyGroups = new Map();
  for (const e of events) {
    const pk = getPartyMeetingCanonicalKey(e);
    if (!pk) continue;
    const g = partyGroups.get(pk) ?? [];
    g.push(e);
    partyGroups.set(pk, g);
  }
  for (const [k, group] of partyGroups) {
    if (group.length > 1) {
      findings.push({
        county,
        duplicate_type: "party_meeting_occurrence",
        keys: [k, ...group.map((e) => e.slug)],
        count: group.length,
        sources: group.map((e) => e._source ?? "unknown"),
        suggested_fix: "party:republish slug dedupe + render dedupe",
      });
    }
  }

  // UI section overlap (county public page pattern — after exclusive subsection fix)
  const upcoming = events.slice(0, 9);
  const upcomingKeys = new Set(upcoming.map(getEventCanonicalKey));
  const food = events.filter((e) => /fish fry|spaghetti|dinner|meal/i.test(e.title ?? ""));
  const festivals = events.filter((e) => /festival|fair|parade/i.test(e.title ?? ""));
  const foodExclusive = food.filter((e) => !upcomingKeys.has(getEventCanonicalKey(e)));
  const festivalsExclusive = festivals.filter((e) => !upcomingKeys.has(getEventCanonicalKey(e)));
  const foodOverlap = uiExclusive ? 0 : food.length - foodExclusive.length;
  const festOverlap = uiExclusive ? 0 : festivals.length - festivalsExclusive.length;
  if (foodOverlap > 0 || festOverlap > 0) {
    findings.push({
      county,
      duplicate_type: "ui_section_overlap",
      keys: [`food:${foodOverlap}`, `festivals:${festOverlap}`],
      count: foodOverlap + festOverlap,
      sources: ["CountyPublicPage", "CityPage"],
      suggested_fix: "excludeEventsByCanonicalKey for highlight subsections",
    });
  }

  return findings;
}

function auditCatalogMerge(tagged) {
  const raw = [];
  for (const { event, source } of tagged) {
    raw.push({ ...event, _source: source });
  }
  const merged = dedupeCatalogEvents(tagged).map((e) => {
    const src = tagged.find((t) => t.event.slug === e.slug);
    return { ...e, _source: src?.source ?? "merged" };
  });

  const beforeByCounty = groupByCounty(raw.filter((e) => (e.status ?? "approved") === "approved"));
  const afterByCounty = groupByCounty(merged.filter((e) => (e.status ?? "approved") === "approved"));

  const findings = [];
  for (const county of COUNTIES) {
    const before = beforeByCounty.get(county) ?? [];
    const after = afterByCounty.get(county) ?? [];
    findings.push(...findDuplicates(before, county).map((f) => ({ ...f, phase: "before_merge" })));
    findings.push(...findDuplicates(after, county).map((f) => ({ ...f, phase: "after_catalog_merge" })));
    findings.push(
      ...findDuplicates(after, county, { uiExclusive: true }).map((f) => ({ ...f, phase: "after_ui_fix" })),
    );
  }
  return { findings, mergedCount: merged.length, rawCount: raw.length };
}

function main() {
  const tagged = loadTaggedEvents();
  const { findings, mergedCount, rawCount } = auditCatalogMerge(tagged);

  const beforeCount = findings.filter((f) => f.phase === "before_merge").length;
  const afterCatalogCount = findings.filter((f) => f.phase === "after_catalog_merge").length;
  const afterUiCount = findings.filter((f) => f.phase === "after_ui_fix").length;

  const byCounty = new Map();
  for (const f of findings.filter((x) => x.phase === "after_catalog_merge")) {
    byCounty.set(f.county, (byCounty.get(f.county) ?? 0) + f.count);
  }
  const hottest = [...byCounty.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([county, count]) => ({ county, duplicate_items: count }));

  const report = {
    generatedAt: new Date().toISOString(),
    pass: "emergency-duplicate-audit",
    catalogEventsRaw: rawCount,
    catalogEventsMerged: mergedCount,
    duplicateFindingsBeforeMerge: beforeCount,
    duplicateFindingsAfterCatalogMerge: afterCatalogCount,
    duplicateFindingsAfterUiFix: afterUiCount,
    countiesAudited: COUNTIES.length,
    countiesMostAffected: hottest,
    findings,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));

  console.log(
    `[audit:county-duplicates] before=${beforeCount} after_catalog=${afterCatalogCount} after_ui=${afterUiCount} · merged ${rawCount}→${mergedCount} · wrote ${OUT}`,
  );
  if (hottest.length) {
    console.log(`  hottest: ${hottest.map((h) => `${h.county}(${h.duplicate_items})`).join(", ")}`);
  }
}

main();
