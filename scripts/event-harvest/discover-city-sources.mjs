#!/usr/bin/env node
/** Discover likely public calendar sources for top-200 Arkansas cities */
import { discoverCitySources, loadTop200Cities } from "./lib/harvest-top200-core.mjs";
import { DISCOVERED_SOURCES_FILE } from "./lib/paths.mjs";
import { hasSearchProvider } from "./lib/search-provider.mjs";
import { getHarvestWindow } from "./lib/harvest-window.mjs";

async function main() {
  const window = getHarvestWindow();
  const cities = loadTop200Cities();
  const discovered = discoverCitySources(cities);

  console.log(`[discover:sources] ${cities.length} cities · window ${window.label}`);
  console.log(`[discover:sources] search provider: ${hasSearchProvider() ? "yes" : "no (template mode)"}`);
  console.log(`[discover:sources] → ${DISCOVERED_SOURCES_FILE}`);
  console.log(`[discover:sources] ${discovered.reduce((n, d) => n + d.source_templates.length, 0)} source templates staged`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
