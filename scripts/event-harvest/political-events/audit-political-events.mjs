#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const REGISTRY = path.join(ROOT, "data/political-events/historic-political-event-registry.json");
const RAW = path.join(ROOT, "data/ingestion/historic-political-events-raw.json");
const STAGED = path.join(ROOT, "data/ingestion/historic-political-events-staged.json");
const APPROVED = path.join(ROOT, "data/ingestion/historic-political-events-approved-events.json");
const RESEARCH = path.join(ROOT, "data/ingestion/historic-political-events-research-tasks.json");

function load(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const issues = [];
  const registry = load(REGISTRY);
  const raw = load(RAW);
  const staged = load(STAGED);
  const approved = load(APPROVED);
  const research = load(RESEARCH);

  const registryCount = registry?.events?.length ?? 0;
  const rawCount = raw?.records?.length ?? 0;
  const stagedCount = staged?.stagedCount ?? (staged?.candidates?.length ?? 0) + (staged?.dated_events?.length ?? 0);
  const approvedCount = approved?.events?.length ?? 0;
  const researchCount = research?.openCount ?? research?.tasks?.length ?? 0;
  const historyCount = (registry?.events ?? []).filter((e) => e.history_available).length;
  const verified2026 = (registry?.events ?? []).filter((e) =>
    (e.verified_dates ?? []).some((d) => d.year === 2026 && d.start),
  ).length;

  if (!registry) issues.push("Missing historic-political-event-registry.json");
  if (registryCount < 10) issues.push(`Low registry count: ${registryCount}`);
  if (!raw) issues.push("Missing historic-political-events-raw.json — run harvest:political-events");
  if (rawCount !== registryCount) issues.push(`Raw/registry mismatch: ${rawCount} vs ${registryCount}`);
  if (!staged) issues.push("Missing historic-political-events-staged.json");
  if (approvedCount < 3) issues.push(`Expected at least 3 approved 2026 events, got ${approvedCount}`);
  if (verified2026 < 3) issues.push(`Expected at least 3 verified 2026 registry dates, got ${verified2026}`);

  if (issues.length) {
    console.error("audit:political-events FAILED");
    for (const i of issues) console.error(`  - ${i}`);
    console.error(
      "\nFunnel:",
      JSON.stringify({ registryCount, rawCount, stagedCount, approvedCount, researchCount, historyCount, verified2026 }, null, 2),
    );
    process.exit(1);
  }

  console.log("audit:political-events — OK");
  console.log(`  registry: ${registryCount}`);
  console.log(`  raw: ${rawCount}`);
  console.log(`  staged: ${stagedCount}`);
  console.log(`  approved public: ${approvedCount}`);
  console.log(`  research tasks: ${researchCount}`);
  console.log(`  history dossiers: ${historyCount}`);
  console.log(`  verified 2026 in registry: ${verified2026}`);
}

main();
