#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const RAW = path.join(ROOT, "data/ingestion/top250-city-festival-raw.json");
const APPROVED = path.join(ROOT, "data/ingestion/top250-city-festival-approved-events.json");
const SUMMARY = path.join(ROOT, "data/ingestion/top250-city-festival-summary.json");

function load(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const issues = [];
  const raw = load(RAW);
  const approved = load(APPROVED);
  const summary = load(SUMMARY);

  const citiesScanned = summary?.citiesScanned ?? raw?.cities?.length ?? 0;
  const approvedCount = approved?.events?.length ?? 0;
  const needsReview = summary?.needsReviewCount ?? 0;

  if (citiesScanned < 250) issues.push(`Expected 250 cities scanned, got ${citiesScanned}`);
  if (approvedCount < 2) issues.push(`Too few approved city festivals: ${approvedCount}`);
  if (summary?.pass !== "32") issues.push(`Expected pass 32 summary, got pass ${summary?.pass}`);
  if (summary?.festivilleStatus !== "approved_2026-09-05") {
    issues.push(`FestiVille not approved with 2026-09-05: ${summary?.festivilleStatus}`);
  }
  if (summary?.roseBudSummerfestStatus !== "approved_2026-06-18") {
    issues.push(`Rose Bud Summerfest missing: ${summary?.roseBudSummerfestStatus}`);
  }
  if (approvedCount < 500) {
    console.warn(`audit:city-festivals — Pass 32 target 500+ approved; current ${approvedCount} (pipeline continues)`);
  }

  if (issues.length) {
    console.error("audit:city-festivals FAILED");
    for (const i of issues) console.error(`  - ${i}`);
    console.error("\nSummary:", JSON.stringify(summary, null, 2));
    process.exit(1);
  }

  console.log("audit:city-festivals — OK");
  console.log(`  cities scanned: ${citiesScanned}`);
  console.log(`  approved public: ${approvedCount}`);
  console.log(`  needs review: ${needsReview}`);
  console.log(`  FestiVille: ${summary?.festivilleStatus}`);
  console.log(`  Rose Bud Summerfest: ${summary?.roseBudSummerfestStatus}`);
}

main();
