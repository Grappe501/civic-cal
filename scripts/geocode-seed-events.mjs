#!/usr/bin/env node
/**
 * Optional geocode enrichment for seed-events.json → seed-events-geocoded.json
 * Never overwrites seed-events.json unless --overwrite-source is passed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const laneRoot = path.resolve(__dirname, "..");
const inFile = path.join(laneRoot, "data", "seed-events.json");
const outFile = path.join(laneRoot, "data", "seed-events-geocoded.json");

const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
const overwriteSource = process.argv.includes("--overwrite-source");
const delayMs = 200;

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
  if (!fs.existsSync(inFile)) {
    console.error("[seed:geocode] Run npm run seed:sync first");
    process.exit(1);
  }

  const seed = JSON.parse(fs.readFileSync(inFile, "utf8"));
  const events = [...(seed.events || [])];

  if (!apiKey) {
    console.warn("[seed:geocode] GOOGLE_MAPS_GEOCODING_API_KEY not set — copying without geocode");
    fs.writeFileSync(outFile, JSON.stringify({ ...seed, geocodedAt: null, events }, null, 2));
    return;
  }

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
        ev.placeId = r.place_id;
        ev.mapStatus = "geocoded";
        ev.locationConfidence = "medium";
        geocoded += 1;
      }
      await sleep(delayMs);
    } catch {
      /* skip */
    }
  }

  const out = { ...seed, geocodedAt: new Date().toISOString(), events };
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
  console.log(`[seed:geocode] enriched ${geocoded} events → ${outFile}`);

  if (overwriteSource) {
    fs.writeFileSync(inFile, JSON.stringify(out, null, 2));
    console.log("[seed:geocode] overwrote seed-events.json");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
