/**
 * Church Event Engine — expanded harvest queries for community meals & church traditions.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PATTERNS_PATH = path.join(ROOT, "data/institutions/church-event-harvest-patterns.json");

export function loadChurchEventPatterns() {
  try {
    const bundle = JSON.parse(fs.readFileSync(PATTERNS_PATH, "utf8"));
    return bundle.patterns ?? [];
  } catch {
    return [
      "Fish Fry", "Spaghetti Dinner", "BBQ Fundraiser", "Pancake Breakfast",
      "Trunk or Treat", "Fall Festival", "VBS",
    ];
  }
}

export function buildChurchEventQueries(cityRecord) {
  const { city, county } = cityRecord;
  const patterns = loadChurchEventPatterns();
  const queries = patterns.map((pattern) => `${city} Arkansas ${pattern} church`);
  queries.push(`${city} Arkansas church community meal`);
  queries.push(`${city} Arkansas parish dinner`);
  if (county) queries.push(`${county} County Arkansas church fish fry`);
  return queries;
}

export function churchEventSourceTemplate(cityRecord) {
  return {
    source_type: "church_community",
    label: `${cityRecord.city} church community events`,
    search_terms: loadChurchEventPatterns().map((p) => p.toLowerCase()),
    trust: "medium",
    institution_layer: "church_event_engine",
  };
}
