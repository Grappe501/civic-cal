#!/usr/bin/env node
/**
 * Pass 27 — Harvest school / college calendars → staged school events.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSchoolCalendarHtml } from "./lib/parse-school-calendar-html.mjs";
import { parseIcsFeed, discoverIcsUrls } from "./lib/parse-ics-feed.mjs";
import { SCHOOL_EVENT_LANES, classifySchoolLane, laneCategory, laneTitle } from "./lib/school-lane-classifier.mjs";
import { writeSchoolHarvestHealth } from "./lib/school-harvest-health.mjs";
import { leaPrefixFromId } from "./lib/extract-school-city.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REGISTRY = path.join(ROOT, "data/schools/school-harvest-registry.json");
const STAGED = path.join(ROOT, "data/ingestion/school-events-staged.json");
const SUMMARY = path.join(ROOT, "data/ingestion/school-events-summary.json");

const FETCH_LIMIT = Number(process.env.SCHOOL_HARVEST_FETCH_LIMIT ?? 100);
const FETCH_DELAY_MS = Number(process.env.SCHOOL_HARVEST_DELAY_MS ?? 300);

const HS_LANES = SCHOOL_EVENT_LANES.filter((l) => !l.id.startsWith("college_"));
const COLLEGE_LANES = SCHOOL_EVENT_LANES.filter((l) => l.id.startsWith("college_"));

async function fetchText(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ArkansasEverywhere-CivicBot/1.0; +https://arkansaseverywhere.org)",
        Accept: "text/html,text/calendar,application/json,*/*",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function urlPriority(url) {
  if (/\.ics(\?|$)/i.test(url)) return 0;
  if (/calendar\.|calendars\./i.test(url)) return 1;
  if (/\/events\/?$/i.test(url) || /\/athletics\/?$/i.test(url)) return 9;
  return 3;
}

function harvestUrlsFor(inst) {
  const urls = [];
  if (inst.ics_url) urls.push(inst.ics_url);
  if (inst.calendar_url) urls.push(normalizeDistrictUrl(inst.calendar_url));
  if (inst.website) urls.push(normalizeDistrictUrl(inst.website));
  if (inst.athletics_url) urls.push(inst.athletics_url);
  return [...new Set(urls.filter(Boolean))].sort((a, b) => urlPriority(a) - urlPriority(b));
}

function normalizeDistrictUrl(url) {
  if (!url) return url;
  return String(url).replace(/\/events\/?$/i, "").replace(/\/athletics\/?$/i, "");
}

function isIcsUrl(url) {
  return /\.ics(\?|$)/i.test(url) || /text\/calendar/i.test(url);
}

