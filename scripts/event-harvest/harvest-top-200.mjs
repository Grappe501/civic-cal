#!/usr/bin/env node
/** Harvest public events for top-200 Arkansas cities through harvest horizon */
import { harvestTop200 } from "./lib/harvest-top200-core.mjs";
import { STAGED_TOP200_FILE, HARVEST_SUMMARY_TOP200_FILE } from "./lib/paths.mjs";

async function main() {
  const summary = await harvestTop200();
  console.log(`[harvest:top200] cities=${summary.cities_searched} staged=${summary.candidate_events_staged}`);
  console.log(`[harvest:top200] high-value=${summary.high_value_events} needs-review=${summary.needs_review_count}`);
  console.log(`[harvest:top200] → ${STAGED_TOP200_FILE}`);
  console.log(`[harvest:top200] summary → ${HARVEST_SUMMARY_TOP200_FILE}`);
  if (summary.top_25_high_value?.length) {
    console.log("[harvest:top200] top events:");
    for (const e of summary.top_25_high_value.slice(0, 5)) {
      console.log(`  · ${e.title} (${e.city}) PO=${e.po}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
