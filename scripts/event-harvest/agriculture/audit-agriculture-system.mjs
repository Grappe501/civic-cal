#!/usr/bin/env node
/**
 * Pass 34 — Audit agriculture institution + event lane coverage.
 */
import { loadJson } from "./lib/ag-base.mjs";

function main() {
  const registry = loadJson("data/agriculture/agriculture-institution-registry.json", { institutions: [] });
  const approved = loadJson("data/agriculture/agriculture-event-approved-events.json", { events: [] });
  const research = loadJson("data/agriculture/agriculture-research-tasks.json", { tasks: [] });
  const staged = loadJson("data/ingestion/agriculture-staged.json", { candidates: [] });

  const byType = {};
  const byCounty = new Set();
  let extension = 0;
  let fourH = 0;
  let homemakers = 0;
  let farmBureau = 0;
  let farmersMarkets = 0;

  for (const inst of registry.institutions ?? []) {
    byType[inst.type] = (byType[inst.type] ?? 0) + 1;
    byCounty.add(inst.county);
    if (inst.type === "extension_office") extension++;
    if (inst.type === "four_h") fourH++;
    if (inst.type === "extension_homemakers") homemakers++;
    if (inst.type === "farm_bureau") farmBureau++;
    if (inst.type === "farmers_market") farmersMarkets++;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    pass: "34",
    institutionProfiles: registry.institutionCount ?? registry.institutions?.length ?? 0,
    countiesCovered: byCounty.size,
    approvedEvents: approved.events?.length ?? 0,
    stagedCandidates: staged.candidates?.length ?? 0,
    openResearchTasks: (research.tasks ?? []).filter((t) => t.status === "open").length,
    coverage: {
      extension_office: extension,
      four_h: fourH,
      extension_homemakers: homemakers,
      farm_bureau: farmBureau,
      farmers_market: farmersMarkets,
    },
    byType,
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
