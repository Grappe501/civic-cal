/**
 * Build AI Brain context indexes from bundled data sources.
 * Output: data/ai-brain/*.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA = path.join(ROOT, "data");
const OUT = path.join(DATA, "ai-brain");

function readJson(rel) {
  const p = path.join(DATA, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function readEvents(rel) {
  const bundle = readJson(rel);
  if (!bundle) return [];
  return bundle.events ?? [];
}

function loadBundledEvents() {
  const bySlug = new Map();
  for (const file of [
    "seed-events.json",
    "seed-events-public-demo.json",
    "ingestion/political-party-meetings-approved-events.json",
    "ingestion/school-events-approved-events.json",
    "ingestion/fair-festival-approved-events.json",
    "ingestion/county-fair-approved-events.json",
  ]) {
    for (const e of readEvents(file)) {
      if (e?.slug && !bySlug.has(e.slug)) bySlug.set(e.slug, e);
    }
  }
  return [...bySlug.values()];
}

function normCounty(name) {
  return String(name || "")
    .replace(/\s+County$/i, "")
    .trim();
}

function ensureDir() {
  fs.mkdirSync(OUT, { recursive: true });
}

function buildEventIndex(events) {
  return {
    generatedAt: new Date().toISOString(),
    count: events.length,
    events: events.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      county: e.county ?? null,
      city: e.city ?? null,
      category: e.category ?? null,
      layer: e.intelligenceLayer ?? e.layer ?? null,
      startAt: e.startAt ?? e.start_at ?? null,
      endAt: e.endAt ?? e.end_at ?? null,
      status: e.status ?? "approved",
      sourceUrl: e.sourceUrl ?? e.source_url ?? e.officialUrl ?? e.official_url ?? null,
      sourceRef: e.sourceRef ?? e.source_ref ?? e.source ?? null,
      verificationStatus: e.verificationStatus ?? e.verification_status ?? null,
      needsSourceConfirmation: Boolean(e.needsSourceConfirmation ?? e.needs_source_confirmation),
    })),
  };
}

function buildPlaceIndex(events, countiesJson) {
  const countyNames = (countiesJson?.counties ?? countiesJson ?? []).map((c) =>
    typeof c === "string" ? c : c.name ?? c.county,
  );
  const byCounty = new Map();
  const byCity = new Map();

  for (const e of events) {
    const county = normCounty(e.county);
    const city = String(e.city || "").trim();
    if (county) {
      const row = byCounty.get(county) ?? { county, eventCount: 0, cities: new Set() };
      row.eventCount += 1;
      if (city) row.cities.add(city);
      byCounty.set(county, row);
    }
    if (city) {
      const key = `${city}|${county}`;
      const row = byCity.get(key) ?? { city, county: county || null, eventCount: 0 };
      row.eventCount += 1;
      byCity.set(key, row);
    }
  }

  const counties = countyNames.length
    ? countyNames.map((name) => {
        const row = byCounty.get(name) ?? { county: name, eventCount: 0, cities: new Set() };
        return {
          county: name,
          eventCount: row.eventCount,
          cityCount: row.cities?.size ?? 0,
          thin: row.eventCount < 3,
        };
      })
    : [...byCounty.values()].map((r) => ({
        county: r.county,
        eventCount: r.eventCount,
        cityCount: r.cities.size,
        thin: r.eventCount < 3,
      }));

  return {
    generatedAt: new Date().toISOString(),
    countyCount: counties.length,
    thinCounties: counties.filter((c) => c.thin).map((c) => c.county),
    counties,
    cities: [...byCity.values()].sort((a, b) => b.eventCount - a.eventCount),
  };
}

function buildOrgIndex() {
  const orgs = [];
  for (const file of [
    "institutions/church-directory.json",
    "institutions/school-directory.json",
    "institutions/college-directory.json",
    "institutions/civic-organizations.json",
  ]) {
    const bundle = readJson(file);
    const list = bundle?.institutions ?? bundle?.churches ?? bundle?.schools ?? bundle?.colleges ?? bundle?.organizations ?? [];
    for (const o of list) {
      orgs.push({
        slug: o.slug ?? o.id,
        name: o.name ?? o.title,
        county: o.county ?? null,
        city: o.city ?? null,
        category: o.category ?? o.type ?? o.institutionType ?? file.split("/")[1]?.replace(".json", ""),
        sourceUrl: o.sourceUrl ?? o.website ?? o.url ?? null,
      });
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    count: orgs.length,
    organizations: orgs.slice(0, 5000),
  };
}

function buildFeedIndex() {
  const report = readJson("feeds/feed-attachment-report.json") ?? { counties: [], metrics: {} };
  return {
    generatedAt: new Date().toISOString(),
    metrics: report.metrics ?? {},
    counties: (report.counties ?? []).map((c) => ({
      county: c.county,
      feedsAttached: c.feedsAttached,
      feedsMissing: c.feedsMissing,
      feedSlotsExpected: c.feedSlotsExpected,
      coveragePercent: c.coveragePercent,
      institutions: c.institutions,
      thin: (c.coveragePercent ?? 0) < 25,
    })),
    thinCounties: (report.counties ?? [])
      .filter((c) => (c.coveragePercent ?? 0) < 25)
      .map((c) => c.county),
  };
}

function buildCandidateIndex() {
  const initial = readJson("campaigns/initial-campaign-workspaces.json");
  const discovered = readJson("campaigns/discovered-campaign-workspaces.json");
  const workspaces = [
    ...(initial?.workspaces ?? []),
    ...(discovered?.workspaces ?? []),
  ];
  return {
    generatedAt: new Date().toISOString(),
    count: workspaces.length,
    candidates: workspaces.map((w) => ({
      slug: w.slug,
      name: w.candidate_name ?? w.campaign_name,
      office: w.office_sought ?? null,
      districtType: w.district_type ?? null,
      active: w.is_active !== false,
      counties: w.counties ?? w.district_scope?.counties ?? [],
      cities: w.cities ?? w.district_scope?.cities ?? [],
    })),
  };
}

function buildCoverageIndex(events, feedIndex, placeIndex) {
  const needsSource = events.filter(
    (e) => e.needsSourceConfirmation || e.needs_source_confirmation || !e.sourceUrl && !e.source_url,
  );
  return {
    generatedAt: new Date().toISOString(),
    thinCounties: placeIndex.thinCounties,
    thinFeedCounties: feedIndex.thinCounties,
    eventsNeedingSource: needsSource.length,
    eventsNeedingSourceSlugs: needsSource.slice(0, 200).map((e) => e.slug),
    totalEvents: events.length,
    totalCounties: placeIndex.countyCount,
  };
}

function buildSourceIndex(events) {
  const sources = new Map();
  for (const e of events) {
    const url = e.sourceUrl ?? e.source_url ?? e.officialUrl ?? e.official_url;
    const ref = e.sourceRef ?? e.source_ref ?? (typeof e.source === "string" && e.source.startsWith("http") ? e.source : null);
    const key = url ?? ref;
    if (!key) continue;
    const row = sources.get(key) ?? { url: key, eventCount: 0, titles: [] };
    row.eventCount += 1;
    if (row.titles.length < 5) row.titles.push(e.title);
    sources.set(url, row);
  }
  return {
    generatedAt: new Date().toISOString(),
    count: sources.size,
    sources: [...sources.values()].sort((a, b) => b.eventCount - a.eventCount),
  };
}

function main() {
  ensureDir();
  const events = loadBundledEvents();
  const countiesJson = readJson("arkansas-counties.json");

  const eventIndex = buildEventIndex(events);
  const placeIndex = buildPlaceIndex(events, countiesJson);
  const orgIndex = buildOrgIndex();
  const feedIndex = buildFeedIndex();
  const candidateIndex = buildCandidateIndex();
  const coverageIndex = buildCoverageIndex(events, feedIndex, placeIndex);
  const sourceIndex = buildSourceIndex(events);

  const files = {
    "event-index.json": eventIndex,
    "place-index.json": placeIndex,
    "org-index.json": orgIndex,
    "feed-index.json": feedIndex,
    "candidate-index.json": candidateIndex,
    "coverage-index.json": coverageIndex,
    "source-index.json": sourceIndex,
  };

  for (const [name, payload] of Object.entries(files)) {
    fs.writeFileSync(path.join(OUT, name), JSON.stringify(payload, null, 2));
    console.log(`Wrote ${name} (${payload.count ?? payload.events?.length ?? payload.counties?.length ?? "ok"})`);
  }
}

main();
