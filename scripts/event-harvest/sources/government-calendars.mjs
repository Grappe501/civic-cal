/**
 * Government calendar harvester — generates source checklists per registry entry.
 * Safe mode: no scraping without explicit public calendar URL validation.
 */
import { ensureDirs, loadJson, writeJson, RAW_DIR, nowIso } from "../lib/paths.mjs";

ensureDirs();

const registry = loadJson("data/ingestion/event-source-registry.json");
const govSources = registry.sources.filter((s) =>
  ["city_official", "county_official"].includes(s.source_type),
);

writeJson(`${RAW_DIR}/government-calendars-checklist-${nowIso().slice(0, 10)}.json`, {
  generatedAt: nowIso(),
  mode: "checklist",
  note: "Operator verifies each URL has a public meeting calendar before enabling automated parse.",
  sources: govSources.map((s) => ({
    source_id: s.source_id,
    url: s.url,
    county: s.county,
    city: s.city,
    suggested_actions: ["Confirm robots.txt", "Locate ICS/PDF agenda link", "Stage meetings manually if no feed"],
  })),
});

console.log(`[government-calendars] ${govSources.length} sources checklist written`);
