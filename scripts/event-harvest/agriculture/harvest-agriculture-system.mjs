#!/usr/bin/env node
/**
 * Pass 34 — Harvest Arkansas food & agriculture institutions + UAEX calendar events.
 */
import { extractDatesFromHtml } from "../fairs-festivals/lib/date-extract.mjs";
import { fetchFairText } from "../fairs/lib/fetch-fair-public.mjs";
import { getHarvestWindow, isDateInHarvestWindow } from "../lib/harvest-window.mjs";
import {
  INSTITUTION_TYPES,
  extensionOfficeUrl,
  fairProfileForCounty,
  farmBureauSearchUrl,
  loadCounties,
  loadFairInstitutionProfiles,
  loadJson,
  saveJson,
  slugify,
} from "./lib/ag-base.mjs";

const FETCH_LIMIT = Number(process.env.AG_HARVEST_FETCH_LIMIT ?? 75);
const FETCH_DELAY_MS = Number(process.env.AG_HARVEST_DELAY_MS ?? 300);
const SKIP_FETCH = process.env.AG_SKIP_FETCH === "1";

const EVENT_KEYWORDS =
  /workshop|class|meeting|4-?h|homemaker|garden|livestock|market|preserv|beekeep|agritourism|farm bureau|ffa|extension/i;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildInstitutionProfile(county, type, extras = {}) {
  const fair = extras.fairProfile;
  const extUrl = fair?.institution?.extension_office_url ?? extensionOfficeUrl(county);
  const fairId = fair?.id ?? null;
  const fairName = fair?.institution?.fair_name ?? null;

  const base = {
    id: `ag-${slugify(county)}-${type}`,
    name: null,
    county,
    city: fair?.institution?.city ?? null,
    type,
    website: null,
    public_contact: null,
    calendar_url: null,
    source_links: [],
    recurring_programs: [],
    related_county_fair_id: fairId,
    related_county_fair_name: fairName,
    related_extension_url: extUrl,
    related_four_h_url: fair?.institution?.four_h_url ?? extUrl,
    related_farm_bureau_url: null,
    source_confidence: "seed",
    last_refreshed: new Date().toISOString(),
  };

  switch (type) {
    case "extension_office":
      return {
        ...base,
        name: `${county} County Extension Office`,
        website: extUrl,
        calendar_url: extUrl,
        source_links: [extUrl],
        source_confidence: "official_uaex",
      };
    case "four_h":
      return {
        ...base,
        name: `${county} County 4-H`,
        website: extUrl,
        calendar_url: extUrl,
        source_links: [extUrl],
        recurring_programs: ["livestock", "projects", "competitions"],
        source_confidence: "official_uaex",
      };
    case "extension_homemakers":
      return {
        ...base,
        name: `${county} County Extension Homemakers`,
        website: extUrl,
        source_links: [extUrl],
        recurring_programs: ["monthly meetings", "workshops"],
        source_confidence: "official_uaex",
      };
    case "farm_bureau":
      return {
        ...base,
        name: `${county} County Farm Bureau`,
        website: farmBureauSearchUrl(county),
        source_links: [farmBureauSearchUrl(county)],
        source_confidence: "needs_verification",
      };
    case "farmers_market":
      return {
        ...base,
        name: `${county} County farmers markets`,
        source_confidence: "research_needed",
      };
    default:
      return {
        ...base,
        name: `${county} County ${type.replace(/_/g, " ")}`,
        source_confidence: "research_needed",
      };
  }
}

