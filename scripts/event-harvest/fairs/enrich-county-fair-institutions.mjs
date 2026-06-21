#!/usr/bin/env node
/**
 * Pass 33 — Enrich county fairs as institution → tradition → event stream.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { extractDatesFromHtml, pickBestDateRange } from "../fairs-festivals/lib/date-extract.mjs";
import {
  classifyFairLinks,
  extensionOfficeUrl,
  extractHrefLinks,
  fairEntrySearchUrl,
  fetchFairText,
} from "./lib/fetch-fair-public.mjs";
import { extraSourcesForCounty, fairSearchPatterns } from "./lib/county-fair-base.mjs";
import { normalizeCountyFair, normalizeResearchTask } from "./normalize-county-fair.mjs";

const require = createRequire(import.meta.url);
const { approveCountyFairEvents } = require("./lib/county-fair-approval.cjs");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const REGISTRY = path.join(ROOT, "data/fairs/arkansas-county-fair-registry.json");
const INSTITUTIONS_OUT = path.join(ROOT, "data/fairs/county-fair-institution-profiles.json");
const RESEARCH_OUT = path.join(ROOT, "data/ingestion/county-fair-research-tasks.json");
const DELAY_MS = Number(process.env.COUNTY_FAIR_ENRICH_DELAY_MS ?? 350);
const LIMIT = Number(process.env.COUNTY_FAIR_ENRICH_LIMIT ?? 0);

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

function monthFromDate(iso) {
  if (!iso) return null;
  const m = Number(iso.slice(5, 7));
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return names[m - 1] ?? null;
}

function buildInstitutionProfile(fair, enrich = {}) {
  const extUrl = extensionOfficeUrl(fair.county);
  const traditionMonth = monthFromDate(fair.date_start);
  return {
    id: `${fair.id}-institution`,
    institutionType: "county_fair_board",
    pass: "33",
    institution: {
      fair_name: fair.fair_name,
      county: fair.county,
      city: fair.city,
      venue: fair.venue,
      address: fair.address,
      fair_association: enrich.fair_association ?? `${fair.county} County Fair Association`,
      official_website: fair.official_url,
      public_facebook: enrich.facebook_url ?? fair.facebook_url,
      ticket_admission_info: enrich.admission_info ?? fair.admission_info,
      vendor_info_url: enrich.vendor_url ?? fair.vendor_url,
      sponsorship_info_url: enrich.sponsorship_url ?? null,
      livestock_4h_url: enrich.livestock_url ?? fair.livestock_url,
      pageant_url: enrich.pageant_url ?? fair.pageant_url,
      parade_url: enrich.parade_url ?? fair.parade_url,
      rodeo_url: enrich.rodeo_url ?? fair.rodeo_url,
      carnival_url: enrich.carnival_url ?? fair.carnival_url,
      demolition_derby_url: enrich.demolition_derby_url ?? fair.demolition_derby_url,
      schedule_url: enrich.schedule_url ?? fair.schedule_url,
      fair_book_pdf: enrich.fair_book_pdf ?? null,
      parking_info: enrich.parking_info ?? fair.parking_info,
      history_public: enrich.history_excerpt ?? null,
      years_running_hint: enrich.years_running_hint ?? null,
      recurring_pattern: traditionMonth ? { typical_month: traditionMonth, annual: true } : { annual: true },
      extension_office_url: extUrl,
      homemakers_url: extUrl,
      four_h_url: enrich.livestock_url ?? fair.livestock_url ?? extUrl,
      fair_entry_search_url: fairEntrySearchUrl(fair.county),
      source_urls: [fair.official_url, fair.source_url, fair.cofairs_url].filter(Boolean),
      source_confidence: fair.source_confidence,
      information_last_refreshed: new Date().toISOString(),
    },
    tradition: {
      id: `${fair.id}-tradition`,
      title: fair.fair_name,
      entityType: "tradition",
      recurring: "annual",
      typical_month: traditionMonth,
      county: fair.county,
      city: fair.city,
      source_url: fair.source_url,
    },
    event_stream: {
      verification_status: fair.verification_status,
      date_start: fair.date_start,
      date_end: fair.date_end,
      calendar_slug_hint: fair.date_start
        ? `${fair.id.replace(/-county-fair$/, "")}-county-fair-${fair.date_start}`
        : null,
    },
    influence_graph_links: [
      { entityType: "county", slug: `${fair.county.toLowerCase().replace(/\s+/g, "-")}-county`, label: `${fair.county} County` },
      { entityType: "institution", slug: `extension-${fair.county.toLowerCase().replace(/\s+/g, "-")}`, label: `${fair.county} Extension`, url: extUrl },
    ],
    enrichment_stats: {
      has_history: Boolean(enrich.history_excerpt || enrich.years_running_hint),
      has_vendor: Boolean(enrich.vendor_url ?? fair.vendor_url),
      has_livestock_4h: Boolean(enrich.livestock_url ?? fair.livestock_url),
      has_sponsor: Boolean(enrich.sponsorship_url),
    },
  };
}

async function enrichFairRecord(fair) {
  const urls = [
    fair.official_url,
    fair.source_url,
    fair.cofairs_url,
    ...extraSourcesForCounty(fair.county).map((s) => s.url),
  ].filter(Boolean);
  const seen = new Set();
  let combinedHtml = "";
  let combinedText = "";
  const enrich = {};

  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    try {
      const { text, via } = await fetchFairText(url);
      combinedHtml += `\n${text}`;
      combinedText += `\n${stripTags(text)}`;
      enrich.fetch_log = enrich.fetch_log ?? [];
      enrich.fetch_log.push({ url, via });
      await sleep(DELAY_MS);
    } catch {
      /* optional source */
    }
  }

  if (combinedHtml) {
    const base = fair.official_url || fair.source_url || urls[0];
    const links = extractHrefLinks(combinedHtml, base);
    const classified = classifyFairLinks(links, combinedText);
    Object.assign(enrich, classified);

    const years = combinedText.match(/\b(\d+(?:st|nd|rd|th)\s+annual|since\s+(19|20)\d{2}|established\s+(19|20)\d{2})/i);
    if (years) enrich.years_running_hint = years[0];
    if (classified.has_history_hint) {
      enrich.history_excerpt = combinedText.slice(0, 400);
    }

    if (!fair.date_start) {
      const dates = extractDatesFromHtml(combinedHtml, { defaultYear: 2026 });
      const best = pickBestDateRange(dates, fair.fair_name);
      if (best?.startDate?.startsWith("2026")) {
        fair.date_start = best.startDate;
        fair.date_end = best.endDate;
        fair.verification_status = "verified_dated";
        fair.source_confidence = fair.official_url ? "high" : "medium";
        fair.source_url = fair.source_url || fair.official_url || base;
        fair.notes = null;
      }
    }

    if (classified.has_history_hint) {
      enrich.history_excerpt = combinedText.slice(0, 400);
    }
  }

  return { fair, enrich };
}

