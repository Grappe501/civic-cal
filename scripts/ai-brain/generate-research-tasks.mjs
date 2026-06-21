/**
 * Generate / refresh AI Brain research tasks from coverage gaps.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA = path.join(ROOT, "data");
const OUT = path.join(DATA, "ai-brain", "research-tasks.json");

function readJson(rel) {
  const p = path.join(DATA, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const place = readJson("ai-brain/place-index.json") ?? { thinCounties: [] };
  const feed = readJson("ai-brain/feed-index.json") ?? { thinCounties: [] };
  const fairRegistry = readJson("fairs/arkansas-county-fair-registry.json") ?? { fairs: [] };
  const fairResearch = readJson("ingestion/county-fair-research-tasks.json") ?? { tasks: [] };
  const coverage = readJson("ai-brain/coverage-index.json") ?? {};

  const tasks = [];
  const seen = new Set();

  function add(task) {
    const key = `${task.task_type}|${task.county}|${task.city}|${task.entity}`;
    if (seen.has(key)) return;
    seen.add(key);
    tasks.push({ ...task, status: task.status ?? "open", createdAt: new Date().toISOString() });
  }

  for (const county of place.thinCounties ?? []) {
    add({
      task_type: "county_event_density",
      county,
      city: null,
      entity: county,
      reason: `${county} County has fewer than 3 indexed public events — thin coverage.`,
      suggested_query: `${county} County Arkansas community events calendar 2026`,
      priority: "high",
    });
  }

  for (const county of feed.thinCounties ?? []) {
    add({
      task_type: "feed_attachment",
      county,
      city: null,
      entity: county,
      reason: `${county} County feed attachment below 25% — institutions may be missing calendars.`,
      suggested_query: `${county} County Arkansas school church calendar feed`,
      priority: "medium",
    });
  }

  const countyFairs = (fairRegistry.fairs ?? []).filter((f) => !f.is_state_fair && !f.is_regional_fair);
  for (const fair of countyFairs) {
    if (fair.verification_status === "verified_dated") continue;
    add({
      task_type: "county_fair_dates",
      county: fair.county,
      city: fair.city ?? null,
      entity: fair.fair_name,
      reason: fair.notes || `County fair dates not verified for 2026.`,
      suggested_query: `${fair.fair_name} ${fair.county} County Arkansas 2026 dates`,
      priority: fair.verification_status === "needs_date_confirmation" ? "high" : "medium",
      source_url: fair.source_url ?? fair.cofairs_url ?? null,
      approval_status: "needs_human_review",
    });
  }

  for (const t of fairResearch.tasks ?? []) {
    add({
      task_type: t.task_type ?? "county_fair_dates",
      county: t.county ?? null,
      city: t.city ?? null,
      entity: t.entity ?? t.fair_name ?? null,
      reason: t.reason ?? t.notes ?? "County fair research task from harvest lane.",
      suggested_query: t.suggested_query ?? t.research_query ?? null,
      priority: t.priority ?? "medium",
      status: t.status ?? "open",
      source_url: t.source_url ?? null,
      approval_status: t.approval_status ?? "needs_human_review",
    });
  }

  if ((coverage.eventsNeedingSource ?? 0) > 0) {
    add({
      task_type: "source_confirmation",
      county: null,
      city: null,
      entity: "events_missing_sources",
      reason: `${coverage.eventsNeedingSource} events need source URL confirmation.`,
      suggested_query: "Review events flagged needsSourceConfirmation in event index",
      priority: "medium",
    });
  }

  tasks.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return (p[a.priority] ?? 9) - (p[b.priority] ?? 9);
  });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        openCount: tasks.filter((t) => t.status === "open").length,
        tasks,
      },
      null,
      2,
    ),
  );
  console.log(`Wrote research-tasks.json (${tasks.length} tasks, ${tasks.filter((t) => t.status === "open").length} open)`);
}

main();
