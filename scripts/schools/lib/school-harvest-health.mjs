/**
 * Pass 28 — funnel metrics for school calendar harvest.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export const PATHS = {
  registry: path.join(ROOT, "data/schools/school-harvest-registry.json"),
  health: path.join(ROOT, "data/schools/school-harvest-health.json"),
  staged: path.join(ROOT, "data/ingestion/school-events-staged.json"),
  parsed: path.join(ROOT, "data/ingestion/school-events-parsed-dated.json"),
  approved: path.join(ROOT, "data/ingestion/school-events-approved-events.json"),
};

function loadJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function computeSchoolHarvestHealth(registryOverride, stagedOverride) {
  const registry = registryOverride ?? loadJson(PATHS.registry, { high_schools: [], colleges: [] });
  const staged = stagedOverride ?? loadJson(PATHS.staged, { candidates: [], dated_events: [] });
  const parsed = loadJson(PATHS.parsed, { events: [] });
  const approved = loadJson(PATHS.approved, { events: [] });

  const hs = registry.high_schools ?? [];
  const colleges = registry.colleges ?? [];

  const stagedCandidates = staged.candidates ?? [];
  const datedEvents = staged.dated_events ?? parsed.events ?? stagedCandidates.filter((c) => c.event_date);
  const projections = stagedCandidates.filter((c) => !c.event_date);
  const pendingDated = datedEvents.filter((c) => c.review_status !== "approved" && c.review_status !== "rejected");
  const approvedEvents = approved.events ?? [];

  const laneCounts = {};
  const platformCounts = staged.summary?.platformCounts ?? parsed.platformCounts ?? {};
  for (const c of datedEvents) {
    const lane = c.event_lane ?? "unknown";
    laneCounts[lane] = (laneCounts[lane] ?? 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    pass: staged.pass ?? "28",
    funnel: {
      highSchoolsDiscovered: hs.length,
      collegesDiscovered: colleges.length,
      highSchoolsCalendarUrl: hs.filter((s) => s.calendar_url).length,
      highSchoolsAthleticsUrl: hs.filter((s) => s.athletics_url).length,
      collegesCalendarUrl: colleges.filter((c) => c.calendar_url).length,
      collegesAthleticsUrl: colleges.filter((c) => c.athletics_url).length,
      projectionTargets: projections.length,
      datedParsedEvents: datedEvents.length,
      datedPendingReview: pendingDated.length,
      stagedSchoolEvents: stagedCandidates.length,
      approvedPublicEvents: approvedEvents.length,
      pass28TargetMet: datedEvents.length >= 150,
    },
    platformCounts,
    lanes: laneCounts,
    targetLanes: [
      "school_board",
      "football",
      "basketball",
      "band_concert",
      "homecoming",
      "senior_night",
      "graduation",
      "theater",
      "pto_fundraiser",
      "college_athletics",
      "college_public",
    ],
  };
}

export function writeSchoolHarvestHealth(registryOverride, stagedOverride) {
  const health = computeSchoolHarvestHealth(registryOverride, stagedOverride);
  fs.mkdirSync(path.dirname(PATHS.health), { recursive: true });
  fs.writeFileSync(PATHS.health, JSON.stringify(health, null, 2));
  return health;
}