async function harvestUrl(url, owners, candidates, stats) {
  const body = await fetchText(url);
  if (isIcsUrl(url) || body.includes("BEGIN:VCALENDAR")) {
    const icsEvents = parseIcsFeed(body, url);
    for (const inst of owners) {
      for (const row of icsEvents) {
        const lane_id = classifySchoolLane(`${row.title} ${row.raw_text ?? ""}`);
        candidates.push(
          parsedCandidate({
            institution: inst,
            parsed: { ...row, lane_id },
            fetchUrl: url,
          }),
        );
        stats.parsedEvents++;
      }
    }
    return;
  }

  const icsLinks = discoverIcsUrls(body, url);
  for (const icsUrl of icsLinks.slice(0, 2)) {
    if (stats.fetchedUrls.has(icsUrl) || stats.fetchCount >= FETCH_LIMIT) continue;
    stats.fetchedUrls.add(icsUrl);
    stats.fetchCount++;
    try {
      await harvestUrl(icsUrl, owners, candidates, stats);
    } catch (e) {
      console.warn(`[schools:harvest-calendars] ics fetch failed ${icsUrl}: ${e.message}`);
    }
    await sleep(FETCH_DELAY_MS);
  }

  const htmlEvents = parseSchoolCalendarHtml(body, url);
  for (const inst of owners) {
    for (const row of htmlEvents) {
      candidates.push(parsedCandidate({ institution: inst, parsed: row, fetchUrl: url }));
      stats.parsedEvents++;
    }
  }
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function projectionCandidate({ institution, laneId, sourceUrl, notes }) {
  const lane = SCHOOL_EVENT_LANES.find((l) => l.id === laneId);
  return {
    id: `school-proj-${institution.id}-${laneId}`,
    title: laneTitle(laneId, institution.school_name ?? institution.institution_name),
    description: notes,
    event_date: null,
    city: institution.city,
    county: institution.county ?? "Unknown",
    state: "AR",
    category: laneCategory(laneId),
    event_lane: laneId,
    event_lane_label: lane?.label ?? laneId,
    intelligence_layer: institution.institution_kind === "college" ? "community" : "community",
    confidence_score: 30,
    source_name: institution.school_name ?? institution.institution_name,
    source_url: sourceUrl,
    source_type: "school_district_public_page",
    institution_id: institution.id,
    institution_kind: institution.institution_kind ?? "school",
    discovered_by: "schools:harvest-calendars",
    review_status: "needs_review",
    is_recurring_annual: ["homecoming", "graduation", "senior_night", "school_board"].includes(laneId),
    notes: `${notes} NOT auto-published — verify official calendar.`,
    harvest_pass: "27",
  };
}

function parsedCandidate({ institution, parsed, fetchUrl }) {
  return {
    id: `school-${institution.id}-${slugify(parsed.title)}-${parsed.event_date}`,
    title: parsed.title.slice(0, 180),
    description: parsed.raw_text?.slice(0, 400) ?? null,
    event_date: parsed.event_date,
    city: institution.city,
    county: institution.county ?? "Unknown",
    state: "AR",
    category: laneCategory(parsed.lane_id),
    event_lane: parsed.lane_id,
    intelligence_layer: "community",
    confidence_score: parsed.confidence_score ?? 55,
    source_name: institution.school_name ?? institution.institution_name,
    source_url: parsed.source_url ?? fetchUrl,
    source_type: "school_district_public_page",
    institution_id: institution.id,
    institution_kind: institution.institution_kind ?? "school",
    discovered_by: "schools:harvest-calendars",
    review_status: "needs_review",
    raw_text: parsed.raw_text,
    harvest_pass: "27",
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!fs.existsSync(REGISTRY)) {
    console.error("Run npm run schools:discover first");
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  const candidates = [];

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

  const stats = { fetchedUrls: new Set(), fetchCount: 0, parsedEvents: 0 };

  for (const [url, owners] of sortedUrls) {
    if (stats.fetchCount >= FETCH_LIMIT || stats.fetchedUrls.has(url)) continue;
    stats.fetchedUrls.add(url);
    stats.fetchCount++;
    try {
      await harvestUrl(url, owners, candidates, stats);
    } catch (e) {
      console.warn(`[schools:harvest-calendars] fetch failed ${url}: ${e.message}`);
    }
    await sleep(FETCH_DELAY_MS);
  }

  const parsedEvents = stats.parsedEvents;
  const fetchCount = stats.fetchCount;

  for (const inst of institutions) {
    if (!inst.calendar_url && !inst.athletics_url) continue;
    const lanes = inst.institution_kind === "college" ? COLLEGE_LANES : HS_LANES;
    const sourceUrl = inst.calendar_url ?? inst.athletics_url;
    for (const lane of lanes) {
      candidates.push(
        projectionCandidate({
          institution: inst,
          laneId: lane.id,
          sourceUrl,
          notes: `Harvest target: ${lane.label}. Source attached — dates pending parse or manual verify.`,
        }),
      );
    }
  }

  const byLea = new Map();
  for (const inst of registry.high_schools ?? []) {
    const lea = leaPrefixFromId(inst.id);
    if (lea) {
      if (!byLea.has(lea)) byLea.set(lea, inst);
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const c of candidates) {
    const key = `${c.institution_id}|${c.event_lane}|${c.event_date ?? "nodate"}|${c.title.slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(c);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    pass: "27",
    harvest_batch: "school-calendar-2026",
    summary: {
      institutionsWithUrls: institutions.filter((i) => i.calendar_url || i.athletics_url).length,
      urlsFetched: fetchCount,
      parsedEventsWithDates: parsedEvents,
      stagedCandidates: deduped.length,
      uniqueLeaGroups: byLea.size,
    },
    candidates: deduped,
  };

  fs.mkdirSync(path.dirname(STAGED), { recursive: true });
  fs.writeFileSync(STAGED, JSON.stringify(payload, null, 2));
  fs.writeFileSync(SUMMARY, JSON.stringify({ generatedAt: payload.generatedAt, ...payload.summary }, null, 2));

  registry.last_calendar_harvest_at = payload.generatedAt;
  fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2));

  const health = writeSchoolHarvestHealth(registry);
  console.log(
    `[schools:harvest-calendars] staged:${deduped.length} · parsed w/ dates:${parsedEvents} · fetches:${fetchCount} · approved funnel:${health.funnel.approvedPublicEvents}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
