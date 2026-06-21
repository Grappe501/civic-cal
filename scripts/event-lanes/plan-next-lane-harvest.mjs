#!/usr/bin/env node
/**
 * Pass 23 — next lane harvest plan from county-lane-coverage.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const COVERAGE_FILE = path.join(ROOT, "data/event-lanes/county-lane-coverage.json");
const REGISTRY_FILE = path.join(ROOT, "data/event-lanes/calendar-lane-registry.json");
const OUT_FILE = path.join(ROOT, "data/event-lanes/lane-harvest-plan.json");

const coverage = JSON.parse(fs.readFileSync(COVERAGE_FILE, "utf8"));
const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf8"));
const phase1 = new Set(registry.buildPhases.phase1.laneIds);
const laneNames = Object.fromEntries(registry.lanes.map((l) => [l.id, l.name]));

const COMMANDS = {
  government_civic: ["npm run discover:sources", "npm run harvest:top200"],
  schools: ["npm run harvest:top200", "npm run density:project"],
  churches: ["npm run harvest:registry", "npm run density:project"],
  community_anchors: ["npm run generate:community-anchors", "npm run density:project"],
  vfds: ["npm run density:project"],
  festivals: ["npm run harvest:registry", "npm run harvest:flagship"],
};

const scored = [];
for (const county of coverage.counties ?? []) {
  for (const row of county.lanes ?? []) {
    if (row.status === "filled") continue;
    if (!phase1.has(row.laneId) && row.coveragePercent > 40) continue;
    const pri = row.harvestPriority === "critical" ? 0 : row.harvestPriority === "high" ? 1 : row.harvestPriority === "medium" ? 2 : 3;
    scored.push({
      sort: pri * 1000 + row.coveragePercent,
      laneId: row.laneId,
      laneName: laneNames[row.laneId] ?? row.shortName,
      county: county.county,
      priority: row.harvestPriority,
      coveragePercent: row.coveragePercent,
      reason: `${row.shortName} at ${row.coveragePercent}% — ${row.eventsIndexed}/${row.expectedSlots} events`,
      suggestedCommands: COMMANDS[row.laneId] ?? ["npm run discover:sources"],
    });
  }
}

scored.sort((a, b) => a.sort - b.sort);
const plan = scored.slice(0, 40).map(({ sort, ...rest }) => rest);

fs.writeFileSync(
  OUT_FILE,
  JSON.stringify({ generatedAt: new Date().toISOString(), plan }, null, 2),
);

console.log(`[lanes:plan] ${plan.length} harvest tasks → data/event-lanes/lane-harvest-plan.json`);
for (const p of plan.slice(0, 8)) {
  console.log(`  · ${p.county} — ${p.laneName} (${p.coveragePercent}%)`);
}
