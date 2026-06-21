#!/usr/bin/env node
/**
 * Pass 29 — Harvest Arkansas fairs & festivals from public official/tourism/CVB pages.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractDatesFromHtml, pickBestDateRange } from "./lib/date-extract.mjs";
import { normalizeAll, slugify } from "./normalize-festival-event.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const REGISTRY_PATH = path.join(ROOT, "data/event-harvest/fair-festival-source-registry.json");
const RAW_OUT = path.join(ROOT, "data/ingestion/fair-festival-raw.json");
const STAGED_OUT = path.join(ROOT, "data/ingestion/fair-festival-staged.json");

const FETCH_LIMIT = Number(process.env.FAIR_FEST_FETCH_LIMIT ?? 0);
const FETCH_DELAY_MS = Number(process.env.FAIR_FEST_FETCH_DELAY_MS ?? 350);
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

function excerpt(html, max = 600) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function harvestRecordFromSource(source, html, fetchMeta) {
  const dates = extractDatesFromHtml(html, { defaultYear: 2026 });
  const best = pickBestDateRange(dates, source.title);
  const published = !best && source.published_dates?.start ? source.published_dates : null;
  const resolved = best
    ? { startDate: best.startDate, endDate: best.endDate, from: "live_fetch" }
    : published
      ? { startDate: published.start, endDate: published.end || published.start, from: "published_registry" }
      : null;
  const rawExcerpt = excerpt(html);

  const record = {
    festival_source_id: source.id,
    title: source.title,
    date: resolved?.startDate ?? null,
    end_date: resolved?.endDate ?? resolved?.startDate ?? null,
    city: source.city,
    county: source.county,
    venue: source.venue,
    address: source.address,
    category: source.category,
    source_url: source.source_url || source.official_url,
    official_url: source.official_url,
    ticket_url: source.ticket_url ?? null,
    vendor_url: source.vendor_url ?? null,
    sponsor_url: source.sponsor_url ?? null,
    food_available: source.food_available ?? null,
    family_friendly: source.family_friendly ?? null,
    recurring_pattern: source.recurring_pattern ?? null,
    source_confidence: resolved ? (resolved.from === "live_fetch" ? source.source_confidence || "medium" : "high") : "low",
    verification_status: resolved ? "source_dated" : "needs_review",
    source_type: source.source_type,
    raw_excerpt: rawExcerpt,
    date_candidates: dates.slice(0, 8),
    fetch_status: fetchMeta.status,
    fetched_at: fetchMeta.fetched_at,
    fetch_url: fetchMeta.url,
  };

  if (source.is_aggregator) {
    record.notes = "Aggregator page — individual events require linked official confirmation.";
    record.verification_status = "research_task";
  }

  return record;
}

async function main() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  const sources = registry.sources ?? [];
  const registryById = new Map(sources.map((s) => [s.id, s]));
  const rawRecords = [];
  let fetched = 0;
  let dated = 0;

  for (const source of sources) {
    const urls = [
      source.official_url,
      source.source_url,
      ...(source.alternate_urls ?? []),
    ].filter(Boolean);
    const uniqueUrls = [...new Set(urls)];

    let html = "";
    let fetchMeta = { status: "skipped", fetched_at: null, url: uniqueUrls[0] ?? null };

    for (const url of uniqueUrls) {
      const shouldFetch = FETCH_LIMIT === 0 || fetched < FETCH_LIMIT;
      if (!url || !shouldFetch) continue;
      try {
        const chunk = await fetchText(url);
        html += `\n${chunk}`;
        fetchMeta = {
          status: uniqueUrls.indexOf(url) === 0 ? "ok" : "ok_alternate",
          fetched_at: new Date().toISOString(),
          url,
        };
        fetched++;
      } catch (e) {
        if (!fetchMeta.fetched_at) {
          fetchMeta = { status: `error:${e.message}`, fetched_at: new Date().toISOString(), url };
        }
      }
      await sleep(FETCH_DELAY_MS);
    }

    const record = harvestRecordFromSource(source, html || "", fetchMeta);
    if (record.date) dated++;
    rawRecords.push(record);
  }

  const stagedCandidates = normalizeAll(rawRecords.filter((r) => !r.festival_source_id?.includes("aggregator")), registryById);
  // Include all normalized (even undated) for admin review
  const allStaged = normalizeAll(rawRecords, registryById);

  const payload = {
    generatedAt: new Date().toISOString(),
    pass: "29",
    harvest_batch: "fair_festival_harvest_pass29",
    sourceCount: sources.length,
    fetchedCount: fetched,
    datedCount: dated,
    records: rawRecords,
  };

  const stagedPayload = {
    generatedAt: new Date().toISOString(),
    pass: "29",
    candidates: allStaged,
    dated_events: allStaged.filter((c) => c.event_date),
    needs_review: allStaged.filter((c) => !c.event_date),
  };

  fs.mkdirSync(path.dirname(RAW_OUT), { recursive: true });
  fs.writeFileSync(RAW_OUT, JSON.stringify(payload, null, 2));
  fs.writeFileSync(STAGED_OUT, JSON.stringify(stagedPayload, null, 2));

  console.log(`[harvest:fairs-festivals] sources:${sources.length} fetched:${fetched} dated:${dated}`);
  console.log(`[harvest:fairs-festivals] staged:${allStaged.length} with_dates:${stagedPayload.dated_events.length}`);
  console.log(`[harvest:fairs-festivals] wrote ${path.relative(ROOT, RAW_OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
