#!/usr/bin/env node
/**
 * Pass 29 — Harvest all 75 Arkansas county fair lane records + regional/state fairs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildAllCountyFairRecords,
  REGIONAL_FAIRS,
  SECONDARY_FAIR_SOURCES,
  OFFICIAL_FAIR_URLS,
  cofairsSlugForCounty,
  countySlug,
  fairSearchPatterns,
} from "./lib/county-fair-base.mjs";
import { extractDatesFromHtml, pickBestDateRange } from "../fairs-festivals/lib/date-extract.mjs";
import { normalizeCountyFair, normalizeResearchTask } from "./normalize-county-fair.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const REGISTRY_OUT = path.join(ROOT, "data/fairs/arkansas-county-fair-registry.json");
const SOURCE_OUT = path.join(ROOT, "data/fairs/arkansas-fair-source-registry.json");
const RAW_OUT = path.join(ROOT, "data/ingestion/county-fair-raw.json");
const STAGED_OUT = path.join(ROOT, "data/ingestion/county-fair-staged.json");
const RESEARCH_OUT = path.join(ROOT, "data/ingestion/county-fair-research-tasks.json");
const VERIFIED_SEED_PATH = path.join(ROOT, "data/fairs/cofairs-2026-verified-seed.json");
const OFFICIAL_VERIFIED_SEED_PATH = path.join(ROOT, "data/fairs/county-fair-official-verified-seed-2026.json");
const COFAIRS_INDEX = "https://cofairs.com/arkansas/";
const FETCH_DELAY_MS = Number(process.env.COUNTY_FAIR_FETCH_DELAY_MS ?? 300);
const UA = "ArkansasEverywhere-CivicBot/1.0 (+https://arkansaseverywhere.org)";

async function fetchText(url, timeoutMs = 18000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCofairsIndex(html) {
  const text = stripTags(html);
  const entries = [];
  const re =
    /([A-Za-z0-9 .&']+(?:County Fair|District Fair|State Fair)(?:\s*&\s*(?:Livestock Show|Rodeo))?)\s+(20\d{2})\s+([^,]+),\s*AR/gi;
  let m;
  while ((m = re.exec(text))) {
    entries.push({ name: m[1].trim(), year: Number(m[2]), city: m[3].trim() });
  }
  return entries;
}

function parseCofairsDetail(html, url) {
  const text = stripTags(html);
  const titleMatch = text.match(/#\s*([^#]+?)\s+20\d{2}/) || text.match(/([A-Za-z .&']+Fair)\s+20\d{2}/i);
  const dates = extractDatesFromHtml(html, { defaultYear: 2026 });
  // Cofairs headings often use abbreviated months: "Jul 10-18, 2026"
  const abbr = text.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})\s*[–\-]\s*(\d{1,2}),?\s*(20\d{2})\b/i,
  );
  if (abbr) {
    const monthMap = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
    const mon = monthMap[abbr[1].slice(0, 4).toLowerCase()] ?? monthMap[abbr[1].slice(0, 3).toLowerCase()];
    const y = Number(abbr[4]);
    const d1 = Number(abbr[2]);
    const d2 = Number(abbr[3]);
    if (mon && y && d1 && d2) {
      const start = `${y}-${String(mon).padStart(2, "0")}-${String(d1).padStart(2, "0")}`;
      const end = `${y}-${String(mon).padStart(2, "0")}-${String(d2).padStart(2, "0")}`;
      dates.unshift({ startDate: start, endDate: end, source: "cofairs_heading" });
    }
  }
  const best = pickBestDateRange(dates, titleMatch?.[1] || "");
  const venueMatch = text.match(/Fairgrounds[^A-Za-z0-9]*([^]+?)(?:Organizer|Gate Admission|Established)/i);
  const addressMatch = text.match(/\d+[^,]+,\s*AR(?:\s+\d{5})?/i);
  const admissionMatch = text.match(/Gate Admission([^E]+?)(?:Carnival|Parking|Official|Fair by)/i);
  const parkingMatch = text.match(/Parking\s*(Free|Paid[^O]+)/i);
  return {
    date_start: best?.startDate ?? null,
    date_end: best?.endDate ?? best?.startDate ?? null,
    venue_excerpt: venueMatch?.[1]?.slice(0, 120) ?? null,
    address: addressMatch?.[0] ?? null,
    admission_info: admissionMatch?.[1]?.trim().slice(0, 200) ?? null,
    parking_info: parkingMatch?.[1]?.trim() ?? null,
    source_url: url,
    date_candidates: dates.slice(0, 6),
    raw_excerpt: text.slice(0, 800),
  };
}

function matchCountyFromFairName(name, counties) {
  for (const county of counties) {
    if (name.toLowerCase().includes(`${county.toLowerCase()} county`)) return county;
  }
  return null;
}

async function resolveCofairsPage(slugs) {
  for (const slug of slugs) {
    const url = `https://cofairs.com/arkansas/${slug}`;
    try {
      const html = await fetchText(url);
      if (/404|not found/i.test(html.slice(0, 500))) continue;
      if (!/20\d{2}/.test(html)) continue;
      return { url, html, slug };
    } catch {
      /* try next slug */
    }
    await sleep(FETCH_DELAY_MS);
  }
  return null;
}

