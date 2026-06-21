/**
 * Pass 27 — funnel metrics for school calendar harvest.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export const PATHS = {
  registry: path.join(ROOT, "data/schools/school-harvest-registry.json"),
  health: path.join(ROOT, "data/schools/school-harvest-health.json"),
  staged: path.join(ROOT, "data/ingestion/school-events-staged.json"),
  approved: path.join(ROOT, "data/ingestion/school-events-approved-events.json"),
};

function loadJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function computeSchoolHarvestHealth(registryOverride) {
  const registry = registryOverride ?? loadJson(PATHS.registry, { high_schools: [], colleges: [] });
  const staged = loadJson(PATHS.staged, { candidates: [] });
  const approved = loadJson(PATHS.approved, { events: [] });

  const hs = registry.high_schools ?? [];
  const colleges = registry.colleges ?? [];

  const hsCalendar = hs.filter((s) => s.calendar_url);
  const hsAthletics = hs.filter((s) => s.athletics_url);
  const collegeCalendar = colleges.filter((c) => c.calendar_url);
  const collegeAthletics = colleges.filter((c) => c.athletics_url);

  const stagedCandidates = staged.candidates ?? [];
  const pendingStaged = stagedCandidates.filter((c) => c.review_status !== "approved" && c.review_status !== "rejected");
  const approvedEvents = approved.events ?? [];

  const laneCounts = {};
  for (const c of stagedCandidates) {
    const lane = c.event_lane ?? "unknown";
    laneCounts[lane] = (laneCounts[lane] ?? 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    pass: "27",
    funnel: {
      highSchoolsDiscovered: hs.length,
      collegesDiscovered: colleges.length,
      highSchoolsCalendarUrl: hsCalendar.length,
      highSchoolsAthleticsUrl: hsAthletics.length,
      collegesCalendarUrl: collegeCalendar.length,
      collegesAthleticsUrl: collegeAthletics.length,
      stagedSchoolEvents: stagedCandidates.length,
      stagedPendingReview: pendingStaged.length,
      approvedPublicEvents: approvedEvents.length,
    },
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

export function writeSchoolHarvestHealth(registryOverride) {
  const health = computeSchoolHarvestHealth(registryOverride);
  fs.mkdirSync(path.dirname(PATHS.health), { recursive: true });
  fs.writeFileSync(PATHS.health, JSON.stringify(health, null, 2));
  return health;
}
