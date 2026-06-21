#!/usr/bin/env node
/**
 * Import statewide calendar dates to Supabase (when DATABASE_URL configured).
 * Run: npm run import:state-dates
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATES = path.join(ROOT, "data/state-dates/statewide-calendar-dates.json");

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.log("No DATABASE_URL — skipping DB import. JSON bundle is used client-side.");
  const bundle = JSON.parse(fs.readFileSync(DATES, "utf8"));
  console.log(`Client bundle ready: ${bundle.dates.length} dates`);
  process.exit(0);
}

const { default: pg } = await import("pg");
const bundle = JSON.parse(fs.readFileSync(DATES, "utf8"));
const client = new pg.Client({ connectionString: dbUrl });
await client.connect();

for (const d of bundle.dates) {
  await client.query(
    `INSERT INTO civic_call.state_calendar_dates
      (id, title, date, end_date, category, subcategory, source_name, source_url,
       applies_statewide, county, city, notes, season_year, species, method, zone, verification_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       verification_status = EXCLUDED.verification_status,
       notes = EXCLUDED.notes`,
    [
      d.id,
      d.title,
      d.date,
      d.end_date ?? null,
      d.category,
      d.subcategory ?? null,
      d.source_name,
      d.source_url,
      d.applies_statewide ?? true,
      d.county ?? null,
      d.city ?? null,
      d.notes ?? null,
      d.season_year ?? null,
      d.species ?? null,
      d.method ?? null,
      d.zone ?? null,
      d.verification_status ?? "verified",
    ],
  );
}

await client.end();
console.log(`Imported ${bundle.dates.length} state calendar dates`);
