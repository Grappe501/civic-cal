#!/usr/bin/env node
/**
 * Pass 25 — Harvest public party meetings + Democratic county discovery + Libertarian events.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseGopCountyPageText } from "./parse-gop-county-page.mjs";
import { parseDemCountyPageText, demCountyToRecord, cleanMeetingInfo } from "./parse-dem-county-page.mjs";
import { parseDemCountiesIndex } from "./parse-dem-counties-index.mjs";
import { fetchTextWithFallback, fetchDemCountyCptList, matchCountyName } from "./fetch-dem-public.mjs";
import { parseLibertarianEventsPage } from "./parse-libertarian-events.mjs";
import { normalizeAll } from "./normalize-party-meeting-candidate.mjs";
import { parseRecurrenceRule } from "./parse-recurring-meetings.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const REGISTRY_PATH = path.join(ROOT, "data/event-harvest/political-party-source-registry.json");
const COUNTIES_PATH = path.join(ROOT, "data/arkansas-counties.json");
const RAW_OUT = path.join(ROOT, "data/ingestion/political-party-meetings-raw.json");
const STAGED_OUT = path.join(ROOT, "data/ingestion/political-party-meetings-staged.json");
const SUMMARY_OUT = path.join(ROOT, "data/ingestion/political-party-meetings-summary.json");
const GOP_URL = "https://www.arkansasgop.org/countygop.html";
const LPAR_URL = "https://www.lpar.org/events/";
const D_FETCH_LIMIT = Number(process.env.DEM_COUNTY_FETCH_LIMIT ?? 75);
const D_FETCH_DELAY_MS = Number(process.env.DEM_COUNTY_FETCH_DELAY_MS ?? 350);
const SKIP_DEM_FETCH = process.env.SKIP_DEM_FETCH === "1";
const DEM_COUNTIES_INDEX = "https://www.arkdems.org/counties/";

async function fetchText(url, timeoutMs = 15000) {
  const { text } = await fetchTextWithFallback(url, timeoutMs);
  return text;
}

function countySlug(county) {
  return county.toLowerCase().replace(/\s+/g, "-");
}

function demCountyUrl(county) {
  return `https://www.arkdems.org/county/${countySlug(county)}/`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}


async function harvestDemocraticCounties(counties, existingPages, indexEntries = []) {
  const existingByCounty = new Map(existingPages.map((p) => [p.county, p]));
  const indexByCounty = new Map(indexEntries.map((e) => [e.county, e]));
  const records = [];
  const pages = [];
  let fetched = 0;

  for (const county of counties) {
    const prev = existingByCounty.get(county);
    const indexEntry = indexByCounty.get(county);
    const url = indexEntry?.url ?? demCountyUrl(county);
    const page = {
      county,
      url,
      meeting_info: cleanMeetingInfo(prev?.meeting_info ?? null),
      chair: prev?.chair ?? null,
      election_commissioner: prev?.election_commissioner ?? null,
      venue: prev?.venue ?? null,
      city: prev?.city ?? null,
      fetch_blocked: prev?.fetch_blocked ?? false,
      last_fetched: prev?.last_fetched ?? null,
    };
    pages.push(page);

    const shouldFetch = !SKIP_DEM_FETCH && (D_FETCH_LIMIT <= 0 || fetched < D_FETCH_LIMIT);
    if (!shouldFetch) {
      records.push(
        demCountyToRecord({
          county: page.county,
          url: page.url,
          meeting_info: page.meeting_info,
          chair: page.chair,
          election_commissioner: page.election_commissioner,
          venue: page.venue,
          city: page.city,
          fetch_blocked: !page.meeting_info,
          raw_excerpt: page.meeting_info || "County page URL known — live fetch skipped (set SKIP_DEM_FETCH=0).",
        }),
      );
      continue;
    }

    try {
      const { text: html, via } = await fetchTextWithFallback(page.url);
      const parsed = parseDemCountyPageText(html, page.county, page.url);
      parsed.last_fetched = new Date().toISOString();
      parsed.fetch_via = via;
      page.meeting_info = parsed.meeting_info ?? page.meeting_info;
      page.chair = parsed.chair ?? page.chair;
      page.election_commissioner = parsed.election_commissioner ?? page.election_commissioner;
      page.venue = parsed.venue ?? page.venue;
      page.city = parsed.city ?? page.city;
      page.fetch_blocked = parsed.fetch_blocked;
      page.last_fetched = parsed.last_fetched;
      records.push(
        demCountyToRecord({
          county: page.county,
          url: page.url,
          meeting_info: page.meeting_info,
          chair: page.chair,
          election_commissioner: page.election_commissioner,
          venue: page.venue,
          city: page.city,
          fetch_blocked: page.fetch_blocked,
          raw_excerpt: parsed.raw_excerpt,
        }),
      );
      fetched++;
    } catch (e) {
      page.fetch_blocked = true;
      records.push(
        demCountyToRecord({
          county: page.county,
          url: page.url,
          meeting_info: page.meeting_info,
          chair: page.chair,
          election_commissioner: page.election_commissioner,
          venue: page.venue,
          city: page.city,
          fetch_blocked: true,
          raw_excerpt: `Fetch failed: ${e.message}`,
        }),
      );
    }
    await sleep(D_FETCH_DELAY_MS);
  }

  console.log(`[harvest:party-meetings] Democratic: ${pages.length} county pages · ${fetched} live fetches`);
  return { records, pages };
}

function partyCounts(candidates) {
  const counts = { Republican: 0, Democratic: 0, Libertarian: 0, Other: 0 };
  for (const c of candidates) {
    const p = c.party_label || "Other";
    counts[p] = (counts[p] ?? 0) + 1;
  }
  return counts;
}

async function main() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  const counties = JSON.parse(fs.readFileSync(COUNTIES_PATH, "utf8")).counties;
  const rawRecords = [];
  let gopText = "";

  try {
    gopText = await fetchText(GOP_URL);
    console.log("[harvest:party-meetings] Fetched Arkansas GOP county page");
  } catch (e) {
    console.warn("[harvest:party-meetings] Live GOP fetch failed — using cache:", e.message);
    if (fs.existsSync(RAW_OUT)) {
      gopText = JSON.parse(fs.readFileSync(RAW_OUT, "utf8")).gop_page_text || "";
    }
  }

  if (gopText) rawRecords.push(...parseGopCountyPageText(gopText));

  let demIndexEntries = [];
  try {
    const cptList = await fetchDemCountyCptList();
    demIndexEntries = cptList
      .map((row) => {
        const county = matchCountyName(row.county, counties) || row.county;
        return county ? { county, slug: row.slug, url: row.url } : null;
      })
      .filter(Boolean);
    console.log(`[harvest:party-meetings] ArkDems WP county CPT: ${demIndexEntries.length} counties`);
  } catch (e) {
    console.warn("[harvest:party-meetings] Dem WP county list failed:", e.message);
  }
  if (!demIndexEntries.length) {
    demIndexEntries = counties.map((county) => ({
      county,
      slug: countySlug(county),
      url: demCountyUrl(county),
    }));
    console.log(`[harvest:party-meetings] Dem county URLs from AR county list: ${demIndexEntries.length}`);
  }
  if (!demIndexEntries.length) {
    try {
      const indexHtml = await fetchText(DEM_COUNTIES_INDEX);
      demIndexEntries = parseDemCountiesIndex(indexHtml, counties);
      console.log(`[harvest:party-meetings] ArkDems counties index: ${demIndexEntries.length} links`);
    } catch (e2) {
      console.warn("[harvest:party-meetings] Dem counties index fetch failed:", e2.message);
    }
  }

  const { records: demRecords, pages: demPages } = await harvestDemocraticCounties(
    counties,
    registry.democratic_county_pages ?? [],
    demIndexEntries,
  );
  rawRecords.push(...demRecords);

  try {
    const lpHtml = await fetchText(LPAR_URL);
    rawRecords.push(...parseLibertarianEventsPage(lpHtml));
    console.log("[harvest:party-meetings] Fetched Libertarian events page");
  } catch (e) {
    console.warn("[harvest:party-meetings] LP fetch failed:", e.message);
  }

  const staged = normalizeAll(rawRecords);
  const byCounty = {};
  for (const c of staged) byCounty[c.county] = (byCounty[c.county] ?? 0) + 1;

  const gopCounties = new Set(rawRecords.filter((r) => r.party_label === "Republican").map((r) => r.county));
  const demWithInfo = demPages.filter((p) => p.meeting_info).length;

  const summary = {
    generatedAt: new Date().toISOString(),
    pass: "25-civic-political-infrastructure",
    sourcesUsed: [GOP_URL, "https://www.arkdems.org/county/*", LPAR_URL],
    rawMeetingRecords: rawRecords.length,
    stagedCandidates: staged.length,
    partyCounts: partyCounts(staged),
    countiesWithData: Object.keys(byCounty).length,
    republicanCountiesFound: gopCounties.size,
    democraticCountyPages: demPages.length,
    democraticCountiesWithMeetingInfo: demWithInfo,
    recurrenceNeedsReview: staged.filter((c) => (c.notes || "").includes("Recurrence unclear") || !c.event_date).length,
    withDates: staged.filter((c) => c.event_date).length,
    awaitingConfirmation: rawRecords.filter((r) => /awaiting/i.test(r.recurrence_text || "")).length,
  };

  registry.democratic_county_pages = demPages;
  registry.updatedAt = summary.generatedAt;
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));

  fs.mkdirSync(path.dirname(RAW_OUT), { recursive: true });
  fs.writeFileSync(
    RAW_OUT,
    JSON.stringify({ generatedAt: summary.generatedAt, gop_page_text: gopText.slice(0, 500000), records: rawRecords, democratic_county_pages: demPages }, null, 2),
  );
  fs.writeFileSync(STAGED_OUT, JSON.stringify({ generatedAt: summary.generatedAt, candidates: staged }, null, 2));
  fs.writeFileSync(SUMMARY_OUT, JSON.stringify(summary, null, 2));

  console.log(`[harvest:party-meetings] ${rawRecords.length} raw → ${staged.length} staged`);
  console.log(`[harvest:party-meetings] R counties: ${gopCounties.size} · D pages: ${demPages.length} (${demWithInfo} with meeting info)`);
  console.log(`[harvest:party-meetings] Republican: ${summary.partyCounts.Republican} · Democratic: ${summary.partyCounts.Democratic} · Libertarian: ${summary.partyCounts.Libertarian}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
