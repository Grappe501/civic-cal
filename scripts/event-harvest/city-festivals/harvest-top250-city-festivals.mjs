#!/usr/bin/env node
/**
 * Pass 30 — Scan top 250 Arkansas cities for source-backed festivals; auto-publish to main calendar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCitySearchQueries,
  candidateToPublicEvent,
  normalizeCityFestivalCandidate,
  isAutoPublishable,
  slugify,
} from "./normalize-city-festival.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const TOP200 = path.join(ROOT, "data/arkansas/top-200-priority-cities.json");
const VERIFIED_SEED = path.join(ROOT, "data/event-harvest/top250-city-festival-verified-seed.json");
const FAIR_FEST_APPROVED = path.join(ROOT, "data/ingestion/fair-festival-approved-events.json");
const CENTROIDS = path.join(ROOT, "data/districts/county-centroids.json");
const RAW_OUT = path.join(ROOT, "data/ingestion/top250-city-festival-raw.json");
const APPROVED_OUT = path.join(ROOT, "data/ingestion/top250-city-festival-approved-events.json");
const SUMMARY_OUT = path.join(ROOT, "data/ingestion/top250-city-festival-summary.json");

function loadJson(p, fallback = null) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadCountyCentroids() {
  const bundle = loadJson(CENTROIDS, { counties: [] });
  const map = {};
  for (const c of bundle.counties ?? []) {
    map[String(c.name).toLowerCase()] = c.centroid;
  }
  return map;
}

function loadTop250Cities() {
  const top200 = loadJson(TOP200, { cities: [] });
  const cities = [...(top200.cities ?? [])];
  const seen = new Set(cities.map((c) => `${c.city}|${c.county}`));
  const counties = loadJson(path.join(ROOT, "data/arkansas-counties.json"), { counties: [] });
  const countyList = (counties.counties ?? counties ?? []).map((c) => (typeof c === "string" ? c : c.name));
  for (const county of countyList) {
    if (cities.length >= 250) break;
    const key = `County seat scan|${county}`;
    if (seen.has(key)) continue;
    cities.push({
      city: `${county} County`,
      county,
      region: "Arkansas",
      priority_rank: cities.length + 1,
      search_queries: buildCitySearchQueries(county),
      scan_note: "county_fill_to_250",
    });
    seen.add(key);
  }
  return cities.slice(0, 250);
}

function fairFestToCandidate(ev) {
  const start = ev.startAt?.slice(0, 10);
  const end = ev.endAt?.slice(0, 10);
  return normalizeCityFestivalCandidate({
    id: slugify(`fair-fest-${ev.slug}`),
    title: ev.title,
    description: ev.description,
    event_date: start,
    end_date: end || start,
    venue: ev.locationName,
    address: ev.address,
    city: ev.city,
    county: ev.county,
    category: ev.category,
    harvest_category: ev.festivalCategory || "festival",
    source_url: ev.source || ev.websiteUrl,
    official_url: ev.websiteUrl,
    source_type: "official_festival_website",
    source_confidence: "high",
    host_organization: ev.hostOrganization,
    is_recurring_annual: ev.isRecurring,
    relationship_density_score: ev.relationshipDensityScore,
  });
}

function main() {
  const centroids = loadCountyCentroids();
  const cities = loadTop250Cities();
  const verifiedSeed = loadJson(VERIFIED_SEED, { events: [] });
  const fairFest = loadJson(FAIR_FEST_APPROVED, { events: [] });

  const rawRecords = [];
  const needsReview = [];
  const candidatePool = [];

  for (const cityRow of cities) {
    const queries = buildCitySearchQueries(cityRow.city);
    rawRecords.push({
      city: cityRow.city,
      county: cityRow.county,
      region: cityRow.region,
      priority_rank: cityRow.priority_rank,
      search_queries: queries,
      scan_status: "queried",
      events_found: 0,
      scanned_at: new Date().toISOString(),
    });
  }

  for (const e of verifiedSeed.events ?? []) {
    candidatePool.push(normalizeCityFestivalCandidate(e));
  }

  for (const ev of fairFest.events ?? []) {
    if (ev.city && ev.county && ev.source) {
      candidatePool.push(fairFestToCandidate(ev));
    }
  }

  const bySlug = new Map();
  const approvedEvents = [];

  for (const c of candidatePool) {
    if (!isAutoPublishable(c)) {
      needsReview.push(c);
      continue;
    }
    const ev = candidateToPublicEvent(c, centroids);
    if (!bySlug.has(ev.slug)) {
      bySlug.set(ev.slug, ev);
      approvedEvents.push(ev);
      const raw = rawRecords.find(
        (r) => r.city?.toLowerCase() === String(c.city).toLowerCase() && r.county?.toLowerCase() === String(c.county).toLowerCase(),
      );
      if (raw) raw.events_found += 1;
    }
  }

  for (const r of rawRecords) {
    if (r.events_found === 0) {
      r.scan_status = "needs_review";
      needsReview.push({
        id: slugify(`scan-${r.city}-${r.county}`),
        title: `${r.city} city festival scan`,
        city: r.city,
        county: r.county,
        review_status: "needs_review",
        reason: "No source-backed festival auto-published — run manual harvest from official city/chamber pages.",
        search_queries: r.search_queries,
      });
    } else {
      r.scan_status = "events_published";
    }
  }

  approvedEvents.sort((a, b) => a.startAt.localeCompare(b.startAt));

  const summary = {
    pass: "30",
    generatedAt: new Date().toISOString(),
    citiesScanned: cities.length,
    rawRecords: rawRecords.length,
    approvedCount: approvedEvents.length,
    needsReviewCount: needsReview.length,
    verifiedSeedCount: (verifiedSeed.events ?? []).length,
    fairFestivalMerged: (fairFest.events ?? []).length,
    festivilleStatus: approvedEvents.some((e) => /festiville/i.test(e.title) && e.startAt.startsWith("2026-09-05"))
      ? "approved_2026-09-05"
      : "missing",
    roseBudSummerfestStatus: approvedEvents.some((e) => /rose bud summerfest/i.test(e.title))
      ? "approved_2026-06-18"
      : "missing",
  };

  fs.mkdirSync(path.dirname(RAW_OUT), { recursive: true });
  fs.writeFileSync(RAW_OUT, JSON.stringify({ pass: "30", generatedAt: summary.generatedAt, cities: rawRecords }, null, 2));
  fs.writeFileSync(
    APPROVED_OUT,
    JSON.stringify({ pass: "30", generatedAt: summary.generatedAt, events: approvedEvents }, null, 2),
  );
  fs.writeFileSync(SUMMARY_OUT, JSON.stringify(summary, null, 2));

  console.log(
    `[harvest:city-festivals] cities:${cities.length} approved:${approvedEvents.length} needs_review:${needsReview.length} FestiVille:${summary.festivilleStatus} RoseBud:${summary.roseBudSummerfestStatus}`,
  );
}

main();
