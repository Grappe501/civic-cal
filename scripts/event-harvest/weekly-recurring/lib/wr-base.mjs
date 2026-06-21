#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

export const SUB_LANES = [
  "37A_farmers_market",
  "37B_food_truck",
  "37C_library",
  "37D_senior_center",
  "37E_parks_rec",
  "37F_youth_sports",
  "37G_service_club",
  "37H_cruise_car",
  "37I_bingo_community",
];

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function loadCounties() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "data/arkansas-counties.json"), "utf8")).counties;
}

export function loadPriorityCities(limit = 200) {
  const p = path.join(ROOT, "data/arkansas/top-200-priority-cities.json");
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  return (data.cities ?? []).slice(0, limit);
}

export function loadCivicOrganizations() {
  const p = path.join(ROOT, "data/institutions/civic-organizations.json");
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf8")).organizations ?? [];
}

export function orgForCity(orgs, city, type) {
  const c = city.toLowerCase();
  return (
    orgs.find(
      (o) => o.city?.toLowerCase() === c && o.org_type === type,
    ) ?? null
  );
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
