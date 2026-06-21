import { ensureDirs, loadJson, writeJson, RAW_DIR, nowIso } from "../lib/paths.mjs";

ensureDirs();

const registry = loadJson("data/ingestion/event-source-registry.json");
const schools = registry.sources.filter((s) => s.source_type === "school_district");

writeJson(`${RAW_DIR}/school-calendars-checklist-${nowIso().slice(0, 10)}.json`, {
  generatedAt: nowIso(),
  mode: "checklist",
  note: "Add district calendar URLs to event-source-registry.json as they are verified.",
  sources: schools.length ? schools : [{ source_id: "placeholder", note: "Add school_district sources to registry" }],
});

console.log("[school-calendars] checklist written");
