#!/usr/bin/env node
/**
 * Pass 34 — Approve source-backed agriculture / Extension events only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getHarvestWindow, isDateInHarvestWindow } from "../lib/harvest-window.mjs";
import { slugify } from "./lib/ag-base.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const STAGED = path.join(ROOT, "data/ingestion/agriculture-staged.json");
const APPROVED = path.join(ROOT, "data/agriculture/agriculture-event-approved-events.json");

const TRUSTED = new Set(["extension_4h_page", "uaex_calendar", "farm_bureau_page", "farmers_market_directory"]);

function candidateToEvent(c) {
  const startAt = new Date(`${c.event_date}T15:00:00-05:00`).toISOString();
  let endAt = null;
  if (c.end_date && c.end_date !== c.event_date) {
    endAt = new Date(`${c.end_date}T23:00:00-05:00`).toISOString();
  }

  return {
    id: `ag-harvest-${c.id}`,
    slug: slugify(`${c.title}-${c.event_date}-${c.county}-ag`),
    title: c.title,
    description: c.description,
    startAt,
    endAt,
    allDay: !String(c.title).match(/\d{1,2}:\d{2}/),
    timezone: "America/Chicago",
    city: c.city ?? null,
    county: c.county,
    category: "community",
    hostOrganization: `${c.county} County Extension`,
    status: "approved",
    source: c.source_url,
    websiteUrl: c.source_url,
    highCivicValue: true,
    isFamilyFriendly: true,
    intelligenceLayer: "community_anchor",
    relationshipDensityScore: c.relationship_density_score ?? 68,
    harvestBatch: c.harvest_batch ?? "agriculture_lane_pass34",
  };
}

function main() {
  const window = getHarvestWindow();
  const staged = fs.existsSync(STAGED) ? JSON.parse(fs.readFileSync(STAGED, "utf8")) : { candidates: [] };
  const prev = fs.existsSync(APPROVED) ? JSON.parse(fs.readFileSync(APPROVED, "utf8")) : { events: [] };

  const bySlug = new Map((prev.events ?? []).map((e) => [e.slug, e]));
  let added = 0;

  for (const c of staged.candidates ?? []) {
    if (!c.event_date || !isDateInHarvestWindow(c.event_date, window)) continue;
    if (!c.source_url) continue;
    if (c.source_confidence != null && c.source_confidence < 55) continue;
    if (c.source_type && !TRUSTED.has(c.source_type) && c.source_confidence < 70) continue;

    const event = candidateToEvent(c);
    if (!bySlug.has(event.slug)) {
      bySlug.set(event.slug, event);
      added++;
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    pass: "34",
    harvestWindow: window.label,
    events: [...bySlug.values()],
  };

  fs.mkdirSync(path.dirname(APPROVED), { recursive: true });
  fs.writeFileSync(APPROVED, JSON.stringify(out, null, 2));
  console.log(`[approve:agriculture] +${added} approved · total public:${out.events.length}`);
}

main();
