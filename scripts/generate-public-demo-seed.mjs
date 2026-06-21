#!/usr/bin/env node
/**
 * Generate demo/seed community events (clearly labeled, not verified).
 * Run: node scripts/generate-public-demo-seed.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "data", "seed-events-public-demo.json");

const COUNTIES = [
  ["Pulaski", "Little Rock"],
  ["Washington", "Fayetteville"],
  ["Sebastian", "Fort Smith"],
  ["Benton", "Bentonville"],
  ["Faulkner", "Conway"],
  ["Garland", "Hot Springs"],
  ["Jefferson", "Pine Bluff"],
  ["Craighead", "Jonesboro"],
  ["Saline", "Bryant"],
  ["White", "Searcy"],
];

const TEMPLATES = [
  { cat: "faith_meal", title: "Community fish fry (demo seed)", layer: "community_church" },
  { cat: "food_truck_festival", title: "Food truck Friday (demo seed)", layer: "community_identity" },
  { cat: "civic_meeting", title: "City council meeting (demo seed)", gov: true },
  { cat: "civic_meeting", title: "School board meeting (demo seed)", gov: true },
  { cat: "faith_meal", title: "VFD fish fry fundraiser (demo seed)", layer: "relationship" },
  { cat: "community", title: "5K Turkey Trot (demo seed)", race: true },
  { cat: "small_business", title: "Farmers market (demo seed)", layer: "community_identity" },
  { cat: "community", title: "Summer parade (demo seed)", layer: "community_identity" },
  { cat: "community", title: "County fair weekend (demo seed)", layer: "community_identity" },
  { cat: "volunteer", title: "Park cleanup volunteer day (demo seed)", volunteer: true, student: true },
  { cat: "culture", title: "Live music on the square (demo seed)", music: true },
  { cat: "community_church", title: "Spaghetti dinner fundraiser (demo seed)", layer: "community_church" },
  { cat: "school", title: "Homecoming game (demo seed)", layer: "school_ecosystem" },
  { cat: "community", title: "Heritage festival (demo seed)", layer: "community_identity" },
  { cat: "volunteer", title: "Food bank sorting shift (demo seed)", volunteer: true, student: true },
];

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

const events = [];
let day = new Date("2026-07-05T14:00:00-05:00");

for (let i = 0; i < 50; i++) {
  const [county, city] = COUNTIES[i % COUNTIES.length];
  const t = TEMPLATES[i % TEMPLATES.length];
  const dateStr = day.toISOString().slice(0, 10);
  const slug = `demo-${slugify(t.title)}-${city.toLowerCase()}-${dateStr}`;
  const start = new Date(day);
  start.setHours(t.cat === "civic_meeting" ? 18 : 10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + (t.cat === "civic_meeting" ? 2 : 4));

  events.push({
    id: `demo-seed-${i + 1}`,
    slug,
    title: `${t.title} · ${city}`,
    description:
      "Demo/seed event for calendar UI testing — not verified. Replace with source-backed data before production promotion.",
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    allDay: false,
    timezone: "America/Chicago",
    city,
    county,
    locationName: `${city} · ${county} County`,
    category: t.cat,
    hostOrganization: "Demo seed generator",
    isPublicGovernmentMeeting: Boolean(t.gov),
    candidateRelevant: i % 7 === 0,
    isFamilyFriendly: true,
    isFree: t.cat !== "community" || i % 3 !== 0,
    featured: i % 11 === 0,
    status: "approved",
    source: "demo_seed",
    intelligenceLayer: t.layer,
    relationshipDensityScore: 55 + (i % 40),
  });

  day.setDate(day.getDate() + 3);
}

const bundle = {
  version: 1,
  generatedAt: new Date().toISOString(),
  label: "Public demo seed — not verified",
  count: events.length,
  events,
};

fs.writeFileSync(OUT, JSON.stringify(bundle, null, 2));
console.log(`Wrote ${events.length} demo events → ${OUT}`);
