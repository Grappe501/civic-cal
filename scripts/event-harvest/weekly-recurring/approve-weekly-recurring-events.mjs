#!/usr/bin/env node
/**
 * Pass 37 — Approve source-backed weekly recurring occurrences.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getHarvestWindow, isDateInHarvestWindow } from "../lib/harvest-window.mjs";
import { slugify } from "./lib/wr-base.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const STAGED = path.join(ROOT, "data/ingestion/weekly-recurring-staged.json");
const APPROVED = path.join(ROOT, "data/weekly-recurring/weekly-recurring-approved-events.json");

const TRUSTED = new Set([
  "weekly_recurring_directory",
  "library_public_calendar",
  "service_club_public_page",
  "city_parks_calendar",
]);

function candidateToEvent(c) {
  const time = c.start_time && /^\d{2}:\d{2}$/.test(c.start_time) ? c.start_time : "09:00";
  const startAt = new Date(`${c.event_date}T${time}:00-05:00`).toISOString();

  return {
    id: `wr-${c.id}`,
    slug: slugify(`${c.title}-${c.event_date}-${c.city}-weekly`),
    title: c.title,
    description: c.description,
    startAt,
    endAt: null,
    allDay: false,
    timezone: "America/Chicago",
    city: c.city,
    county: c.county,
    category: c.category ?? "community",
    hostOrganization: c.host_organization,
    status: "approved",
    source: c.source_url,
    websiteUrl: null,
    isRecurring: true,
    isFamilyFriendly: true,
    highCivicValue: c.sub_lane === "37G_service_club",
    intelligenceLayer: c.sub_lane === "37G_service_club" ? "civic_institution" : "community_anchor",
    relationshipDensityScore: c.relationship_density_score ?? 62,
    harvestBatch: c.harvest_batch ?? "weekly_recurring_pass37",
    recurringRegistryId: c.series_key,
    festivalCategory: c.sub_lane,
  };
}

function main() {
  const window = getHarvestWindow();
  const minConfidence = Number(process.env.WR_APPROVE_MIN_CONFIDENCE ?? 58);
  const staged = fs.existsSync(STAGED) ? JSON.parse(fs.readFileSync(STAGED, "utf8")) : { candidates: [] };
  const prev = fs.existsSync(APPROVED) ? JSON.parse(fs.readFileSync(APPROVED, "utf8")) : { events: [] };

  const bySlug = new Map((prev.events ?? []).map((e) => [e.slug, e]));
  let added = 0;
  let skipped = 0;

  for (const c of staged.candidates ?? []) {
    if (!c.event_date || !isDateInHarvestWindow(c.event_date, window)) {
      skipped++;
      continue;
    }
    if ((c.source_confidence ?? 0) < minConfidence) {
      skipped++;
      continue;
    }
    if (c.source_type && !TRUSTED.has(c.source_type) && (c.source_confidence ?? 0) < 70) {
      skipped++;
      continue;
    }
    if (!c.is_recurring_series || !c.series_key) {
      skipped++;
      continue;
    }

    const event = candidateToEvent(c);
    if (!bySlug.has(event.slug)) {
      bySlug.set(event.slug, event);
      added++;
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    pass: "37",
    harvestWindow: window.label,
    minConfidence,
    events: [...bySlug.values()],
  };

  fs.mkdirSync(path.dirname(APPROVED), { recursive: true });
  fs.writeFileSync(APPROVED, JSON.stringify(out, null, 2));
  console.log(`[approve:weekly-recurring] +${added} approved · total:${out.events.length} · skipped:${skipped}`);
}

main();
