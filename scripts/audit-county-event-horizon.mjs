#!/usr/bin/env node
/**
 * Report per-county event counts: visible window (now → Nov 3) vs held post-election.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ELECTION_LAST = "2026-11-03";
const TODAY = new Date().toISOString().slice(0, 10);

function loadBundledEvents() {
  const bundles = [
    "data/seed-events.json",
    "data/seed-events-public-demo.json",
    "data/ingestion/political-party-meetings-approved-events.json",
    "data/ingestion/school-events-approved-events.json",
    "data/ingestion/fair-festival-approved-events.json",
    "data/ingestion/county-fair-approved-events.json",
    "data/ingestion/historic-political-events-approved-events.json",
    "data/ingestion/top250-city-festival-approved-events.json",
    "data/agriculture/agriculture-event-approved-events.json",
  ];
  const bySlug = new Map();
  for (const rel of bundles) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) continue;
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    for (const e of data.events ?? []) {
      if (!bySlug.has(e.slug)) bySlug.set(e.slug, e);
    }
  }
  return [...bySlug.values()];
}

function dayKey(event) {
  return event.startAt?.slice(0, 10) ?? null;
}

function main() {
  const events = loadBundledEvents();
  const byCounty = new Map();

  for (const e of events) {
    if ((e.status ?? "approved") !== "approved") continue;
    const county = e.county || "Unknown";
    const row = byCounty.get(county) ?? { county, visibleWindow: 0, heldPostElection: 0, total: 0 };
    row.total++;
    const day = dayKey(e);
    if (day && day >= TODAY && day <= ELECTION_LAST) row.visibleWindow++;
    if (day && day > ELECTION_LAST) row.heldPostElection++;
    byCounty.set(county, row);
  }

  const rows = [...byCounty.values()].sort((a, b) => b.visibleWindow - a.visibleWindow || a.county.localeCompare(b.county));
  const totals = rows.reduce(
    (acc, r) => {
      acc.visibleWindow += r.visibleWindow;
      acc.heldPostElection += r.heldPostElection;
      acc.total += r.total;
      return acc;
    },
    { visibleWindow: 0, heldPostElection: 0, total: 0 },
  );

  console.log(`County event horizon (${TODAY} → ${ELECTION_LAST} public window)`);
  console.log(`Totals: visible window ${totals.visibleWindow} · held post-election ${totals.heldPostElection} · catalog ${totals.total}`);
  console.log("");
  for (const r of rows) {
    console.log(`${r.county.padEnd(16)} visible:${String(r.visibleWindow).padStart(4)}  held:${String(r.heldPostElection).padStart(3)}  total:${r.total}`);
  }
}

main();
