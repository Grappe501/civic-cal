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
  const bySlug = new Map();
  for (const file of [
    "seed-events.json",
    "seed-events-public-demo.json",
    "ingestion/political-party-meetings-approved-events.json",
    "ingestion/school-events-approved-events.json",
    "ingestion/fair-festival-approved-events.json",
  ]) {
    for (const e of readEvents(file)) {
      if (e?.slug && !bySlug.has(e.slug)) bySlug.set(e.slug, { ...e, status: e.status || "approved" });
    }
  }
  return [...bySlug.values()];
}

module.exports = { loadBundledSeedEvents };
