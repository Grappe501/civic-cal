#!/usr/bin/env node
/** CLI: approve verified recurring party meeting series into public seed. */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { approveRecurringSeries } = require("./lib/series-approval.cjs");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const seriesKey = process.argv[2];
const all = process.argv.includes("--all-verified");

if (!seriesKey && !all) {
  console.error("Usage: node approve-recurring-series.mjs <series_key> | --all-verified");
  process.exit(1);
}

if (all) {
  const staged = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../data/ingestion/political-party-meetings-staged.json"), "utf8"),
  );
  const keys = [
    ...new Set(
      staged.candidates
        .filter((c) => c.is_recurring_series && (c.confidence_score ?? 0) >= 60 && c.source_type === "political_party_public_page")
        .map((c) => c.series_key),
    ),
  ];
  let total = 0;
  for (const key of keys) {
    const r = approveRecurringSeries(key, { minConfidence: 60 });
    if (r.ok) {
      console.log(`[approve-series] ${key} → ${r.eventsPublished} events`);
      total += r.eventsPublished;
    }
  }
  console.log(`[approve-series] Total published: ${total}`);
} else {
  const r = approveRecurringSeries(seriesKey, { minConfidence: 50 });
  console.log(JSON.stringify(r, null, 2));
  if (!r.ok) process.exit(1);
}
