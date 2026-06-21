import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const HARVEST_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const RAW_DIR = path.join(HARVEST_ROOT, "data/ingestion/raw-search-results");
export const STAGED_FILE = path.join(HARVEST_ROOT, "data/ingestion/staged-event-candidates.json");
export const STAGED_TOP200_FILE = path.join(HARVEST_ROOT, "data/ingestion/staged-event-candidates-top-200.json");
export const DISCOVERED_SOURCES_DIR = path.join(HARVEST_ROOT, "data/ingestion/discovered-sources");
export const DISCOVERED_SOURCES_FILE = path.join(DISCOVERED_SOURCES_DIR, "top-200-city-sources.json");
export const HARVEST_SUMMARY_TOP200_FILE = path.join(HARVEST_ROOT, "data/ingestion/harvest-summary-top-200.json");

export function ensureDirs() {
  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.mkdirSync(DISCOVERED_SOURCES_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(STAGED_FILE), { recursive: true });
}

export function loadJson(relPath) {
  const full = path.join(HARVEST_ROOT, relPath);
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

export function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function slugKey(title, city, eventDate) {
  return `${String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-")}|${(city || "").toLowerCase()}|${eventDate || "tbd"}`;
}

export function buildCityQueries(cityRecord) {
  if (cityRecord.search_queries?.length) return cityRecord.search_queries;
  const { city, county } = cityRecord;
  const base = [
    `${city} Arkansas events 2026`,
    `${city} AR calendar`,
    `${city} Arkansas chamber events`,
    `${city} Arkansas city council meeting schedule`,
    `${city} Arkansas school board meeting schedule`,
    `${city} Arkansas festival 2026`,
    `${city} Arkansas fair 2026`,
    `${city} Arkansas church dinner`,
    `${city} Arkansas fish fry`,
    `${city} Arkansas BBQ fundraiser`,
    `${city} Arkansas concert in the park`,
    `${city} Arkansas Third Thursday`,
    `${city} Arkansas First Friday`,
    `${city} Arkansas farmers market`,
    `${city} Arkansas homecoming`,
  ];
  if (county) {
    base.push(`${county} County Arkansas quorum court schedule`);
    base.push(`${county} County Arkansas fair 2026`);
  }
  return base;
}

export function nowIso() {
  return new Date().toISOString();
}