async function harvestFairRecord(base, cofairsByCounty, options = {}) {
  const { isRegional = false, isStateFair = false } = options;
  const record = { ...base, information_last_refreshed: new Date().toISOString() };
  const cofairsMeta = cofairsByCounty.get(base.county);
  let html = "";
  let sourceType = "county_fair_page";
  let sourceUrl = base.official_url;
  let sourceConfidence = "placeholder";

  const indexYear = cofairsMeta?.year;
  const shouldFetchDetail = Boolean(
    isRegional || isStateFair || base.official_url || indexYear === 2026 || SECONDARY_FAIR_SOURCES[base.county]?.length,
  );

  if (shouldFetchDetail && base.official_url) {
    try {
      html += `\n${await fetchText(base.official_url)}`;
      sourceUrl = base.official_url;
      sourceType = "county_fair_page";
      sourceConfidence = "high";
      await sleep(FETCH_DELAY_MS);
    } catch {
      /* official fetch optional — verified seed may still apply */
    }
  }

  for (const secondary of SECONDARY_FAIR_SOURCES[base.county] ?? []) {
    try {
      html += `\n${await fetchText(secondary.url)}`;
      if (!sourceUrl) sourceUrl = secondary.url;
      if (sourceType === "county_fair_page" && secondary.type !== "county_fair_page") {
        /* keep official type when both exist */
      } else if (!base.official_url) {
        sourceType = secondary.type;
        sourceConfidence = secondary.type === "tourism_cvb_page" ? "high" : "medium";
      }
      await sleep(FETCH_DELAY_MS);
    } catch {
      /* secondary optional */
    }
  }

  const cofairsSlugs = isRegional || isStateFair
    ? [base.cofairs_url?.replace("https://cofairs.com/arkansas/", "")]
    : cofairsSlugForCounty(base.county);

  const cofairsPage =
    shouldFetchDetail && base.cofairs_url
      ? await resolveCofairsPage(
          (cofairsSlugs || []).filter(Boolean).length
            ? cofairsSlugs.filter(Boolean)
            : [base.cofairs_url.split("/").pop()],
        )
      : null;

  if (cofairsPage) {
    html += `\n${cofairsPage.html}`;
    const detail = parseCofairsDetail(cofairsPage.html, cofairsPage.url);
    if (detail.date_start?.startsWith("2026")) {
      record.date_start = detail.date_start;
      record.date_end = detail.date_end;
      record.address = detail.address || record.address;
      record.admission_info = detail.admission_info;
      record.parking_info = detail.parking_info;
      sourceUrl = sourceUrl || detail.source_url;
      sourceType = sourceUrl === base.official_url ? "county_fair_page" : "fair_guide_page";
      sourceConfidence = sourceUrl === base.official_url ? "high" : "medium";
      record.verification_status = "verified_dated";
      record.source_url = sourceUrl || cofairsPage.url;
    }
    record.cofairs_url = cofairsPage.url;
  }

  if (!record.date_start && html) {
    const dates = extractDatesFromHtml(html, { defaultYear: 2026 });
    const best = pickBestDateRange(dates, base.fair_name);
    if (best?.startDate?.startsWith("2026")) {
      record.date_start = best.startDate;
      record.date_end = best.endDate;
      record.verification_status = "verified_dated";
      record.source_url = sourceUrl || base.official_url || base.cofairs_url;
      sourceConfidence = base.official_url ? "high" : "medium";
      sourceType = base.official_url ? "county_fair_page" : "fair_guide_page";
    }
  }

  if (cofairsMeta?.year === 2026 && !record.date_start) {
    record.notes = `Cofairs index lists ${base.fair_name} for 2026 in ${cofairsMeta.city} — detail page did not parse dates; needs manual confirmation.`;
  }

  if (!record.date_start) {
    record.verification_status = "needs_date_confirmation";
    record.notes =
      record.notes ||
      `No verified 2026 dates found from public official or guide sources for ${base.county} County.`;
    record.source_url = record.source_url || base.official_url || base.cofairs_url || null;
  }

  record.source_confidence = sourceConfidence;
  record.source_type = isStateFair ? "official_festival_website" : isRegional ? sourceType : sourceType;
  record.is_regional_fair = isRegional;
  record.is_state_fair = isStateFair;
  if (cofairsMeta?.city && !record.city) record.city = cofairsMeta.city;

  return record;
}

