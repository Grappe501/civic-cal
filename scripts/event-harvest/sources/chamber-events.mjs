import { ensureDirs, loadJson, writeJson, RAW_DIR, nowIso } from "../lib/paths.mjs";

ensureDirs();

const registry = loadJson("data/ingestion/event-source-registry.json");
const chambers = registry.sources.filter((s) =>
  ["chamber", "tourism", "event_platform"].includes(s.source_type),
);

writeJson(`${RAW_DIR}/chamber-events-checklist-${nowIso().slice(0, 10)}.json`, {
  generatedAt: nowIso(),
  generatedAt_iso: nowIso(),
  sources: chambers,
});

console.log(`[chamber-events] ${chambers.length} tourism/chamber/platform sources listed`);
