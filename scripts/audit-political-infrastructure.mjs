#!/usr/bin/env node
/** Pass 25 — audit political infrastructure coverage fairness and neutrality. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COVERAGE = path.join(ROOT, "data/political-infrastructure/county-infrastructure-coverage.json");
const ORGS = path.join(ROOT, "data/political-infrastructure/party-organizations.json");
const SUMMARY = path.join(ROOT, "data/ingestion/political-party-meetings-summary.json");

function read(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const issues = [];
  if (!fs.existsSync(COVERAGE)) issues.push("Missing county-infrastructure-coverage.json — run npm run build:political-infrastructure");
  if (!fs.existsSync(ORGS)) issues.push("Missing party-organizations.json");

  if (issues.length) {
    console.error("audit:political-infrastructure FAILED\n" + issues.join("\n"));
    process.exit(1);
  }

  const coverage = read(COVERAGE);
  const orgs = read(ORGS);
  const summary = fs.existsSync(SUMMARY) ? read(SUMMARY) : {};

  const counties = coverage.counties ?? [];
  if (counties.length !== 75) issues.push(`Expected 75 counties, got ${counties.length}`);

  const demOrgs = (orgs.organizations ?? []).filter((o) => o.partyLabel === "Democratic");
  if (demOrgs.length !== 75) issues.push(`Expected 75 Democratic org profiles, got ${demOrgs.length}`);

  const repWithSchedule = (orgs.organizations ?? []).filter((o) => o.partyLabel === "Republican" && o.meetingSchedule).length;
  if (repWithSchedule < 55) issues.push(`Republican schedule coverage low: ${repWithSchedule}/75`);

  for (const o of orgs.organizations ?? []) {
    if ((o.description || o.name || "").match(/endorse|vote for|better party/i)) {
      issues.push(`Possible partisan language in org ${o.slug}`);
    }
  }

  if (issues.length) {
    console.error("audit:political-infrastructure FAILED\n" + issues.map((i) => `- ${i}`).join("\n"));
    process.exit(1);
  }

  console.log("audit:political-infrastructure — OK");
  console.log(`  Counties: ${counties.length} · Org profiles: ${orgs.count ?? orgs.organizations?.length}`);
  console.log(`  R with schedule: ${repWithSchedule} · Staged: ${summary.stagedCandidates ?? "?"}`);
}

main();
