#!/usr/bin/env node
/**
 * Pass 28 — Harvest school calendars via platform-aware parsers.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSchoolPlatform } from "./lib/parse-school-platform.mjs";
import { SCHOOL_EVENT_LANES, laneCategory, laneTitle } from "./lib/school-lane-classifier.mjs";
import { writeSchoolHarvestHealth } from "./lib/school-harvest-health.mjs";
import { leaPrefixFromId } from "./lib/extract-school-city.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REGISTRY = path.join(ROOT, "data/schools/school-harvest-registry.json");
const STAGED = path.join(ROOT, "data/ingestion/school-events-staged.json");
const PARSED = path.join(ROOT, "data/ingestion/school-events-parsed-dated.json");
const SUMMARY = path.join(ROOT, "data/ingestion/school-events-summary.json");

const FETCH_LIMIT = Number(process.env.SCHOOL_HARVEST_FETCH_LIMIT ?? 150);
const FETCH_DELAY_MS = Number(process.env.SCHOOL_HARVEST_DELAY_MS ?? 250);

const HS_LANES = SCHOOL_EVENT_LANES.filter((l) => !l.id.startsWith("college_"));
const COLLEGE_LANES = SCHOOL_EVENT_LANES.filter((l) => l.id.startsWith("college_"));

async function fetchResource(url, timeoutMs = 14000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ArkansasEverywhere-CivicBot/1.0; +https://arkansaseverywhere.org)",
        Accept: "text/html,application/json,text/calendar,*/*",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get("content-type") ?? "";
    return { body: await res.text(), contentType, url };
  } finally {
    clearTimeout(timer);
  }
}

function urlPriority(url) {
  if (/\.ics(\?|$)/i.test(url)) return 0;
  if (/calendar\.|calendars\./i.test(url)) return 1;
  if (/arbiterlive|maxpreps|gofan|dragonfly/i.test(url)) return 2;
  if (/\/api\/2\/events/i.test(url)) return 1;
  if (/\/athletics\/?$/i.test(url)) return 8;
  return 4;
}

function normalizeDistrictUrl(url) {
  if (!url) return url;
  return String(url).replace(/\/events\/?$/i, "").replace(/\/athletics\/?$/i, "");
}

function harvestUrlsFor(inst) {
  const urls = [];
  for (const u of inst.ics_urls ?? []) urls.push(u);
  if (inst.ics_url) urls.push(inst.ics_url);
  if (inst.board_meeting_url) urls.push(inst.board_meeting_url);
  if (inst.calendar_url) urls.push(normalizeDistrictUrl(inst.calendar_url));
  if (inst.website) urls.push(normalizeDistrictUrl(inst.website));
  if (inst.athletics_url) urls.push(inst.athletics_url);
  return [...new Set(urls.filter(Boolean))].sort((a, b) => urlPriority(a) - urlPriority(b));
}

function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function projectionCandidate({ institution, laneId, sourceUrl, notes }) {
  const lane = SCHOOL_EVENT_LANES.find((l) => l.id === laneId);
  return {
    id: `school-proj-${institution.id}-${laneId}`,
    title: laneTitle(laneId, institution.school_name ?? institution.institution_name),
    description: notes,
    event_date: null,
    parse_status: "projection",
    city: institution.city,
    county: institution.county ?? "Unknown",
    state: "AR",
    category: laneCategory(laneId),
    event_lane: laneId,
    event_lane_label: lane?.label ?? laneId,
    confidence_score: 30,
    source_name: institution.school_name ?? institution.institution_name,
    source_url: sourceUrl,
    source_type: "school_district_public_page",
    institution_id: institution.id,
    institution_kind: institution.institution_kind ?? "school",
    discovered_by: "schools:harvest-calendars",
    review_status: "needs_review",
    notes: `${notes} NOT auto-published — verify official calendar.`,
    harvest_pass: "28",
  };
}

