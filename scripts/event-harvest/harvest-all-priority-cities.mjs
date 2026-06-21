import fs from "node:fs";
import { ensureDirs, loadJson, writeJson, STAGED_FILE, RAW_DIR, buildCityQueries, nowIso } from "./lib/paths.mjs";

ensureDirs();

function loadExistingStaged() {
  if (!fs.existsSync(STAGED_FILE)) return [];
  return JSON.parse(fs.readFileSync(STAGED_FILE, "utf8")).candidates ?? [];
}

async function main() {
  const { cities } = loadJson("data/arkansas/top-100-priority-cities.json");
  const queryPlans = cities.map((c) => ({
    city: c.city,
    county: c.county,
    priority_rank: c.priority_rank,
    queries: buildCityQueries(c),
  }));

  const outPath = `${RAW_DIR}/priority-cities-query-plan-${nowIso().slice(0, 10)}.json`;
  writeJson(outPath, {
    mode: "batch_query_plan",
    generatedAt: nowIso(),
    cityCount: queryPlans.length,
    note: "Run harvest-city.mjs per city or add BING_SEARCH_API_KEY / GOOGLE_CUSTOM_SEARCH_* for automated fetch.",
    cities: queryPlans,
  });

  const existing = loadExistingStaged();
  writeJson(STAGED_FILE, {
    generatedAt: nowIso(),
    count: existing.length,
    candidates: existing,
    queryPlanFile: outPath,
  });

  console.log(`[harvest:priority-cities] ${queryPlans.length} cities → ${outPath}`);
}

main();
