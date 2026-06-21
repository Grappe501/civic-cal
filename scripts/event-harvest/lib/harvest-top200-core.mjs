/**
 * Shared top-200 harvest pipeline (Pass 8).
 */
import fs from "node:fs";
import { searchWeb, hasSearchProvider } from "./search-provider.mjs";
import { buildExpandedCityQueries, discoverSourceTemplates } from "./city-query-builder.mjs";
import { getHarvestWindow, isDateInHarvestWindow, harvestBatchId } from "./harvest-window.mjs";
import { normalizeFromSearchHit } from "../normalize-event-candidate.mjs";
import { dedupeCandidates } from "./dedupe-logic.mjs";
import {
  ensureDirs,
  loadJson,
  writeJson,
  RAW_DIR,
  STAGED_TOP200_FILE,
  DISCOVERED_SOURCES_FILE,
  HARVEST_SUMMARY_TOP200_FILE,
  nowIso,
} from "./paths.mjs";

const QUERY_LIMIT_PER_CITY = Number(process.env.HARVEST_QUERY_LIMIT || 3);
const HIT_LIMIT = Number(process.env.HARVEST_HIT_LIMIT || 5);
const CITY_LIMIT = Number(process.env.HARVEST_CITY_LIMIT || 0);

export function loadTop200Cities() {
  return loadJson("data/arkansas/top-200-priority-cities.json").cities;
}

export function discoverCitySources(cities) {
  const window = getHarvestWindow();
  const discovered = cities.map((cityRecord) => ({
    city: cityRecord.city,
    county: cityRecord.county,
    region: cityRecord.region,
    priority_rank: cityRecord.priority_rank,
    search_queries: cityRecord.search_queries || buildExpandedCityQueries(cityRecord),
    source_templates: discoverSourceTemplates(cityRecord),
    discovered_at: nowIso(),
    harvest_window: window.label,
  }));

  ensureDirs();
  writeJson(DISCOVERED_SOURCES_FILE, {
    generatedAt: nowIso(),
    harvest_window: window,
    harvest_batch: harvestBatchId(),
    cityCount: discovered.length,
    mode: hasSearchProvider() ? "search_enabled" : "template_discovery_only",
    cities: discovered,
  });

  return discovered;
}

function estimateCrowdRange(text, layer) {
  const t = text.toLowerCase();
  if (/thousands|massive|10,000|10000/.test(t)) return { min: 1000, max: 10000, band: "massive" };
  if (/hundreds|500\+|500 people/.test(t)) return { min: 200, max: 800, band: "large" };
  if (/annual fair|county fair|festival/.test(t)) return { min: 500, max: 5000, band: "large" };
  if (layer === "community_church") return { min: 80, max: 400, band: "medium" };
  if (layer === "government") return { min: 15, max: 120, band: "small" };
  return null;
}

