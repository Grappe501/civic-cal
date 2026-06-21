/**
 * Shared bundled seed loader — keep in sync with src/lib/events/seedCatalog.ts
 */
const fs = require("node:fs");
const path = require("node:path");

const DATA = path.join(__dirname, "..", "..", "..", "data");

function readEvents(rel) {
  const p = path.join(DATA, rel);
  if (!fs.existsSync(p)) return [];
  const bundle = JSON.parse(fs.readFileSync(p, "utf8"));
  return bundle.events ?? [];
}

function loadBundledSeedEvents() {
  const layers = [
    ["seed-events.json", 0],
    ["seed-events-public-demo.json", 1],
    ["ingestion/political-party-meetings-approved-events.json", 2],
    ["ingestion/school-events-approved-events.json", 3],
    ["ingestion/fair-festival-approved-events.json", 4],
    ["ingestion/county-fair-approved-events.json", 5],
    ["ingestion/historic-political-events-approved-events.json", 6],
    ["ingestion/top250-city-festival-approved-events.json", 7],
    ["agriculture/agriculture-event-approved-events.json", 8],
    ["weekly-recurring/weekly-recurring-approved-events.json", 9],
  ];
  const tagged = [];
  for (const [file, priority] of layers) {
    for (const e of readEvents(file)) {
      if (e?.slug) tagged.push({ event: { ...e, status: e.status || "approved" }, priority });
    }
  }
  tagged.sort((a, b) => a.priority - b.priority);
  const bySlug = new Map();
  for (const { event } of tagged) bySlug.set(event.slug, event);
  return [...bySlug.values()];
}

module.exports = { loadBundledSeedEvents };