function extractEventCandidates(county, html, sourceUrl) {
  const text = stripTags(html);
  const dates = extractDatesFromHtml(html, { defaultYear: 2026 });
  const window = getHarvestWindow();
  const candidates = [];
  const lines = text.split(/(?<=[.!?])\s+/).filter((l) => EVENT_KEYWORDS.test(l) && l.length > 20);

  for (const line of lines.slice(0, 12)) {
    for (const d of dates.slice(0, 8)) {
      if (!d.startDate || !isDateInHarvestWindow(d.startDate, window)) continue;
      const title = line.slice(0, 120).trim();
      candidates.push({
        id: slugify(`ag-${county}-${d.startDate}-${title}`),
        county,
        title: title.length > 10 ? title : `${county} County Extension program`,
        event_date: d.startDate,
        end_date: d.endDate ?? d.startDate,
        source_url: sourceUrl,
        source_type: "extension_4h_page",
        source_confidence: 65,
        description: `Source-backed agriculture/community program from ${county} County Extension public page.`,
        harvest_batch: "agriculture_lane_pass34",
        relationship_density_score: 68,
      });
    }
  }

  const seen = new Set();
  return candidates.filter((c) => {
    const key = `${c.event_date}|${c.title.slice(0, 40)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  const counties = loadCounties();
  const fairProfiles = loadFairInstitutionProfiles();
  const window = getHarvestWindow();
  const institutions = [];
  const staged = [];
  const researchTasks = [];
  let fetched = 0;

  for (const county of counties) {
    const fair = fairProfileForCounty(county, fairProfiles);
    for (const type of ["extension_office", "four_h", "extension_homemakers", "farm_bureau", "farmers_market"]) {
      institutions.push(buildInstitutionProfile(county, type, { fairProfile: fair }));
    }

    if (typeNeedsResearch(county, fair)) {
      researchTasks.push({
        id: `ag-research-${slugify(county)}-farm-bureau`,
        county,
        lane: "agriculture_pass34",
        topic: "Farm Bureau county chapter public page",
        priority: "medium",
        status: "open",
        suggested_sources: [farmBureauSearchUrl(county)],
        created_at: new Date().toISOString(),
      });
    }

    const extUrl = extensionOfficeUrl(county);
    const shouldFetch = !SKIP_FETCH && (FETCH_LIMIT <= 0 || fetched < FETCH_LIMIT);
    if (!shouldFetch) continue;

    try {
      const { text } = await fetchFairText(extUrl);
      fetched++;
      const candidates = extractEventCandidates(county, text, extUrl);
      staged.push(...candidates);
      if (candidates.length === 0) {
        researchTasks.push({
          id: `ag-research-${slugify(county)}-extension-events`,
          county,
          lane: "agriculture_pass34",
          topic: "Extension calendar events with source-backed dates",
          priority: "low",
          status: "open",
          suggested_sources: [extUrl],
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      researchTasks.push({
        id: `ag-research-${slugify(county)}-fetch`,
        county,
        lane: "agriculture_pass34",
        topic: `UAEX page fetch failed: ${String(err.message || err).slice(0, 80)}`,
        priority: "high",
        status: "open",
        suggested_sources: [extUrl],
        created_at: new Date().toISOString(),
      });
    }

    await sleep(FETCH_DELAY_MS);
  }

  const registry = {
    pass: "34",
    label: "Arkansas Food & Agriculture Ecosystem",
    generatedAt: new Date().toISOString(),
    harvestWindow: window.label,
    institutionTypes: INSTITUTION_TYPES,
    institutionCount: institutions.length,
    counties: counties.length,
    institutions,
  };

  saveJson("data/agriculture/agriculture-institution-registry.json", registry);
  saveJson("data/ingestion/agriculture-staged.json", {
    generatedAt: new Date().toISOString(),
    pass: "34",
    candidates: staged,
  });

  const prevTasks = loadJson("data/agriculture/agriculture-research-tasks.json", { tasks: [] });
  const taskById = new Map((prevTasks.tasks ?? []).map((t) => [t.id, t]));
  for (const t of researchTasks) taskById.set(t.id, t);

  saveJson("data/agriculture/agriculture-research-tasks.json", {
    generatedAt: new Date().toISOString(),
    pass: "34",
    openCount: [...taskById.values()].filter((t) => t.status === "open").length,
    tasks: [...taskById.values()],
  });

  console.log(
    `[harvest:agriculture] institutions:${institutions.length} staged:${staged.length} research:${taskById.size} fetched:${fetched} window:${window.label}`,
  );
}

function typeNeedsResearch(county) {
  return true;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