function cofairsUrlForEntry(entry, counties) {
  const county = matchCountyFromFairName(entry.name, counties);
  if (county) return `https://cofairs.com/arkansas/${countySlug(county)}-county-fair`;
  const regional = REGIONAL_FAIRS.find((r) => entry.name.toLowerCase().includes(r.fair_name.toLowerCase().slice(0, 12)));
  if (regional?.cofairs_url) return regional.cofairs_url;
  const slug = entry.name
    .replace(/\s+20\d{2}$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `https://cofairs.com/arkansas/${slug}`;
}

async function enrichCofairs2026(rawRecords, indexEntries, counties) {
  for (const entry of indexEntries.filter((e) => e.year === 2026)) {
    const url = cofairsUrlForEntry(entry, counties);
    let record =
      rawRecords.find((r) => r.county === matchCountyFromFairName(entry.name, counties)) ||
      rawRecords.find((r) => entry.name.toLowerCase().includes(String(r.fair_name).toLowerCase().slice(0, 10)));
    if (!record) continue;
    try {
      const html = await fetchText(url);
      const detail = parseCofairsDetail(html, url);
      if (detail.date_start?.startsWith("2026")) {
        record.date_start = detail.date_start;
        record.date_end = detail.date_end;
        record.address = detail.address || record.address;
        record.admission_info = detail.admission_info || record.admission_info;
        record.parking_info = detail.parking_info || record.parking_info;
        record.cofairs_url = url;
        record.source_url = record.official_url || url;
        record.source_confidence = record.official_url ? "high" : "medium";
        record.source_type = record.official_url ? "county_fair_page" : "fair_guide_page";
        record.verification_status = "verified_dated";
        record.notes = null;
        if (entry.city) record.city = entry.city;
      }
    } catch {
      record.notes =
        record.notes ||
        `Cofairs lists ${entry.name} for 2026 — detail fetch failed; confirm at ${url}`;
    }
    await sleep(FETCH_DELAY_MS);
  }
}

function applyVerifiedSeed(rawRecords) {
  if (!fs.existsSync(VERIFIED_SEED_PATH)) return;
  const seed = JSON.parse(fs.readFileSync(VERIFIED_SEED_PATH, "utf8"));
  const byCounty = new Map((seed.entries ?? []).map((e) => [e.county, e]));
  for (const record of rawRecords) {
    if (record.verification_status === "verified_dated") continue;
    const entry = byCounty.get(record.county);
    if (!entry) continue;
    record.date_start = entry.start;
    record.date_end = entry.end;
    record.city = entry.city || record.city;
    record.venue = entry.venue || record.venue;
    record.address = entry.address || record.address;
    record.source_url = entry.source_url;
    record.cofairs_url = entry.source_url;
    record.source_confidence = "medium";
    record.source_type = seed.source_type || "fair_guide_page";
    record.verification_status = "verified_dated";
    record.notes = `Cofairs guide listing verified ${seed.verifiedAt ?? "2026"} — confirm with official fair page when available.`;
  }
}

function applyOfficialVerifiedSeed(rawRecords) {
  if (!fs.existsSync(OFFICIAL_VERIFIED_SEED_PATH)) return;
  const seed = JSON.parse(fs.readFileSync(OFFICIAL_VERIFIED_SEED_PATH, "utf8"));
  const byCounty = new Map((seed.entries ?? []).map((e) => [e.county, e]));
  for (const record of rawRecords) {
    const entry = byCounty.get(record.county);
    if (!entry) continue;
    record.fair_name = entry.fair_name || record.fair_name;
    record.date_start = entry.start;
    record.date_end = entry.end;
    record.city = entry.city || record.city;
    record.venue = entry.venue || record.venue;
    record.address = entry.address || record.address;
    record.official_url = entry.official_url || record.official_url;
    record.source_url = entry.source_url;
    record.source_confidence = entry.source_confidence || "high";
    record.source_type = entry.source_type || "county_fair_page";
    record.verification_status = "verified_dated";
    record.notes = `Official/public source verified ${seed.verifiedAt ?? "2026"} (Pass 29B).`;
  }
}

async function main() {
  const counties = buildAllCountyFairRecords().map((r) => r.county);
  let indexHtml = "";
  try {
    indexHtml = await fetchText(COFAIRS_INDEX);
  } catch (e) {
    console.warn(`[harvest:county-fairs] Cofairs index fetch failed: ${e.message}`);
  }

  const indexEntries = indexHtml ? parseCofairsIndex(indexHtml) : [];
  const cofairsByCounty = new Map();
  for (const entry of indexEntries) {
    const county = matchCountyFromFairName(entry.name, counties);
    if (county) cofairsByCounty.set(county, entry);
  }

  const countyRecords = buildAllCountyFairRecords();
  const rawRecords = [];
  for (const base of countyRecords) {
    rawRecords.push(await harvestFairRecord(base, cofairsByCounty));
    await sleep(FETCH_DELAY_MS / 2);
  }

  for (const regional of REGIONAL_FAIRS) {
    rawRecords.push(
      await harvestFairRecord(
        {
          ...regional,
          fair_name: regional.fair_name,
          verification_status: "needs_date_confirmation",
          source_confidence: "placeholder",
          cofairs_url: regional.cofairs_url,
        },
        cofairsByCounty,
        { isRegional: regional.category === "regional_fair", isStateFair: regional.category === "state_fair" },
      ),
    );
    await sleep(FETCH_DELAY_MS / 2);
  }

  await enrichCofairs2026(rawRecords, indexEntries, counties);
  applyVerifiedSeed(rawRecords);
  applyOfficialVerifiedSeed(rawRecords);

  const registryPayload = {
    pass: "29",
    label: "Arkansas county fair lane — 75 counties",
    generatedAt: new Date().toISOString(),
    countyCount: countyRecords.length,
    fairs: countyRecords.map((base) => {
      const harvested = rawRecords.find((r) => r.id === base.id);
      return harvested || base;
    }),
  };

  const sourcePayload = {
    pass: "29",
    generatedAt: new Date().toISOString(),
    sources: [
      ...countyRecords.map((r) => ({
        id: r.id,
        county: r.county,
        official_url: OFFICIAL_FAIR_URLS[r.county] ?? r.official_url,
        secondary_urls: (SECONDARY_FAIR_SOURCES[r.county] ?? []).map((s) => s.url),
        cofairs_url: r.cofairs_url,
        source_type: "county_fair_page",
        search_patterns: fairSearchPatterns(r.county),
      })),
      ...REGIONAL_FAIRS.map((r) => ({
        id: r.id,
        county: r.county,
        official_url: r.official_url,
        cofairs_url: r.cofairs_url,
        source_type: r.source_type,
        category: r.category,
      })),
      { id: "cofairs-arkansas-index", url: COFAIRS_INDEX, source_type: "fair_guide_page" },
    ],
  };

  const stagedCandidates = rawRecords.map(normalizeCountyFair);
  const dated = stagedCandidates.filter((c) => c.event_date && c.verification_status === "verified_dated");
  const researchTasks = rawRecords
    .filter((r) => r.verification_status === "needs_date_confirmation")
    .map((r) => normalizeResearchTask(r, fairSearchPatterns(r.county)));

  fs.mkdirSync(path.dirname(REGISTRY_OUT), { recursive: true });
  fs.writeFileSync(REGISTRY_OUT, JSON.stringify(registryPayload, null, 2));
  fs.writeFileSync(SOURCE_OUT, JSON.stringify(sourcePayload, null, 2));
  fs.writeFileSync(
    RAW_OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        pass: "29",
        records: rawRecords,
        cofairsIndexEntries: indexEntries.length,
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    STAGED_OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        pass: "29",
        candidates: stagedCandidates,
        dated_events: dated,
        needs_review: stagedCandidates.filter((c) => !c.event_date),
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    RESEARCH_OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        pass: "29",
        tasks: researchTasks,
        openCount: researchTasks.length,
      },
      null,
      2,
    ),
  );

  const verified = rawRecords.filter((r) => r.verification_status === "verified_dated" && !r.is_regional_fair && !r.is_state_fair);
  console.log(
    `[harvest:county-fairs] counties:${countyRecords.length} verified_dated:${verified.length} research:${researchTasks.length} regional+state:${rawRecords.length - countyRecords.length}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
