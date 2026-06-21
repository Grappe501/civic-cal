#!/usr/bin/env node
/** Import staged-event-candidates.json into civic_call.event_ingestion_candidates */
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const stagedPath = path.join(__dirname, "..", "data", "ingestion", "staged-event-candidates.json");
const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "003_event_ingestion_candidates.sql");
const migration004Path = path.join(__dirname, "..", "supabase", "migrations", "004_intelligence_layers.sql");

async function main() {
  const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!url) {
    console.error("[import:candidates] DATABASE_URL required");
    process.exit(1);
  }
  if (!fs.existsSync(stagedPath)) {
    console.error("[import:candidates] Run npm run harvest:flagship first");
    process.exit(1);
  }

  const staged = JSON.parse(fs.readFileSync(stagedPath, "utf8"));
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  if (fs.existsSync(migrationPath)) {
    await client.query(fs.readFileSync(migrationPath, "utf8"));
  }
  if (fs.existsSync(migration004Path)) {
    await client.query(fs.readFileSync(migration004Path, "utf8"));
  }

  let inserted = 0;
  for (const c of staged.candidates || []) {
    const titleKey = `${c.title}|${c.city}|${c.event_date || "tbd"}`;
    const existing = await client.query(
      `SELECT id FROM civic_call.event_ingestion_candidates WHERE title = $1 AND COALESCE(city,'') = COALESCE($2,'') LIMIT 1`,
      [c.title, c.city],
    );
    if (existing.rows.length) continue;

    await client.query(
      `INSERT INTO civic_call.event_ingestion_candidates (
        title, description, event_date, venue_name, address, city, county, state,
        category, civic_value, political_opportunity_score, confidence_score,
        source_name, source_url, source_type, discovered_by, raw_text,
        review_status, notes, is_recurring_annual,
        intelligence_layer, relationship_density_score, typical_attendance_band,
        tradition_started_year, recurring_registry_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
      [
        c.title,
        c.description,
        c.event_date,
        c.venue_name,
        c.address,
        c.city,
        c.county,
        c.state || "AR",
        c.category,
        c.civic_value,
        c.political_opportunity_score,
        c.confidence_score,
        c.source_name,
        c.source_url,
        c.source_type,
        c.discovered_by,
        c.raw_text,
        c.review_status || "needs_review",
        c.notes,
        c.is_recurring_annual ?? false,
        c.intelligence_layer ?? null,
        c.relationship_density_score ?? null,
        c.typical_attendance_band ?? null,
        c.tradition_started_year ?? null,
        c.recurring_registry_id ?? null,
      ],
    );
    inserted += 1;
  }

  await client.end();
  console.log(`[import:candidates] inserted ${inserted} candidates`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
