import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const HARVEST_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const RAW_DIR = path.join(HARVEST_ROOT, "data/ingestion/raw-search-results");
export const STAGED_FILE = path.join(HARVEST_ROOT, "data/ingestion/staged-event-candidates.json");

export function ensureDirs() {
  fs.mkdirSync(RAW_DIR, { recursive: true });
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
  const { city, county } = cityRecord;
  const base = [
    `${city} Arkansas events`,
    `${city} AR chamber events`,
    `${city} Arkansas city council meeting`,
    `${city} Arkansas school board meeting`,
    `${city} Arkansas festival`,
    `${city} Arkansas church dinner`,
    `${city} Arkansas spaghetti supper`,
    `${city} Arkansas fish fry`,
    `${city} Arkansas BBQ fundraiser`,
    `${city} Arkansas football schedule`,
  ];
  if (county) base.push(`${county} County Arkansas quorum court meeting`);
  return base;
}

export function nowIso() {
  return new Date().toISOString();
}
