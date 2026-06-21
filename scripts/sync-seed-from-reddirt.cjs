#!/usr/bin/env node
/**
 * Sync seed JSON from RedDirt calendar-command-center (read-only upstream).
 * Does NOT import RedDirt code — only reads public data files.
 */
const fs = require("node:fs");
const path = require("node:path");

const laneRoot = path.resolve(__dirname, "..");
const reddirtData = path.resolve(laneRoot, "..", "RedDirt", "data", "calendar-command-center");
const outDir = path.join(laneRoot, "data");
const outFile = path.join(outDir, "seed-events.json");
const countiesOut = path.join(outDir, "arkansas-counties.json");

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function parseCountyName(raw) {
  if (!raw) return "Unknown";
  const s = String(raw).split("/")[0].trim();
  return s.replace(/\s+County$/i, "").trim() || s;
}

function parseCityFromLocation(locationName) {
  if (!locationName) return null;
  const part = String(locationName).split("·")[0].trim();
  return part || null;
}

function mapEventTypeToCategory(eventType, title) {
  const t = String(title || "").toLowerCase();
  const et = String(eventType || "").toUpperCase();
  if (et === "FESTIVAL" || t.includes("fest") || t.includes("fair")) return "community";
  if (t.includes("school board") || t.includes("school")) return "school";
  if (t.includes("council") || t.includes("quorum court") || t.includes("commission")) return "civic_meeting";
  if (t.includes("town hall") || t.includes("forum") || t.includes("fundraiser")) return "candidate_event";
  if (t.includes("church") || t.includes("fish fry") || t.includes("dinner")) return "faith_meal";
  if (t.includes("cleanup") || t.includes("volunteer") || t.includes("canvass")) return "volunteer";
  if (t.includes("library") || t.includes("art") || t.includes("music")) return "culture";
  if (t.includes("market") || t.includes("grand opening")) return "small_business";
  return "community";
}

function fromPublicSnapshot(event) {
  const county = event.county?.displayName
    ? parseCountyName(event.county.displayName)
    : parseCountyName(event.county);
  return {
    id: event.id,
    slug: event.slug || slugify(`${event.title}-${event.startAt}`),
    title: event.title,
    description: event.publicSummary || null,
    startAt: event.startAt,
    endAt: event.endAt,
    allDay: false,
    timezone: event.timezone || "America/Chicago",
    city: parseCityFromLocation(event.locationName),
    county,
    address: event.address || null,
    locationName: event.locationName || null,
    category: mapEventTypeToCategory(event.eventType, event.title),
    hostOrganization: null,
    isPublicGovernmentMeeting: false,
    candidateRelevant: false,
    isFamilyFriendly: true,
    isFree: true,
    highCivicValue: false,
    featured: false,
    status: "approved",
    source: "seed",
    sourceRef: event.id,
  };
}

function fromCommunityOpportunity(row) {
  const title = row.title || row.fairName;
  if (!title) return null;
  return {
    id: row.id,
    slug: slugify(`${title}-${row.county}-tbd`),
    title,
    description: row.notes || row.bestCandidateTimeWindow || null,
    startAt: new Date(Date.UTC(2026, 8, 1, 15, 0, 0)).toISOString(),
    endAt: null,
    allDay: true,
    timezone: "America/Chicago",
    city: null,
    county: parseCountyName(row.county),
    address: null,
    locationName: `${row.county} County`,
    category: row.type === "county_fair" ? "community" : "community",
    hostOrganization: null,
    isPublicGovernmentMeeting: false,
    candidateRelevant: false,
    isFamilyFriendly: true,
    isFree: true,
    highCivicValue: false,
    featured: false,
    status: "approved",
    source: "seed",
    sourceRef: row.id,
    dateTbd: true,
  };
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const countiesSrc = path.join(reddirtData, "arkansas-counties-75.json");
  if (fs.existsSync(countiesSrc)) {
    fs.copyFileSync(countiesSrc, countiesOut);
  }

  const events = [];
  const seen = new Set();

  const snapPath = path.join(reddirtData, "public-campaign-calendar.snapshot.json");
  if (fs.existsSync(snapPath)) {
    const snap = JSON.parse(fs.readFileSync(snapPath, "utf8"));
    for (const ev of snap.events || []) {
      const mapped = fromPublicSnapshot(ev);
      if (seen.has(mapped.slug)) continue;
      seen.add(mapped.slug);
      events.push(mapped);
    }
  }

  const commPath = path.join(reddirtData, "community-opportunities-2026.normalized.json");
  if (fs.existsSync(commPath)) {
    const comm = JSON.parse(fs.readFileSync(commPath, "utf8"));
    for (const row of comm.rows || []) {
      if (row.verificationStatus === "date_not_posted") {
        const mapped = fromCommunityOpportunity(row);
        if (!mapped || seen.has(mapped.slug)) continue;
        seen.add(mapped.slug);
        events.push(mapped);
      }
    }
  }

  const fairsPath = path.join(reddirtData, "arkansas-county-fairs-2026.normalized.json");
  if (fs.existsSync(fairsPath)) {
    const fairs = JSON.parse(fs.readFileSync(fairsPath, "utf8"));
    for (const row of fairs.rows || []) {
      const mapped = fromCommunityOpportunity({
        ...row,
        title: row.fairName,
        type: "county_fair",
      });
      if (!mapped || seen.has(mapped.slug)) continue;
      seen.add(mapped.slug);
      events.push(mapped);
    }
  }

  events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const payload = {
    generatedAt: new Date().toISOString(),
    count: events.length,
    upstream: "RedDirt/data/calendar-command-center (read-only)",
    events,
  };

  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(`[seed:sync] Wrote ${events.length} events → ${outFile}`);
}

main();
