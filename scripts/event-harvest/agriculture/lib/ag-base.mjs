#!/usr/bin/env node
/**
 * Arkansas Food & Agriculture Ecosystem — shared county + URL helpers (Pass 34).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

export const INSTITUTION_TYPES = [
  "extension_office",
  "four_h",
  "extension_homemakers",
  "ffa",
  "farm_bureau",
  "livestock_association",
  "farmers_market",
  "master_gardener",
  "food_preservation",
  "beekeepers",
  "agritourism",
];

export function countySlug(county) {
  return String(county)
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "-")
    .replace(/'/g, "");
}

export function extensionOfficeUrl(county) {
  return `https://www.uaex.uada.edu/counties/${countySlug(county)}/`;
}

export function farmBureauSearchUrl(county) {
  return `https://www.arfb.com/county-offices/?s=${encodeURIComponent(`${county} County`)}`;
}

export function loadCounties() {
  const p = path.join(ROOT, "data/arkansas-counties.json");
  return JSON.parse(fs.readFileSync(p, "utf8")).counties;
}

export function loadFairInstitutionProfiles() {
  const p = path.join(ROOT, "data/fairs/county-fair-institution-profiles.json");
  if (!fs.existsSync(p)) return [];
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  return data.profiles ?? [];
}

export function fairProfileForCounty(county, profiles) {
  return profiles.find((p) => p.institution?.county === county) ?? null;
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function saveJson(relPath, data) {
  const p = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

export function loadJson(relPath, fallback) {
  const p = path.join(ROOT, relPath);
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export { ROOT };
