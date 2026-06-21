#!/usr/bin/env node
/** Rebuild approved party meeting bundle from all staged dated occurrences. */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { candidateToEvent, STAGED, APPROVED } = require("./lib/series-approval.cjs");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function normalizeText(value) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getEventCanonicalKey(event) {
  const date = (event.startAt ?? event.start_at ?? "").slice(0, 10);
  return `${normalizeText(event.title)}|${date}|${normalizeText(event.city || event.county)}|${normalizeText(event.county)}`;
}

function getPartyMeetingCanonicalKey(event) {
  const isParty = event.category === "public_party_meeting" || event.partyLabel || event.party_label;
  if (!isParty) return null;
  const when = (event.startAt ?? event.start_at ?? "").slice(0, 16);
  const party = (event.partyLabel ?? event.party_label ?? "").toLowerCase();
  return `party|${normalizeText(event.county)}|${party}|${when}|${normalizeText(event.title)}`;
}

function canonicalKey(event) {
  return getPartyMeetingCanonicalKey(event) ?? getEventCanonicalKey(event);
}

function main() {
  const staged = JSON.parse(fs.readFileSync(STAGED, "utf8"));
  const events = [];
  const seenSlug = new Set();
  const seenCanonical = new Set();

  for (const c of staged.candidates ?? []) {
    if (!c.event_date) continue;
    if (c.source_type !== "political_party_public_page") continue;
    if ((c.confidence_score ?? 0) < 45 && !c.is_recurring_series) continue;
    const ev = candidateToEvent(c);
    const ck = canonicalKey(ev);
    if (seenSlug.has(ev.slug) || seenCanonical.has(ck)) continue;
    seenSlug.add(ev.slug);
    seenCanonical.add(ck);
    events.push(ev);
  }

  events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const byParty = { Democratic: 0, Republican: 0, Libertarian: 0, Other: 0 };
  for (const e of events) {
    const p = e.partyLabel || "Other";
    byParty[p] = (byParty[p] ?? 0) + 1;
  }

  const bundle = {
    generatedAt: new Date().toISOString(),
    events,
    partyCounts: byParty,
    total: events.length,
  };

  fs.writeFileSync(APPROVED, JSON.stringify(bundle, null, 2));
  console.log(`[party:republish] ${events.length} events · Dem ${byParty.Democratic} · GOP ${byParty.Republican}`);
}

main();
