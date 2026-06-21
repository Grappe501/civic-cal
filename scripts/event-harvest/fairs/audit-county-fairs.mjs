#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const REGISTRY = path.join(ROOT, "data/fairs/arkansas-county-fair-registry.json");
const RAW = path.join(ROOT, "data/ingestion/county-fair-raw.json");
const STAGED = path.join(ROOT, "data/ingestion/county-fair-staged.json");
const APPROVED = path.join(ROOT, "data/ingestion/county-fair-approved-events.json");
const RESEARCH = path.join(ROOT, "data/ingestion/county-fair-research-tasks.json");

function load(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const issues = [];
  const registry = load(REGISTRY);
  const staged = load(STAGED);
  const approved = load(APPROVED);
  const research = load(RESEARCH);

  const countyCount = registry?.countyCount ?? registry?.fairs?.length ?? 0;
  const verifiedDated = (registry?.fairs ?? []).filter((f) => f.verification_status === "verified_dated").length;
  const needsReview = (research?.openCount ?? research?.tasks?.length) ?? 0;
  const approvedCount = approved?.events?.length ?? 0;
  const regional = (load(RAW)?.records ?? []).filter((r) => r.is_regional_fair).length;
  const stateFair = (load(RAW)?.records ?? []).find((r) => r.is_state_fair);

  if (countyCount !== 75) issues.push(`Expected 75 county fair records, got ${countyCount}`);
  if (!staged) issues.push("Missing county-fair-staged.json");
  if (verifiedDated < 13) issues.push(`Low verified dated county fairs: ${verifiedDated} (expected >= 13 after Pass 29B)`);
  if (approvedCount < 13) issues.push(`Low approved public fair events: ${approvedCount} (expected >= 13 after Pass 29B)`);
  if (needsReview + verifiedDated < 70) issues.push(`Registry coverage gap: ${needsReview} research + ${verifiedDated} dated`);

  if (issues.length) {
    console.error("audit:county-fairs FAILED");
    for (const i of issues) console.error(`  - ${i}`);
    console.error(
      "\nFunnel:",
      JSON.stringify({ countyCount, verifiedDated, needsReview, approvedCount, regional, stateFair: stateFair?.verification_status }, null, 2),
    );
    process.exit(1);
  }

  console.log("audit:county-fairs — OK");
  console.log(`  counties: ${countyCount}`);
  console.log(`  verified dated: ${verifiedDated}`);
  console.log(`  needs confirmation: ${needsReview}`);
  console.log(`  approved public: ${approvedCount}`);
  console.log(`  regional fairs tracked: ${regional}`);
  console.log(`  state fair: ${stateFair?.verification_status ?? "unknown"}`);
}

main();