export async function harvestTop200(options = {}) {
  const { dryRun = false } = options;
  ensureDirs();

  const window = getHarvestWindow();
  const batch = harvestBatchId();
  let cities = loadTop200Cities();
  if (CITY_LIMIT > 0) cities = cities.slice(0, CITY_LIMIT);

  const discovered = discoverCitySources(cities);
  const harvested = [];
  const failedCities = [];
  const rawRuns = [];

  if (!hasSearchProvider() || dryRun) {
    const planPath = `${RAW_DIR}/top200-query-plan-${nowIso().slice(0, 10)}.json`;
    writeJson(planPath, {
      mode: "query_plan_only",
      harvest_window: window,
      harvest_batch: batch,
      cityCount: cities.length,
      note: "Set BING_SEARCH_API_KEY or GOOGLE_CUSTOM_SEARCH_* to fetch results. Events are never auto-published.",
      cities: discovered.map((d) => ({
        city: d.city,
        county: d.county,
        queries: d.search_queries,
        source_templates: d.source_templates,
      })),
    });
    console.log(`[harvest:top200] No search key — query plan → ${planPath}`);
  } else {
    for (const cityRecord of cities) {
      const queries = cityRecord.search_queries || buildExpandedCityQueries(cityRecord);
      let cityHits = 0;
      try {
        for (const q of queries.slice(0, QUERY_LIMIT_PER_CITY)) {
          const results = await searchWeb(q, { limit: HIT_LIMIT });
          for (const hit of results || []) {
            const candidate = normalizeFromSearchHit(hit, {
              city: cityRecord.city,
              county: cityRecord.county,
              source_name: hit.provider || "web_search",
              source_type: "event_platform",
              discovered_by: `harvest_top200:${cityRecord.city}`,
              harvest_batch: batch,
              harvest_window: window,
            });
            if (candidate.event_date && !isDateInHarvestWindow(candidate.event_date, window)) continue;
            const crowd = estimateCrowdRange(`${candidate.title} ${candidate.raw_text}`, candidate.intelligence_layer);
            if (crowd) {
              candidate.estimated_crowd_min = crowd.min;
              candidate.estimated_crowd_max = crowd.max;
              candidate.typical_attendance_band = crowd.band;
            }
            harvested.push(candidate);
            cityHits++;
          }
        }
        rawRuns.push({ city: cityRecord.city, hits: cityHits, queries: queries.slice(0, QUERY_LIMIT_PER_CITY) });
        if (cityHits === 0) failedCities.push({ city: cityRecord.city, county: cityRecord.county, reason: "no_results" });
      } catch (e) {
        failedCities.push({ city: cityRecord.city, county: cityRecord.county, reason: e.message });
      }
    }
    writeJson(`${RAW_DIR}/top200-harvest-raw-${nowIso().slice(0, 10)}.json`, {
      generatedAt: nowIso(),
      harvest_window: window,
      runs: rawRuns,
    });
  }

  let existing = [];
  if (fs.existsSync(STAGED_TOP200_FILE)) {
    existing = JSON.parse(fs.readFileSync(STAGED_TOP200_FILE, "utf8")).candidates ?? [];
  }

  const merged = dedupeCandidates([...existing, ...harvested]);
  writeJson(STAGED_TOP200_FILE, {
    generatedAt: nowIso(),
    harvest_window: window,
    harvest_batch: batch,
    count: merged.length,
    review_policy: "needs_review — never auto-publish",
    candidates: merged,
  });

  const summary = buildSummary(cities, discovered, merged, failedCities, window, batch);
  writeJson(HARVEST_SUMMARY_TOP200_FILE, summary);

  return summary;
}

function buildSummary(cities, discovered, candidates, failedCities, window, batch) {
  const highValue = candidates.filter((c) => (c.political_opportunity_score ?? 0) >= 75);
  const gov = candidates.filter((c) => c.intelligence_layer === "government" || c.category === "civic_meeting");
  const church = candidates.filter((c) => c.intelligence_layer === "community_church");
  const festivals = candidates.filter((c) => c.intelligence_layer === "community_identity");
  const school = candidates.filter((c) => c.intelligence_layer === "school_ecosystem");
  const needsReview = candidates.filter((c) => c.review_status === "needs_review");

  const top25 = [...candidates]
    .sort((a, b) => (b.political_opportunity_score ?? 0) - (a.political_opportunity_score ?? 0))
    .slice(0, 25)
    .map((c) => ({
      title: c.title,
      city: c.city,
      county: c.county,
      event_date: c.event_date,
      po: c.political_opportunity_score,
      rd: c.relationship_density_score,
      layer: c.intelligence_layer,
      source_url: c.source_url,
    }));

  return {
    generatedAt: nowIso(),
    harvest_window: window,
    harvest_batch: batch,
    cities_searched: cities.length,
    sources_discovered: discovered.reduce((n, d) => n + d.source_templates.length, 0),
    candidate_events_staged: candidates.length,
    high_value_events: highValue.length,
    government_meetings: gov.length,
    church_community_events: church.length,
    festivals_fairs: festivals.length,
    school_sports_events: school.length,
    needs_review_count: needsReview.length,
    failed_or_no_result_cities: failedCities,
    top_25_high_value: top25,
  };
}
