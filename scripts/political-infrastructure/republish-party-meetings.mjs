#!/usr/bin/env node
/** Rebuild approved party meeting bundle from all staged dated occurrences. */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { candidateToEvent, STAGED, APPROVED } = require("./lib/series-approval.cjs");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function main() {
  const staged = JSON.parse(fs.readFileSync(STAGED, "utf8"));
  const events = [];
  const seen = new Set();

  for (const c of staged.candidates ?? []) {
    if (!c.event_date) continue;
    if (c.source_type !== "political_party_public_page") continue;
    if ((c.confidence_score ?? 0) < 45 && !c.is_recurring_series) continue;
    const ev = candidateToEvent(c);
    if (seen.has(ev.slug)) continue;
    seen.add(ev.slug);
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
