#!/usr/bin/env node
/**
 * Pass 35 — Build event page enrichment tasks from quality gaps.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "data/event-intelligence/event-page-enrichment-tasks.json");

const BUNDLES = [
  "data/seed-events.json",
  "data/ingestion/political-party-meetings-approved-events.json",
  "data/ingestion/school-events-approved-events.json",
  "data/ingestion/fair-festival-approved-events.json",
  "data/ingestion/county-fair-approved-events.json",
  "data/ingestion/historic-political-events-approved-events.json",
  "data/ingestion/top250-city-festival-approved-events.json",
  "data/agriculture/agriculture-event-approved-events.json",
];

function loadEvents() {
  const bySlug = new Map();
  for (const rel of BUNDLES) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) continue;
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    for (const e of data.events ?? []) {
      if (e?.slug && !bySlug.has(e.slug)) bySlug.set(e.slug, e);
    }
  }
  return [...bySlug.values()];
}

function score(event) {
  const missing = [];
  if (!event.description || event.description.length < 40) missing.push("description");
  if (!event.websiteUrl && !event.source) missing.push("official_link");
  if (!event.hostOrganization) missing.push("host");
  if (!event.address && !event.locationName) missing.push("location_detail");
  if (event.isFree == null) missing.push("cost");
  if (!event.city) missing.push("city");
  const priority =
    /fair|festival|county committee|fish fry/i.test(event.title) || event.highCivicValue
      ? "high"
      : event.featured
        ? "medium"
        : "low";
  return { missing, priority };
}

function main() {
  const events = loadEvents().filter((e) => (e.status ?? "approved") === "approved");
  const tasks = [];

  for (const event of events) {
    const { missing, priority } = score(event);
    if (missing.length === 0) continue;
    tasks.push({
      event_slug: event.slug,
      event_title: event.title,
      county: event.county,
      missing_fields: missing,
      suggested_sources: [
        event.websiteUrl,
        event.source,
        event.county ? `https://www.uaex.uada.edu/counties/${event.county.toLowerCase().replace(/\s+/g, "-")}/` : null,
      ].filter(Boolean),
      suggested_queries: [
        `${event.title} ${event.county} County Arkansas parking`,
        `${event.title} official site`,
        `${event.hostOrganization ?? event.title} calendar 2026`,
      ],
      priority,
      reason: `Event page missing: ${missing.join(", ")}`,
      status: "open",
      created_at: new Date().toISOString(),
    });
  }

  tasks.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.priority] - rank[b.priority] || a.event_title.localeCompare(b.event_title);
  });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        pass: "35",
        openCount: tasks.filter((t) => t.status === "open").length,
        tasks,
      },
      null,
      2,
    ),
  );

  console.log(`[events:enrichment-tasks] ${tasks.length} tasks · high: ${tasks.filter((t) => t.priority === "high").length}`);
}

main();
