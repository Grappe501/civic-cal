import fs from "node:fs";
import { ensureDirs, loadJson, writeJson, STAGED_FILE, nowIso } from "./lib/paths.mjs";
import { normalizeFromRegistry } from "./normalize-event-candidate.mjs";
import { dedupeCandidates } from "./lib/dedupe-logic.mjs";

ensureDirs();

function loadExisting() {
  if (!fs.existsSync(STAGED_FILE)) return [];
  return JSON.parse(fs.readFileSync(STAGED_FILE, "utf8")).candidates ?? [];
}

const registry = loadJson("data/ingestion/recurring-events-registry.json");
const fromRegistry = (registry.traditions ?? []).map(normalizeFromRegistry);
const merged = dedupeCandidates([...loadExisting(), ...fromRegistry]);

writeJson(STAGED_FILE, {
  generatedAt: nowIso(),
  count: merged.length,
  source: "recurring-events-registry.json",
  candidates: merged,
});

console.log(`[harvest:registry] ${fromRegistry.length} traditions merged → ${merged.length} total staged`);
