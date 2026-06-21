#!/usr/bin/env node
/**
 * Food truck festival harvest query patterns for event discovery.
 * Run: npm run harvest:food-trucks
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CITIES = path.join(ROOT, "data/event-harvest/top-200-cities.json");
const OUT = path.join(ROOT, "data/event-harvest/food-truck-harvest-queries.json");

const PRIORITY_CITIES = ["Little Rock", "Fayetteville", "Fort Smith", "Springdale", "Jonesboro", "Conway", "Rogers", "Bentonville", "Hot Springs", "North Little Rock"];

let cities = PRIORITY_CITIES;
try {
  const raw = JSON.parse(fs.readFileSync(CITIES, "utf8"));
  if (Array.isArray(raw.cities)) cities = [...new Set([...PRIORITY_CITIES, ...raw.cities.slice(0, 50)])];
} catch (_) {}

const COUNTIES = ["Pulaski", "Washington", "Sebastian", "Benton", "Craighead", "Faulkner", "Garland", "White"];

const patterns = [];
patterns.push({ query: "food truck festival Arkansas", scope: "statewide" });
for (const city of cities) {
  patterns.push({ query: `${city} Arkansas food truck festival`, city, scope: "city" });
  patterns.push({ query: `${city} AR food truck Friday`, city, scope: "city" });
  patterns.push({ query: `${city} Arkansas food truck night`, city, scope: "city" });
  patterns.push({ query: `${city} Arkansas food truck rally`, city, scope: "city" });
  patterns.push({ query: `downtown ${city} food trucks`, city, scope: "city" });
  patterns.push({ query: `${city} Arkansas farmers market food trucks`, city, scope: "city" });
}
for (const county of COUNTIES) {
  patterns.push({ query: `${county} Arkansas food truck festival`, county, scope: "county" });
}

const bundle = {
  generated_at: new Date().toISOString().slice(0, 10),
  category: "food_truck_festival",
  policy: "Official/public sources only — no private Facebook scraping.",
  keyword_match: /food truck|food-truck|food truck festival|food truck rally|food truck night|food truck friday|mobile food/i,
  patterns,
};

fs.writeFileSync(OUT, JSON.stringify(bundle, null, 2) + "\n");
console.log(`Wrote ${patterns.length} food truck harvest queries → ${OUT}`);
