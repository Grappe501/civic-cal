#!/usr/bin/env node
/**
 * Pass 29 — Audit fair/festival harvest funnel quality.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const REGISTRY = path.join(ROOT, "data/event-harvest/fair-festival-source-registry.json");
const RAW = path.join(ROOT, "data/ingestion/fair-festival-raw.json");
const STAGED = path.join(ROOT, "data/ingestion/fair-festival-staged.json");
const APPROVED = path.join(ROOT, "data/ingestion/fair-festival-approved-events.json");

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

  const sourceCount = registry?.sources?.length ?? 0;
  const rawCount = raw?.records?.length ?? 0;
  const stagedCount = staged?.candidates?.length ?? 0;
  const datedCount = staged?.dated_events?.length ?? 0;
  const approvedCount = approved?.events?.length ?? 0;

  if (!registry) issues.push("Missing fair-festival-source-registry.json");
  if (!raw) issues.push("Missing fair-festival-raw.json — run npm run harvest:fairs-festivals");
  if (sourceCount < 20) issues.push(`Low source registry count: ${sourceCount} (expected 20+)`);
  if (rawCount === 0) issues.push("Zero raw harvest records");
  if (datedCount < 7) issues.push(`Low dated staged count: ${datedCount} (expected 7+ from source-backed 2026 pages)`);
  if (approvedCount < 7) issues.push(`Low approved count: ${approvedCount} (expected 7+ source-backed)`);

  const badApproved = (approved?.events ?? []).filter(
    (e) => !e.title || !e.startAt || !e.county || !e.source || e.source === "fair_festival_harvest",
  );
  if (badApproved.length) issues.push(`${badApproved.length} approved events missing title/date/county/source URL`);

  if (issues.length) {
    console.error("audit:fairs-festivals FAILED");
    for (const i of issues) console.error(`  - ${i}`);
    console.error("\nFunnel:", JSON.stringify({ sourceCount, rawCount, stagedCount, datedCount, approvedCount }, null, 2));
    process.exit(1);
  }

  const counties = [...new Set((approved?.events ?? []).map((e) => e.county).filter(Boolean))].sort();
  console.log("audit:fairs-festivals — OK");
  console.log(`  sources: ${sourceCount}`);
  console.log(`  raw: ${rawCount}`);
  console.log(`  staged: ${stagedCount} (dated: ${datedCount})`);
  console.log(`  approved: ${approvedCount}`);
  console.log(`  counties: ${counties.length} — ${counties.slice(0, 12).join(", ")}${counties.length > 12 ? "…" : ""}`);
}

main();
