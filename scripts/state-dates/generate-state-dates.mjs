#!/usr/bin/env node
/**
 * Generate statewide calendar dates JSON from source registry.
 * Run: npm run generate:state-dates
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REGISTRY = path.join(ROOT, "data/state-dates/source-registry.json");
const DATES = path.join(ROOT, "data/state-dates/statewide-calendar-dates.json");
const OUT = path.join(ROOT, "data/state-dates/generated-manifest.json");

const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
const dates = JSON.parse(fs.readFileSync(DATES, "utf8"));

const manifest = {
  generated_at: new Date().toISOString().slice(0, 10),
  policy: dates.policy,
  source_count: registry.sources.length,
  date_count: dates.dates.length,
  verified_count: dates.dates.filter((d) => d.verification_status === "verified").length,
  needs_review_count: dates.dates.filter((d) => d.verification_status === "needs_review").length,
  harvest_tasks: registry.harvest_tasks,
  sources: registry.sources.map((s) => ({ id: s.id, name: s.name, url: s.url })),
};

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Wrote ${OUT} — ${manifest.verified_count} verified, ${manifest.needs_review_count} needs review`);
