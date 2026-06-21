#!/usr/bin/env node
/**
 * Import seed-events.json into civic_call.events (requires DATABASE_URL).
 */
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const seedPath = path.join(__dirname, "..", "data", "seed-events.json");
const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "001_civic_calendar.sql");

async function main() {
  const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!url) {
    console.error("[seed:import] DATABASE_URL required");
    process.exit(1);
  }
  if (!fs.existsSync(seedPath)) {
    console.error("[seed:import] Run npm run seed:sync first");
    process.exit(1);
  }

  const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();

  if (fs.existsSync(migrationPath)) {
    await client.query(fs.readFileSync(migrationPath, "utf8"));
  }

  let inserted = 0;
  let skipped = 0;

  for (const ev of seed.events) {
    const res = await client.query(
      `INSERT INTO civic_call.events (
        slug, title, description, start_at, end_at, all_day, timezone,
        city, county, address, location_name, category, host_organization,
        is_public_government_meeting, candidate_relevant, is_family_friendly,
        is_free, high_civic_value, featured, status, source, source_ref
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
      )
      ON CONFLICT (slug) DO NOTHING`,
      [
        ev.slug,
        ev.title,
        ev.description,
        ev.startAt,
        ev.endAt,
        ev.allDay ?? false,
        ev.timezone ?? "America/Chicago",
        ev.city,
        ev.county,
        ev.address,
        ev.locationName,
        ev.category,
        ev.hostOrganization,
        ev.isPublicGovernmentMeeting ?? false,
        ev.candidateRelevant ?? false,
        ev.isFamilyFriendly ?? true,
        ev.isFree ?? true,
        ev.highCivicValue ?? false,
        ev.featured ?? false,
        ev.status ?? "approved",
        ev.source ?? "seed",
        ev.sourceRef,
      ],
    );
    if (res.rowCount) inserted += 1;
    else skipped += 1;
  }

  await client.end();
  console.log(`[seed:import] inserted=${inserted} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
