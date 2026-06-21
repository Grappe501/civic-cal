#!/usr/bin/env node
/**
 * Pass 24 — daily scan of attached feeds → staged candidates (never auto-publish).
 */
import { dedupeCandidates } from "../event-harvest/lib/dedupe-logic.mjs";
import {
  readJson,
  readFeedRegistries,
  appendRun,
  updateHealth,
  loadStagedAutogrow,
  saveStagedAutogrow,
} from "./lib/autogrow-io.mjs";

const UA = "ArkansasEverywhere-Autogrow/1.0 (+https://arkansaseverywhere.org)";
const config = readJson("autogrow-config.json");
const MAX = config.limits?.dailyFeedScanMax ?? 80;

const DATE_RE = /\b(20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}\/\d{1,2}\/\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+20\d{2})\b/gi;

function stripHtml(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCandidates(feed, text) {
  const found = [];
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).slice(0, 200);
  for (const s of sentences) {
    if (s.length < 12 || s.length > 220) continue;
    if (!DATE_RE.test(s)) continue;
    DATE_RE.lastIndex = 0;
    if (!/event|meeting|festival|fair|game|concert|dinner|fry|parade|workshop|class|calendar/i.test(s)) continue;
    const dateMatch = s.match(DATE_RE);
    found.push({
      title: s.slice(0, 120).trim(),
      event_date: normalizeDate(dateMatch?.[0]),
      county: feed.county ?? null,
      city: feed.city ?? null,
      source_url: feed.calendar_url,
      source_name: feed.label ?? feed.institution_name,
      source_type: feed.source_type ?? "calendar_feed",
      discovered_by: "autogrow:daily-feed-scan",
      review_status: "needs_review",
      confidence_score: 55,
      category: "community",
      intelligence_layer: "community_identity",
      political_opportunity_score: 50,
      notes: "Autogrow feed scan — admin approval required before publish.",
      raw_text: s.slice(0, 300),
    });
    if (found.length >= 8) break;
  }
  return found;
}

function normalizeDate(raw) {
  if (!raw) return null;
  const d = new Date(raw.replace(/\//g, "-"));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

async function fetchFeed(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "text/html,application/json" },
      redirect: "follow",
    });
    if (!res.ok) return { ok: false, status: res.status, text: "" };
    const text = await res.text();
    return { ok: true, status: res.status, text: text.slice(0, 500000) };
  } catch (e) {
    return { ok: false, error: String(e.message || e), text: "" };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const feeds = readFeedRegistries().slice(0, MAX);
  const existing = loadStagedAutogrow();
  const harvested = [];
  let failed = 0;
  let stale = 0;

  for (const feed of feeds) {
    const res = await fetchFeed(feed.calendar_url);
    if (!res.ok) {
      failed++;
      continue;
    }
    const plain = stripHtml(res.text);
    if (plain.length < 80) {
      stale++;
      continue;
    }
    harvested.push(...extractCandidates(feed, plain));
  }

  const merged = dedupeCandidates([...(existing.candidates ?? []), ...harvested]);
  const dupSkipped = (existing.candidates?.length ?? 0) + harvested.length - merged.length;

  saveStagedAutogrow({
    generatedAt: new Date().toISOString(),
    source: "autogrow:daily-feed-scan",
    candidates: merged,
  });

  const summary = {
    feedsScanned: feeds.length,
    newCandidatesFound: harvested.length,
    duplicatesSkipped: dupSkipped,
    staleSources: stale,
    failedSources: failed,
    totalStaged: merged.length,
  };

  appendRun("daily_feed_scan", summary);
  updateHealth({
    lastDailyScan: new Date().toISOString(),
    feedsScanned: feeds.length,
    newCandidatesFound: harvested.length,
    duplicatesSkipped: dupSkipped,
    staleSources: stale,
    failedSources: failed,
    approvalQueueSize: merged.length,
    status: "idle",
  });

  console.log(`[autogrow:daily] ${feeds.length} feeds · ${harvested.length} new · ${merged.length} staged total`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
