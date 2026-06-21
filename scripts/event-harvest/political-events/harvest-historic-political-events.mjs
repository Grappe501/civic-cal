#!/usr/bin/env node
/**
 * Pass 30 — Harvest historic political events from public registry + optional live fetch.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeAll, slugify } from "./normalize-political-event.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const REGISTRY_PATH = path.join(ROOT, "data/political-events/historic-political-event-registry.json");
const RAW_OUT = path.join(ROOT, "data/ingestion/historic-political-events-raw.json");
const STAGED_OUT = path.join(ROOT, "data/ingestion/historic-political-events-staged.json");
const RESEARCH_OUT = path.join(ROOT, "data/ingestion/historic-political-events-research-tasks.json");

const UA = "ArkansasEverywhere-CivicBot/1.0 (+https://arkansaseverywhere.org)";

async function fetchText(url, timeoutMs = 15000) {
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

function excerpt(html, max = 500) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function recordFromRegistry(entry, fetchMeta = {}) {
  const verified2026 = (entry.verified_dates ?? []).find((d) => d.year === 2026 && d.start);
  return {
    id: entry.id,
    title: entry.title,
    event_type: entry.event_type,
    political_context: entry.political_context,
    host_organization: entry.host_organization,
    city: entry.city,
    county: entry.county,
    venue: entry.venue,
    address: entry.address,
    date_start: verified2026?.start ?? null,
    date_end: verified2026?.end ?? verified2026?.start ?? null,
    first_year_held: entry.first_year_held ?? null,
    honors: entry.honors ?? null,
    typical_audience: entry.typical_audience ?? null,
    historic_significance: entry.historic_significance ?? null,
    notable_speakers: entry.notable_speakers ?? [],
    recurring_pattern: entry.recurring_pattern ?? null,
    source_url: verified2026?.source_url || entry.source_url,
    official_url: entry.official_url ?? null,
    ticket_url: entry.ticket_url ?? null,
    source_type: entry.source_type,
    source_confidence: entry.source_confidence,
    verification_status: verified2026 ? "verified_dated" : entry.verification_status,
    history_available: entry.history_available ?? false,
    confidence_score: entry.confidence_score,
    notes: entry.notes ?? null,
    fetch_status: fetchMeta.status ?? "registry_only",
    fetched_at: fetchMeta.fetched_at ?? null,
    raw_excerpt: fetchMeta.excerpt ?? null,
  };
}

async function main() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  const events = registry.events ?? [];
  const rawRecords = [];
  let fetched = 0;

  for (const entry of events) {
    let fetchMeta = { status: "registry_only", fetched_at: null, excerpt: null };
    const url = entry.source_url;
    if (url && process.env.POLITICAL_FETCH !== "0") {
      try {
        const html = await fetchText(url);
        fetchMeta = { status: "ok", fetched_at: new Date().toISOString(), excerpt: excerpt(html) };
        fetched++;
      } catch (err) {
        fetchMeta = { status: `error:${err.message}`, fetched_at: new Date().toISOString(), excerpt: null };
      }
    }
    rawRecords.push(recordFromRegistry(entry, fetchMeta));
  }

  const { candidates, dated_events, research } = normalizeAll(events, registry.searchQueries ?? []);

  for (const q of registry.searchQueries ?? []) {
    if (!research.find((t) => t.suggested_query === q)) {
      research.push({
        id: `research-query-${slugify(q)}`,
        task_type: "search_query",
        entity: q,
        reason: "Pass 30 search query — discover source-backed historic political events.",
        suggested_query: q,
        priority: "medium",
        status: "open",
        approval_status: "needs_human_review",
        created_at: new Date().toISOString(),
      });
    }
  }

  const rawBundle = {
    pass: "30",
    generatedAt: new Date().toISOString(),
    registryCount: events.length,
    fetched,
    records: rawRecords,
  };

  const stagedBundle = {
    pass: "30",
    generatedAt: new Date().toISOString(),
    candidates,
    dated_events,
    datedCount: dated_events.length,
    stagedCount: candidates.length + dated_events.length,
  };

  const researchBundle = {
    pass: "30",
    generatedAt: new Date().toISOString(),
    openCount: research.filter((t) => t.status === "open").length,
    tasks: research,
  };

  fs.mkdirSync(path.dirname(RAW_OUT), { recursive: true });
  fs.writeFileSync(RAW_OUT, JSON.stringify(rawBundle, null, 2));
  fs.writeFileSync(STAGED_OUT, JSON.stringify(stagedBundle, null, 2));
  fs.writeFileSync(RESEARCH_OUT, JSON.stringify(researchBundle, null, 2));

  console.log(`[harvest:political-events] registry:${events.length} raw:${rawRecords.length} staged:${stagedBundle.stagedCount} dated:${dated_events.length} research:${research.length} fetched:${fetched}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
