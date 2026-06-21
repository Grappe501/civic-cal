#!/usr/bin/env node
/**
 * Pass 37 — Audit weekly recurring ecosystem.
 */
import { loadJson } from "./lib/wr-base.mjs";

function main() {
  const institutions = loadJson("data/weekly-recurring/weekly-recurring-institution-registry.json", {});
  const series = loadJson("data/weekly-recurring/weekly-recurring-series-registry.json", {});
  const staged = loadJson("data/ingestion/weekly-recurring-staged.json", { candidates: [] });
  const approved = loadJson("data/weekly-recurring/weekly-recurring-approved-events.json", { events: [] });
  const tasks = loadJson("data/weekly-recurring/weekly-recurring-research-tasks.json", { tasks: [] });

  const bySubLane = {};
  for (const s of series.series ?? []) {
    bySubLane[s.sub_lane] = (bySubLane[s.sub_lane] ?? 0) + 1;
  }

  const byCounty = new Map();
  for (const e of approved.events ?? []) {
    byCounty.set(e.county, (byCounty.get(e.county) ?? 0) + 1);
  }

  const report = {
    pass: "37",
    generatedAt: new Date().toISOString(),
    institutions: institutions.institutionCount ?? 0,
    series: series.seriesCount ?? 0,
    stagedOccurrences: (staged.candidates ?? []).length,
    approvedPublicEvents: (approved.events ?? []).length,
    openResearchTasks: (tasks.tasks ?? []).filter((t) => t.status === "open").length,
    seriesBySubLane: bySubLane,
    topCounties: [...byCounty.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([county, count]) => ({ county, count })),
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
