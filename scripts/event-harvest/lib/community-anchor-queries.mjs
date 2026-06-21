/**
 * Community Anchor Intelligence Engine — harvest queries for Extension, VFD, parades, food trail.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PATTERNS = path.join(ROOT, "data/institutions/community-anchor-harvest-patterns.json");

let cached;

function loadPatterns() {
  if (!cached) cached = JSON.parse(fs.readFileSync(PATTERNS, "utf8"));
  return cached;
}

function expandTemplates(templates, cityRecord) {
  const { city, county } = cityRecord;
  return templates.map((t) =>
    t.replace(/\{city\}/g, city).replace(/\{county\}/g, county ?? ""),
  );
}

export function buildCommunityAnchorQueries(cityRecord) {
  const cfg = loadPatterns();
  const queries = [];

  for (const section of ["extension", "vfd", "parades", "food_trail"]) {
    const block = cfg[section];
    if (!block) continue;
    queries.push(...expandTemplates(block.queryTemplates ?? [], cityRecord));
    for (const pattern of block.patterns ?? []) {
      queries.push(`${cityRecord.city} Arkansas ${pattern}`);
    }
  }

  return [...new Set(queries)];
}
