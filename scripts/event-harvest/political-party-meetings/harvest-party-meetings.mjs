#!/usr/bin/env node
/**
 * Harvest public party meeting information into staged candidates (needs_review).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseGopCountyPageText } from "./parse-gop-county-page.mjs";
import { normalizeAll } from "./normalize-party-meeting-candidate.mjs";
import { parseRecurrenceRule } from "./parse-recurring-meetings.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const REGISTRY_PATH = path.join(ROOT, "data/event-harvest/political-party-source-registry.json");
const RAW_OUT = path.join(ROOT, "data/ingestion/political-party-meetings-raw.json");
const STAGED_OUT = path.join(ROOT, "data/ingestion/political-party-meetings-staged.json");
const SUMMARY_OUT = path.join(ROOT, "data/ingestion/political-party-meetings-summary.json");
const GOP_URL = "https://www.arkansasgop.org/countygop.html";

async function fetchText(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "ArkansasEverywhere-CivicBot/1.0 (+https://arkansaseverywhere.org)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function loadDemocraticSeeds(registry) {
  return (registry.democratic_county_pages ?? []).map((row) => {
    const rule = parseRecurrenceRule(row.meeting_info || "");
    return {
      id: `dem-${row.county.toLowerCase().replace(/\s+/g, "-")}`,
      party_label: "Democratic",
      organization: "Democratic Party of Arkansas",
      county: row.county,
      recurrence_text: row.meeting_info,
      meeting_name: `${row.county} County Democratic Committee Meeting`,
      meeting_subtype: "county_party_committee",
      source_url: row.url,
      discovered_by: "harvest:party-meetings:dpa",
      confidence_score: row.meeting_info ? (rule.confidence ?? 50) : 30,
      verification_status: row.meeting_info ? "needs_verification" : "needs_review",
      raw_excerpt: row.meeting_info,
    };
  });
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
  const rawRecords = [];
  let gopText = "";

  try {
    gopText = await fetchText(GOP_URL);
    console.log("[harvest:party-meetings] Fetched Arkansas GOP county page");
  } catch (e) {
    console.warn("[harvest:party-meetings] Live fetch failed — using cached raw if present:", e.message);
    if (fs.existsSync(RAW_OUT)) {
      const prev = JSON.parse(fs.readFileSync(RAW_OUT, "utf8"));
      gopText = prev.gop_page_text || "";
    }
  }

  if (gopText) {
    rawRecords.push(...parseGopCountyPageText(gopText));
  }

  rawRecords.push(...loadDemocraticSeeds(registry));

  const staged = normalizeAll(rawRecords);
  const byCounty = {};
  for (const c of staged) {
    byCounty[c.county] = (byCounty[c.county] ?? 0) + 1;
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    sourcesUsed: [GOP_URL, "https://www.arkdems.org/county/*"],
    rawMeetingRecords: rawRecords.length,
    stagedCandidates: staged.length,
    partyCounts: partyCounts(staged),
    countiesWithData: Object.keys(byCounty).length,
    recurrenceNeedsReview: staged.filter((c) => (c.notes || "").includes("Recurrence unclear") || !c.event_date).length,
    withDates: staged.filter((c) => c.event_date).length,
    awaitingConfirmation: rawRecords.filter((r) => /awaiting/i.test(r.recurrence_text || "")).length,
  };

  fs.mkdirSync(path.dirname(RAW_OUT), { recursive: true });
  fs.writeFileSync(
    RAW_OUT,
    JSON.stringify({ generatedAt: summary.generatedAt, gop_page_text: gopText.slice(0, 500000), records: rawRecords }, null, 2),
  );
  fs.writeFileSync(STAGED_OUT, JSON.stringify({ generatedAt: summary.generatedAt, candidates: staged }, null, 2));
  fs.writeFileSync(SUMMARY_OUT, JSON.stringify(summary, null, 2));

  console.log(`[harvest:party-meetings] ${rawRecords.length} raw → ${staged.length} staged`);
  console.log(`[harvest:party-meetings] Republican: ${summary.partyCounts.Republican} · Democratic: ${summary.partyCounts.Democratic}`);
  console.log(`[harvest:party-meetings] → ${STAGED_OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
