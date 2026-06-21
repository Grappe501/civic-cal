import fs from "node:fs";
import { searchWeb, hasSearchProvider } from "./lib/search-provider.mjs";
import {
  ensureDirs,
  loadJson,
  writeJson,
  RAW_DIR,
  STAGED_FILE,
  buildCityQueries,
  nowIso,
} from "./lib/paths.mjs";
import { normalizeFromSearchHit } from "./normalize-event-candidate.mjs";
import { dedupeCandidates } from "./lib/dedupe-logic.mjs";

const cityArg = process.argv.slice(2).join(" ").trim();
if (!cityArg) {
  console.error('Usage: node harvest-city.mjs "Center Ridge"');
  process.exit(1);
}

ensureDirs();

function findCity(name) {
  for (const file of ["data/arkansas/top-200-priority-cities.json", "data/arkansas/top-100-priority-cities.json"]) {
    try {
      const data = loadJson(file);
      const norm = name.toLowerCase();
      const hit = data.cities.find((c) => c.city.toLowerCase() === norm);
      if (hit) return hit;
    } catch (_) {}
  }
  return null;
}

function loadExistingStaged() {
  if (!fs.existsSync(STAGED_FILE)) return [];
  return JSON.parse(fs.readFileSync(STAGED_FILE, "utf8")).candidates ?? [];
}

async function main() {
  const cityRecord = findCity(cityArg) || {
    city: cityArg,
    county: null,
    region: "unknown",
    priority_rank: 999,
    priority_basis: "ad_hoc_harvest",
  };

  const queries = buildCityQueries(cityRecord);
  const stamp = nowIso().replace(/[:.]/g, "-");
  const rawOut = `${RAW_DIR}/city-${cityRecord.city.toLowerCase().replace(/\s+/g, "-")}-${stamp}.json`;

  const harvested = [];

  if (!hasSearchProvider()) {
    writeJson(rawOut, {
      mode: "query_plan_only",
      city: cityRecord.city,
      county: cityRecord.county,
      queries,
      generatedAt: nowIso(),
      results: [],
    });
    console.log(`[harvest:city] No search API key — ${queries.length} queries planned → ${rawOut}`);
  } else {
    for (const q of queries.slice(0, 5)) {
      try {
        const results = await searchWeb(q, { limit: 5 });
        for (const hit of results) {
          harvested.push(
            normalizeFromSearchHit(hit, {
              city: cityRecord.city,
              county: cityRecord.county,
              source_name: "web_search",
              source_type: "event_platform",
              discovered_by: `harvest_city:${cityRecord.city}`,
            }),
          );
        }
      } catch (e) {
        console.warn(`[harvest:city] query failed: ${q}`, e.message);
      }
    }
    writeJson(rawOut, { city: cityRecord.city, queries, results: harvested, generatedAt: nowIso() });
    console.log(`[harvest:city] ${harvested.length} candidates from search → ${rawOut}`);
  }

  const merged = dedupeCandidates([...loadExistingStaged(), ...harvested]);
  writeJson(STAGED_FILE, {
    generatedAt: nowIso(),
    count: merged.length,
    candidates: merged,
  });
  console.log(`[harvest:city] staged total ${merged.length} → ${STAGED_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
