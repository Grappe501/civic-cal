#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const REGISTRY = path.join(ROOT, "data/fairs/arkansas-county-fair-registry.json");
const INSTITUTIONS = path.join(ROOT, "data/fairs/county-fair-institution-profiles.json");
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
  const institutions = load(INSTITUTIONS);
  const staged = load(STAGED);
  const approved = load(APPROVED);
  const research = load(RESEARCH);

  const countyFairs = (registry?.fairs ?? []).filter((f) => !f.is_regional_fair && !f.is_state_fair);
  const countyCount = countyFairs.length;
  const verifiedDated = countyFairs.filter((f) => f.verification_status === "verified_dated").length;
  const needsReview = research?.openCount ?? research?.tasks?.length ?? 0;
  const approvedCount = approved?.events?.length ?? 0;
  const profileCount = institutions?.profileCount ?? institutions?.profiles?.length ?? 0;
  const regional = (load(RAW)?.records ?? []).filter((r) => r.is_regional_fair).length;
  const stateFair = (load(RAW)?.records ?? []).find((r) => r.is_state_fair);

  if (countyCount !== 75) issues.push(`Expected 75 county fair records, got ${countyCount}`);
  if (!staged) issues.push("Missing county-fair-staged.json");
  if (profileCount < 75) issues.push(`Expected 75 institution profiles, got ${profileCount}`);
  if (verifiedDated < 30) issues.push(`Low verified dated county fairs: ${verifiedDated} (floor >= 30)`);
  if (approvedCount < 30) issues.push(`Low approved public fair events: ${approvedCount} (floor >= 30)`);

  const pope = countyFairs.find((f) => f.county === "Pope");
  if (!pope || pope.verification_status !== "verified_dated") {
    issues.push("Pope County Fair must remain verified_dated");
  }

  if (issues.length) {
    console.error("audit:county-fairs FAILED");
  for (const i of issues) console.error(`  - ${i}`);
    console.error(
      "\nFunnel:",
      JSON.stringify({ countyCount, verifiedDated, needsReview, approvedCount, profileCount, regional, stateFair: stateFair?.verification_status }, null, 2),
    );
    process.exit(1);
  }

  if (verifiedDated < 75) {
    console.warn(`audit:county-fairs — Pass 33 target 75 verified; current ${verifiedDated} (${needsReview} research tasks open)`);
  }

  console.log("audit:county-fairs — OK");
  console.log(`  counties: ${countyCount}`);
  console.log(`  verified dated: ${verifiedDated}`);
  console.log(`  institution profiles: ${profileCount}`);
  console.log(`  needs confirmation: ${needsReview}`);
  console.log(`  approved public: ${approvedCount}`);
  console.log(`  regional fairs tracked: ${regional}`);
  console.log(`  state fair: ${stateFair?.verification_status ?? "unknown"}`);
}

main();
