import type { GeoLaneCoverage, LaneHarvestPlanItem } from "./laneTypes";
import { listLanes } from "./laneRegistry";
import { phase1LaneIds } from "./laneRegistry";

const HARVEST_COMMANDS: Record<string, string[]> = {
  government_civic: ["npm run discover:sources", "npm run harvest:top200 (government queries)"],
  schools: ["npm run harvest:top200", "npm run density:project"],
  churches: ["npm run harvest:registry", "npm run density:project"],
  community_anchors: ["npm run generate:community-anchors", "npm run density:project"],
  vfds: ["npm run density:project", "npm run discover:sources"],
  festivals: ["npm run harvest:registry", "npm run harvest:flagship"],
  food_trail: ["npm run harvest:food-trucks"],
  races: ["npm run harvest:top200"],
  sports: ["npm run harvest:top200"],
  music_entertainment: ["npm run discover:sources"],
  volunteer: ["npm run density:project"],
  student_service: ["Review data/student-service/seed-opportunities.json"],
  host_submitted: ["Promote /host portal in county"],
};

export function planNextLaneHarvest(counties: GeoLaneCoverage[], limit = 30): LaneHarvestPlanItem[] {
  const phase1 = new Set(phase1LaneIds());
  const laneMap = new Map(listLanes().map((l) => [l.id, l]));
  const scored: { item: LaneHarvestPlanItem; sort: number }[] = [];

  for (const county of counties) {
    for (const row of county.lanes) {
      if (row.status === "filled") continue;
      if (!phase1.has(row.laneId) && row.coveragePercent > 40) continue;

      const lane = laneMap.get(row.laneId);
      const severity =
        row.harvestPriority === "critical" ? 0 : row.harvestPriority === "high" ? 1 : row.harvestPriority === "medium" ? 2 : 3;

      scored.push({
        sort: severity * 1000 + row.coveragePercent,
        item: {
          laneId: row.laneId,
          laneName: lane?.name ?? row.shortName,
          county: county.county,
          priority: row.harvestPriority,
          coveragePercent: row.coveragePercent,
          reason: `${row.shortName} at ${row.coveragePercent}% — ${row.eventsIndexed}/${row.expectedSlots} events, ${row.sourcesOnFile} sources`,
          suggestedCommands: HARVEST_COMMANDS[row.laneId] ?? ["npm run discover:sources"],
        },
      });
    }
  }

  return scored
    .sort((a, b) => a.sort - b.sort)
    .slice(0, limit)
    .map((s) => s.item);
}

export function summarizePhase1(county: GeoLaneCoverage): { label: string; percent: number }[] {
  const phase1 = new Set(phase1LaneIds());
  return county.lanes
    .filter((l) => phase1.has(l.laneId))
    .map((l) => ({ label: l.shortName, percent: l.coveragePercent }));
}
