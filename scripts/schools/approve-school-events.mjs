#!/usr/bin/env node
/**
 * Pass 27 — CLI to approve parsed school events with dates.
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { approveAllParsed } = require("./lib/school-event-approval.cjs");
const { writeSchoolHarvestHealth } = await import("./lib/school-harvest-health.mjs");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function main() {
  const args = process.argv.slice(2);
  const autoAll = args.includes("--all-parsed");
  const minArg = args.find((a) => a.startsWith("--min-confidence="));
  const minConfidence = minArg ? Number(minArg.split("=")[1]) : 50;

  if (!autoAll) {
    console.log("Usage: npm run schools:approve-events -- --all-parsed [--min-confidence=50]");
    process.exit(0);
  }

  const result = approveAllParsed({ minConfidence });
  const registryPath = path.join(ROOT, "data/schools/school-harvest-registry.json");
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const health = writeSchoolHarvestHealth(registry);

  console.log(`[schools:approve-events] +${result.approved} approved · total public:${result.totalApproved}`);
  console.log(`[schools:approve-events] funnel approved:${health.funnel.approvedPublicEvents}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
