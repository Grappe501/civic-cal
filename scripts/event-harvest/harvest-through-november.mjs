#!/usr/bin/env node
/** Alias harvest through November 1, 2026 — sets horizon defaults via harvest-window.mjs */
import { getHarvestWindow } from "./lib/harvest-window.mjs";
import { harvestTop200 } from "./lib/harvest-top200-core.mjs";
import { HARVEST_SUMMARY_TOP200_FILE } from "./lib/paths.mjs";

async function main() {
  const window = getHarvestWindow();
  console.log(`[harvest:november] horizon ${window.start} → ${window.end}`);
  const summary = await harvestTop200();
  console.log(`[harvest:november] complete — ${summary.candidate_events_staged} candidates staged`);
  console.log(`[harvest:november] summary → ${HARVEST_SUMMARY_TOP200_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
