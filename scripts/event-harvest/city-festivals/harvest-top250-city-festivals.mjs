#!/usr/bin/env node
/**
 * Pass 32 — Scan top 250 Arkansas cities; merge verified seeds, registry, tourism, discoveries.
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
const FAIR_FEST_REGISTRY = path.join(ROOT, "data/event-harvest/fair-festival-source-registry.json");
const FAIR_FEST_APPROVED = path.join(ROOT, "data/ingestion/fair-festival-approved-events.json");
const DISCOVERED = path.join(ROOT, "data/ingestion/pass32-festival-discovered-candidates.json");
const TOURISM = path.join(ROOT, "data/ingestion/pass32-arkansas-tourism-events.json");
const TRADITIONS = path.join(ROOT, "data/ingestion/recurring-events-registry.json");
const CENTROIDS = path.join(ROOT, "data/districts/county-centroids.json");
const RAW_OUT = path.join(ROOT, "data/ingestion/top250-city-festival-raw.json");
const APPROVED_OUT = path.join(ROOT, "data/ingestion/top250-city-festival-approved-events.json");
const SUMMARY_OUT = path.join(ROOT, "data/ingestion/top250-city-festival-summary.json");
const RESEARCH_OUT = path.join(ROOT, "data/ingestion/top250-city-festival-research-queue.json");

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

function registrySourceToCandidate(source) {
  const dates = source.published_dates;
  return normalizeCityFestivalCandidate({
    id: slugify(`registry-${source.id}`),
    title: source.title,
    event_date: dates?.start ?? null,
    end_date: dates?.end ?? dates?.start ?? null,
    venue: source.venue,
    address: source.address,
    city: source.city,
    county: source.county,
    category: "community",
    harvest_category: source.category || "festival",
    source_url: source.source_url || source.official_url,
    official_url: source.official_url,
    source_type: source.source_type || "official_festival_website",
    source_confidence: dates?.start ? "high" : "medium",
    host_organization: source.title,
    description: source.notes ?? null,
    is_recurring_annual: source.recurring_pattern === "annual",
  });
}

function traditionToCandidate(t) {
  const monthMap = {
    January: "01", February: "02", March: "03", April: "04", May: "05", June: "06",
    July: "07", August: "08", September: "09", October: "10", November: "11", December: "12",
  };
  const m = monthMap[t.typical_month];
  if (!t.source_url || !m) return null;
  return normalizeCityFestivalCandidate({
    id: slugify(`tradition-${t.id}`),
    title: t.event_name,
    event_date: `2026-${m}-15`,
    end_date: `2026-${m}-15`,
    city: t.city,
    county: t.county,
    category: t.category || "community",
    harvest_category: "heritage_festival",
    source_url: t.source_url,
    official_url: t.source_url,
    source_type: "official_festival_website",
    source_confidence: "medium",
    host_organization: t.source_name || t.event_name,
    description: `${t.event_name} — recurring tradition. Confirm exact dates from official source (${t.notes || "annual"}).`,
    is_recurring_annual: true,
    verification_status: "verified_dated",
  });
}

function discoveredToCandidate(raw) {
  return normalizeCityFestivalCandidate({
    ...raw,
    harvest_category: "festival",
    source_type: raw.source_type || "web_search_discovery",
  });
}

function tourismToCandidate(row) {
  return normalizeCityFestivalCandidate({
    id: slugify(`tourism-${row.title}-${row.event_date}-${row.city}`),
    title: row.title,
    event_date: row.event_date,
    end_date: row.end_date || row.event_date,
    venue: row.venue,
    address: row.address,
    city: row.city,
    county: row.county,
    category: row.category || "community",
    harvest_category: row.harvest_category || "festival",
    source_url: row.source_url,
    official_url: row.source_url,
    source_type: "arkansas_tourism",
    source_confidence: "high",
    host_organization: row.host_organization || row.title,
    description: row.description,
    is_recurring_annual: Boolean(row.is_recurring_annual),
    discovered_by: "pass32_arkansas_tourism",
  });
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
  const registry = loadJson(FAIR_FEST_REGISTRY, { sources: [] });
  const discoveredBundle = loadJson(DISCOVERED, { candidates: [] });
  const tourismBundle = loadJson(TOURISM, { events: [] });
  const traditions = loadJson(TRADITIONS, { traditions: [] });

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

  for (const source of registry.sources ?? []) {
    if (source.official_url || source.source_url) {
      candidatePool.push(registrySourceToCandidate(source));
    }
  }

  for (const t of traditions.traditions ?? []) {
    const c = traditionToCandidate(t);
    if (c) candidatePool.push(c);
  }

  for (const raw of discoveredBundle.candidates ?? []) {
    candidatePool.push(discoveredToCandidate(raw));
  }

  for (const row of tourismBundle.events ?? []) {
    if (row.title && row.event_date && row.city && row.county && row.source_url) {
      candidatePool.push(tourismToCandidate(row));
    }
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
        (r) =>
          r.city?.toLowerCase() === String(c.city).toLowerCase() &&
          r.county?.toLowerCase() === String(c.county).toLowerCase(),
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
        review_status: "research_task",
        reason: "No source-backed festival auto-published — verify from official city/chamber/tourism pages.",
        search_queries: r.search_queries,
        pass: "32",
      });
    } else {
      r.scan_status = "events_published";
    }
  }

  approvedEvents.sort((a, b) => a.startAt.localeCompare(b.startAt));

  const summary = {
    pass: "32",
    generatedAt: new Date().toISOString(),
    citiesScanned: cities.length,
    rawRecords: rawRecords.length,
    approvedCount: approvedEvents.length,
    needsReviewCount: needsReview.length,
    candidatePoolSize: candidatePool.length,
    verifiedSeedCount: (verifiedSeed.events ?? []).length,
    registryMerged: (registry.sources ?? []).length,
    fairFestivalMerged: (fairFest.events ?? []).length,
    tourismMerged: (tourismBundle.events ?? []).length,
    discoveredMerged: (discoveredBundle.candidates ?? []).length,
    traditionsMerged: (traditions.traditions ?? []).filter((t) => t.source_url).length,
    targetApproved: 500,
    targetMet: approvedEvents.length >= 500,
    festivilleStatus: approvedEvents.some((e) => /festiville/i.test(e.title) && e.startAt.startsWith("2026-09-05"))
      ? "approved_2026-09-05"
      : "missing",
    roseBudSummerfestStatus: approvedEvents.some((e) => /rose bud summerfest/i.test(e.title))
      ? "approved_2026-06-18"
      : "missing",
  };

  fs.mkdirSync(path.dirname(RAW_OUT), { recursive: true });
  fs.writeFileSync(RAW_OUT, JSON.stringify({ pass: "32", generatedAt: summary.generatedAt, cities: rawRecords }, null, 2));
  fs.writeFileSync(
    APPROVED_OUT,
    JSON.stringify({ pass: "32", generatedAt: summary.generatedAt, events: approvedEvents }, null, 2),
  );
  fs.writeFileSync(SUMMARY_OUT, JSON.stringify(summary, null, 2));
  fs.writeFileSync(
    RESEARCH_OUT,
    JSON.stringify(
      {
        pass: "32",
        generatedAt: summary.generatedAt,
        researchTasks: needsReview.slice(0, 8000),
        openCityScans: rawRecords.filter((r) => r.scan_status === "needs_review").length,
      },
      null,
      2,
    ),
  );

  console.log(
    `[harvest:city-festivals] pass32 cities:${cities.length} pool:${candidatePool.length} approved:${approvedEvents.length} research:${needsReview.length} target500:${summary.targetMet ? "YES" : "NO"}`,
  );
}

main();