async function main() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  let fairs = (registry.fairs ?? []).filter((f) => !f.is_regional_fair && !f.is_state_fair);
  if (LIMIT > 0) fairs = fairs.slice(0, LIMIT);

  const profiles = [];
  let enrichedLinks = 0;
  let newlyVerified = 0;
  const beforeVerified = fairs.filter((f) => f.verification_status === "verified_dated").length;

  for (const fair of fairs) {
    const prior = fair.verification_status;
    const { fair: updated, enrich } = await enrichFairRecord(fair);
    if (prior !== "verified_dated" && updated.verification_status === "verified_dated") newlyVerified += 1;

    if (enrich.vendor_url || enrich.livestock_url || enrich.history_excerpt || enrich.sponsorship_url) {
      enrichedLinks += 1;
    }

    updated.schedule_url = enrich.schedule_url ?? updated.schedule_url;
    updated.vendor_url = enrich.vendor_url ?? updated.vendor_url;
    updated.livestock_url = enrich.livestock_url ?? updated.livestock_url;
    updated.pageant_url = enrich.pageant_url ?? updated.pageant_url;
    updated.parade_url = enrich.parade_url ?? updated.parade_url;
    updated.rodeo_url = enrich.rodeo_url ?? updated.rodeo_url;
    updated.carnival_url = enrich.carnival_url ?? updated.carnival_url;
    updated.demolition_derby_url = enrich.demolition_derby_url ?? updated.demolition_derby_url;
    updated.facebook_url = enrich.facebook_url ?? updated.facebook_url;
    updated.ticket_url = enrich.ticket_url ?? updated.ticket_url;
    updated.admission_info = enrich.admission_info ?? updated.admission_info;
    updated.information_last_refreshed = new Date().toISOString();

    profiles.push(buildInstitutionProfile(updated, enrich));
    Object.assign(fair, updated);
  }

  registry.pass = "33";
  registry.label = "Arkansas county fair lane — institution-first (75 counties)";
  registry.generatedAt = new Date().toISOString();
  registry.institutionProfileCount = profiles.length;

  const researchTasks = fairs
    .filter((f) => f.verification_status !== "verified_dated")
    .map((f) => normalizeResearchTask(f, fairSearchPatterns(f.county)));

  fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2));
  fs.writeFileSync(
    INSTITUTIONS_OUT,
    JSON.stringify(
      {
        pass: "33",
        generatedAt: new Date().toISOString(),
        profileCount: profiles.length,
        profiles,
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    RESEARCH_OUT,
    JSON.stringify(
      {
        pass: "33",
        generatedAt: new Date().toISOString(),
        tasks: researchTasks,
        openCount: researchTasks.length,
      },
      null,
      2,
    ),
  );

  const STAGED_OUT = path.join(ROOT, "data/ingestion/county-fair-staged.json");
  const stagedCandidates = registry.fairs.filter((f) => !f.is_regional_fair && !f.is_state_fair).map(normalizeCountyFair);
  const dated = stagedCandidates.filter((c) => c.event_date && c.verification_status === "verified_dated");
  fs.writeFileSync(
    STAGED_OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        pass: "33",
        candidates: stagedCandidates,
        dated_events: dated,
        needs_review: stagedCandidates.filter((c) => !c.event_date),
      },
      null,
      2,
    ),
  );
  const approval = approveCountyFairEvents({ minConfidence: 60 });

  const afterVerified = fairs.filter((f) => f.verification_status === "verified_dated").length;
  const withHistory = profiles.filter((p) => p.enrichment_stats.has_history).length;
  const withVendor = profiles.filter((p) => p.enrichment_stats.has_vendor).length;
  const with4h = profiles.filter((p) => p.enrichment_stats.has_livestock_4h).length;
  const withSponsor = profiles.filter((p) => p.enrichment_stats.has_sponsor).length;

  console.log(
    `[county-fairs:enrich-institutions] profiles:${profiles.length} verified:${beforeVerified}→${afterVerified} newlyVerified:${newlyVerified} research:${researchTasks.length} approved+${approval.approved}`,
  );
  console.log(
    `[county-fairs:enrich-institutions] history:${withHistory} vendor:${withVendor} livestock4h:${with4h} sponsor:${withSponsor}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