function datedCandidate({ institution, parsed, fetchUrl }) {
  const title = String(parsed.title ?? "").trim();
  const eventDate = parsed.event_date;
  const sourceUrl = parsed.source_url ?? fetchUrl;
  if (!title || !eventDate || !sourceUrl) return null;

  return {
    id: `school-${institution.id}-${slugify(title)}-${eventDate}`,
    title: title.slice(0, 180),
    description: parsed.raw_text?.slice(0, 400) ?? null,
    event_date: eventDate,
    parse_status: "dated",
    platform: parsed.platform ?? "unknown",
    city: institution.city,
    county: institution.county ?? "Unknown",
    state: "AR",
    category: laneCategory(parsed.lane_id),
    event_lane: parsed.lane_id ?? "school_general",
    intelligence_layer: "community",
    confidence_score: parsed.confidence_score ?? 55,
    source_name: institution.school_name ?? institution.institution_name,
    source_url: sourceUrl,
    source_type: "school_district_public_page",
    institution_id: institution.id,
    institution_kind: institution.institution_kind ?? "school",
    discovered_by: "schools:harvest-calendars",
    review_status: "needs_review",
    raw_text: parsed.raw_text,
    harvest_pass: "28",
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function harvestUrl(url, owners, dated, stats) {
  const { body, contentType } = await fetchResource(url);
  const sampleName = owners[0]?.school_name ?? owners[0]?.institution_name;
  const result = parseSchoolPlatform({ body, url, institutionName: sampleName, contentType });

  stats.platformCounts[result.platform] = (stats.platformCounts[result.platform] ?? 0) + 1;

  for (const inst of owners) {
    for (const row of result.events) {
      const c = datedCandidate({ institution: inst, parsed: row, fetchUrl: url });
      if (c) {
        dated.push(c);
        stats.parsedEvents++;
      }
    }
  }

  for (const next of result.followUpUrls.slice(0, 4)) {
    if (stats.fetchedUrls.has(next) || stats.fetchCount >= FETCH_LIMIT) continue;
    stats.fetchedUrls.add(next);
    stats.fetchCount++;
    try {
      await harvestUrl(next, owners, dated, stats);
    } catch (e) {
      console.warn(`[schools:harvest-calendars] follow-up failed ${next}: ${e.message}`);
    }
    await sleep(FETCH_DELAY_MS);
  }
}

async function main() {
  if (!fs.existsSync(REGISTRY)) {
    console.error("Run npm run schools:discover first");
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  const dated = [];
  const projections = [];

  const institutions = [
    ...(registry.high_schools ?? []).map((s) => ({ ...s, institution_kind: "school" })),
    ...(registry.colleges ?? []).map((c) => ({ ...c, institution_kind: "college", school_name: c.institution_name })),
  ];

  const urlOwners = new Map();
  const urlPriorityMap = new Map();
  for (const inst of institutions) {
    for (const u of harvestUrlsFor(inst)) {
      if (!urlOwners.has(u)) urlOwners.set(u, []);
      urlOwners.get(u).push(inst);
      urlPriorityMap.set(u, Math.min(urlPriorityMap.get(u) ?? 99, urlPriority(u)));
    }
  }

  const sortedUrls = [...urlOwners.entries()].sort(
    (a, b) => (urlPriorityMap.get(a[0]) ?? 99) - (urlPriorityMap.get(b[0]) ?? 99),
  );

  const stats = { fetchedUrls: new Set(), fetchCount: 0, parsedEvents: 0, platformCounts: {} };

  for (const [url, owners] of sortedUrls) {
    if (stats.fetchCount >= FETCH_LIMIT || stats.fetchedUrls.has(url)) continue;
    stats.fetchedUrls.add(url);
    stats.fetchCount++;
    try {
      await harvestUrl(url, owners, dated, stats);
    } catch (e) {
      console.warn(`[schools:harvest-calendars] fetch failed ${url}: ${e.message}`);
    }
    await sleep(FETCH_DELAY_MS);
  }

  for (const inst of institutions) {
    if (!inst.calendar_url && !inst.athletics_url && !inst.website) continue;
    const lanes = inst.institution_kind === "college" ? COLLEGE_LANES : HS_LANES;
    const sourceUrl = inst.calendar_url ?? inst.website ?? inst.athletics_url;
    for (const lane of lanes) {
      projections.push(
        projectionCandidate({
          institution: inst,
          laneId: lane.id,
          sourceUrl,
          notes: `Harvest target: ${lane.label}. Source attached — awaiting platform parse or manual verify.`,
        }),
      );
    }
  }

  const dedupe = (list) => {
    const out = [];
    const seen = new Set();
    for (const c of list) {
      const key = `${c.institution_id}|${c.event_lane ?? ""}|${c.event_date ?? "nodate"}|${c.title.slice(0, 40)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  };

  const datedDeduped = dedupe(dated);
  const allCandidates = dedupe([...datedDeduped, ...projections]);

  const parsedPayload = {
    generatedAt: new Date().toISOString(),
    pass: "28",
    datedEventCount: datedDeduped.length,
    platformCounts: stats.platformCounts,
    events: datedDeduped,
  };

  const stagedPayload = {
    generatedAt: parsedPayload.generatedAt,
    pass: "28",
    harvest_batch: "school-platform-2026",
    summary: {
      institutionsWithUrls: institutions.filter((i) => i.calendar_url || i.athletics_url || i.website).length,
      urlsFetched: stats.fetchCount,
      parsedEventsWithDates: datedDeduped.length,
      projectionTargets: projections.length,
      stagedCandidates: allCandidates.length,
      platformCounts: stats.platformCounts,
    },
    dated_events: datedDeduped,
    candidates: allCandidates,
  };

  fs.mkdirSync(path.dirname(STAGED), { recursive: true });
  fs.writeFileSync(STAGED, JSON.stringify(stagedPayload, null, 2));
  fs.writeFileSync(PARSED, JSON.stringify(parsedPayload, null, 2));
  fs.writeFileSync(SUMMARY, JSON.stringify({ generatedAt: stagedPayload.generatedAt, ...stagedPayload.summary }, null, 2));

  registry.last_calendar_harvest_at = stagedPayload.generatedAt;
  registry.harvest_pass = "28-platform";
  fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2));

  const health = writeSchoolHarvestHealth(registry, stagedPayload);
  console.log(
    `[schools:harvest-calendars] dated:${datedDeduped.length} · projections:${projections.length} · fetches:${stats.fetchCount} · platforms:${JSON.stringify(stats.platformCounts)}`,
  );

  if (datedDeduped.length < 150) {
    console.warn(`[schools:harvest-calendars] below Pass 28 target (150 dated) — got ${datedDeduped.length}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
