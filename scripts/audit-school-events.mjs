#!/usr/bin/env node
/**
 * Pass 28 — audit school event harvest quality and Pass 28 targets.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeSchoolHarvestHealth } from "./schools/lib/school-harvest-health.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STAGED = path.join(ROOT, "data/ingestion/school-events-staged.json");
const PARSED = path.join(ROOT, "data/ingestion/school-events-parsed-dated.json");

function load(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const issues = [];
  const staged = load(STAGED);
  const parsed = load(PARSED);
  const health = computeSchoolHarvestHealth();

  const dated = staged?.dated_events ?? parsed?.events ?? [];
  const projections = (staged?.candidates ?? []).filter((c) => !c.event_date);

  if (!staged) issues.push("Missing school-events-staged.json — run npm run schools:harvest-calendars");
  if (dated.length < 150) issues.push(`Pass 28 target miss: ${dated.length}/150 dated parsed events`);
  if (projections.length < 800) issues.push(`Low projection count: ${projections.length} (expected ~865 targets)`);

  const missingFields = dated.filter(
    (c) => !c.title || !c.event_date || !c.source_name || !c.source_url || (c.confidence_score ?? 0) < 50,
  );
  if (missingFields.length) issues.push(`${missingFields.length} dated events missing required approval fields`);

  const autoPublished = dated.filter((c) => c.review_status === "approved");
  if (autoPublished.length) issues.push(`${autoPublished.length} dated events marked approved in staged (should be review-only until explicit approve)`);

  if (issues.length) {
    console.error("audit:school-events FAILED");
    for (const i of issues) console.error(`  - ${i}`);
    console.error("\nFunnel:", JSON.stringify(health.funnel, null, 2));
    process.exit(1);
  }

  console.log("audit:school-events — OK");
  console.log(`  dated parsed: ${dated.length}`);
  console.log(`  projections: ${projections.length}`);
  console.log(`  platforms: ${JSON.stringify(health.platformCounts ?? {})}`);
}

main();
