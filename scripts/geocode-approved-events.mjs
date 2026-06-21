#!/usr/bin/env node
/**
 * Geocode approved ingestion bundles (party meetings, county fairs, etc.) in place.
 * Requires GOOGLE_MAPS_GEOCODING_API_KEY for live geocode; skips events that already have coords.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUNDLES = [
  "data/ingestion/political-party-meetings-approved-events.json",
  "data/ingestion/county-fair-approved-events.json",
  "data/ingestion/school-events-approved-events.json",
  "data/ingestion/top250-city-festival-approved-events.json",
  "data/ingestion/fair-festival-approved-events.json",
  "data/ingestion/historic-political-events-approved-events.json",
];

const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
const delayMs = 180;

function buildQuery(ev) {
  return [ev.locationName, ev.address, ev.city, ev.county ? `${ev.county} County` : null, "AR", "USA"]
    .filter(Boolean)
    .join(", ");
}

async function geocode(query) {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("region", "us");
  const res = await fetch(url.toString());
  return res.json();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!apiKey) {
    console.warn("[geocode:approved] GOOGLE_MAPS_GEOCODING_API_KEY not set — no changes");
    return;
  }

  let total = 0;
  for (const rel of BUNDLES) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue;
    const bundle = JSON.parse(fs.readFileSync(file, "utf8"));
    const events = bundle.events ?? [];
    let geocoded = 0;
    for (const ev of events) {
      if (ev.latitude != null && ev.longitude != null) continue;
      const q = buildQuery(ev);
      if (!q.replace(/[, USA]/g, "").trim()) continue;
      try {
        const data = await geocode(q);
        if (data.status === "OK" && data.results?.[0]) {
          const r = data.results[0];
          ev.latitude = r.geometry.location.lat;
          ev.longitude = r.geometry.location.lng;
          ev.formattedAddress = r.formatted_address;
          ev.mapStatus = "geocoded";
          geocoded++;
        }
        await sleep(delayMs);
      } catch {
        /* skip */
      }
    }
    if (geocoded) {
      bundle.geocodedAt = new Date().toISOString();
      fs.writeFileSync(file, JSON.stringify(bundle, null, 2));
      console.log(`[geocode:approved] ${rel} +${geocoded}`);
      total += geocoded;
    }
  }
  console.log(`[geocode:approved] total enriched: ${total}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
