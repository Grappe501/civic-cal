const fs = require("node:fs");
const path = require("node:path");
const { getClient, json } = require("./lib/db");

const STAGED_PATH = path.join(__dirname, "..", "..", "data", "ingestion", "staged-event-candidates.json");
const STAGED_TOP200_PATH = path.join(__dirname, "..", "..", "data", "ingestion", "staged-event-candidates-top-200.json");

function mapStagedRecord(c, i) {
  return {
    id: c.id || `staged-${i}`,
    title: c.title,
    description: c.description,
    eventDate: c.event_date,
    startTime: c.start_time,
    endTime: c.end_time,
    venueName: c.venue_name,
    address: c.address,
    city: c.city,
    county: c.county,
    state: c.state || "AR",
    latitude: c.latitude,
    longitude: c.longitude,
    category: c.category,
    civicValue: c.civic_value,
    politicalOpportunityScore: c.political_opportunity_score,
    relationshipDensityScore: c.relationship_density_score,
    intelligenceLayer: c.intelligence_layer,
    typicalAttendanceBand: c.typical_attendance_band,
    recurringRegistryId: c.recurring_registry_id,
    confidenceScore: c.confidence_score,
    sourceName: c.source_name,
    sourceUrl: c.source_url,
    sourceType: c.source_type,
    discoveredBy: c.discovered_by,
    rawText: c.raw_text,
    reviewStatus: c.review_status || "needs_review",
    duplicateOfEventId: c.duplicate_of_event_id,
    notes: c.notes,
    isRecurringAnnual: c.is_recurring_annual,
    flagshipId: c.flagship_id,
    harvestBatch: c.harvest_batch,
    harvestWindow: c.harvest_window,
  };
}

function loadStagedFallback() {
  const lists = [];
  for (const p of [STAGED_TOP200_PATH, STAGED_PATH]) {
    if (!fs.existsSync(p)) continue;
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    lists.push(...(data.candidates ?? []));
  }
  return lists.map(mapStagedRecord);
}

function rowToCandidate(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    eventDate: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time,
    venueName: row.venue_name,
    address: row.address,
    city: row.city,
    county: row.county,
    state: row.state,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    category: row.category,
    civicValue: row.civic_value,
    politicalOpportunityScore: row.political_opportunity_score,
    relationshipDensityScore: row.relationship_density_score,
    intelligenceLayer: row.intelligence_layer,
    typicalAttendanceBand: row.typical_attendance_band,
    recurringRegistryId: row.recurring_registry_id,
    confidenceScore: row.confidence_score,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    sourceType: row.source_type,
    discoveredBy: row.discovered_by,
    rawText: row.raw_text,
    reviewStatus: row.review_status,
    duplicateOfEventId: row.duplicate_of_event_id,
    notes: row.notes,
    isRecurringAnnual: row.is_recurring_annual,
    harvestBatch: row.harvest_batch,
    harvestWindow: row.harvest_window,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function filterSection(candidates, section) {
  switch (section) {
    case "needs_review":
      return candidates.filter((c) => c.reviewStatus === "needs_review");
    case "high_civic_value":
      return candidates.filter((c) => (c.politicalOpportunityScore ?? 0) >= 80);
    case "missing_date":
      return candidates.filter((c) => !c.eventDate);
    case "missing_location":
      return candidates.filter((c) => !c.city && !c.county && !c.venueName);
    case "possible_duplicates":
      return candidates.filter((c) => c.reviewStatus === "duplicate" || (c.notes || "").includes("duplicate"));
    case "flagship_annual":
      return candidates.filter((c) => c.isRecurringAnnual || c.reviewStatus === "verified_flagship");
    case "government_meetings":
      return candidates.filter((c) => c.category === "civic_meeting");
    case "church_fundraisers":
      return candidates.filter(
        (c) =>
          c.intelligenceLayer === "community_church" ||
          c.category === "community_church" ||
          c.category === "faith_meal",
      );
    case "layer_community_identity":
      return candidates.filter((c) => c.intelligenceLayer === "community_identity");
    case "layer_school":
      return candidates.filter((c) => c.intelligenceLayer === "school_ecosystem");
    case "layer_relationship":
      return candidates.filter((c) => c.intelligenceLayer === "relationship");
    case "hidden_gold":
      return candidates.filter((c) =>
        ["extension", "farm_bureau", "ffa_4h", "vfd", "library", "community_college"].includes(c.sourceType),
      );
    default:
      return candidates;
  }
}

function checkAdmin(event) {
  const token = process.env.CIVIC_CALL_ADMIN_TOKEN;
  if (!token) return false;
  const auth = event.headers.authorization || event.headers.Authorization || "";
  return auth === `Bearer ${token}`;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 80);
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  }

  const params = event.queryStringParameters || {};
  const section = params.section || "newly_discovered";
  const isAdmin = checkAdmin(event);

  if (event.httpMethod === "GET") {
    const client = getClient();
    if (!client) {
      const staged = filterSection(loadStagedFallback(), section);
      return json(200, { candidates: staged, source: "staged_json" });
    }

    try {
      await client.connect();
      let query = `SELECT * FROM civic_call.event_ingestion_candidates WHERE review_status NOT IN ('approved', 'rejected') ORDER BY political_opportunity_score DESC NULLS LAST LIMIT 200`;
      if (section === "needs_review") {
        query = `SELECT * FROM civic_call.event_ingestion_candidates WHERE review_status = 'needs_review' ORDER BY created_at DESC LIMIT 200`;
      }
      const res = await client.query(query);
      await client.end();
      let list = res.rows.map(rowToCandidate);
      if (section !== "newly_discovered") list = filterSection(list, section);
      return json(200, { candidates: list, source: "database" });
    } catch (err) {
      try {
        await client.end();
      } catch (_) {}
      const staged = filterSection(loadStagedFallback(), section);
      return json(200, { candidates: staged, source: "staged_fallback", error: err.message });
    }
  }

  if (!isAdmin) return json(401, { error: "Unauthorized" });

  const client = getClient();
  if (!client) return json(503, { error: "DATABASE_URL not configured" });

  try {
    await client.connect();

    if (event.httpMethod === "PATCH") {
      const body = JSON.parse(event.body || "{}");
      const { id, action, ...updates } = body;
      if (!id) return json(400, { error: "Missing id" });

      if (action === "reject") {
        await client.query(
          `UPDATE civic_call.event_ingestion_candidates SET review_status = 'rejected', updated_at = now(), notes = COALESCE($2, notes) WHERE id = $1`,
          [id, updates.notes],
        );
      } else if (action === "mark_duplicate") {
        await client.query(
          `UPDATE civic_call.event_ingestion_candidates SET review_status = 'duplicate', duplicate_of_event_id = $2, updated_at = now() WHERE id = $1`,
          [id, updates.duplicateOfEventId || null],
        );
      } else if (action === "mark_recurring") {
        await client.query(
          `UPDATE civic_call.event_ingestion_candidates SET is_recurring_annual = true, updated_at = now() WHERE id = $1`,
          [id],
        );
      } else if (action === "approve_to_events") {
        const cRes = await client.query(`SELECT * FROM civic_call.event_ingestion_candidates WHERE id = $1`, [id]);
        if (!cRes.rows.length) {
          await client.end();
          return json(404, { error: "Not found" });
        }
        const c = cRes.rows[0];
        const startAt = c.event_date
          ? new Date(`${c.event_date}T${c.start_time || "12:00"}:00`).toISOString()
          : new Date().toISOString();
        const slug = slugify(`${c.title}-${c.event_date || "tbd"}-${c.county || "ar"}`);
        await client.query(
          `INSERT INTO civic_call.events (
            slug, title, description, start_at, city, county, state, address, location_name,
            category, status, source, latitude, longitude, formatted_address, map_status,
            high_civic_value, candidate_relevant, is_recurring,
            intelligence_layer, relationship_density_score, recurring_registry_id
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'approved','import',$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
          ON CONFLICT (slug) DO NOTHING`,
          [
            slug,
            c.title,
            c.description,
            startAt,
            c.city,
            c.county || "Unknown",
            c.state || "AR",
            c.address,
            c.venue_name,
            c.category || "community",
            c.latitude,
            c.longitude,
            c.address,
            c.latitude ? "geocoded" : "pending",
            (c.political_opportunity_score ?? 0) >= 80,
            (c.political_opportunity_score ?? 0) >= 70,
            c.is_recurring_annual,
            c.intelligence_layer,
            c.relationship_density_score,
            c.recurring_registry_id,
          ],
        );
        await client.query(
          `UPDATE civic_call.event_ingestion_candidates SET review_status = 'approved', updated_at = now() WHERE id = $1`,
          [id],
        );
      } else {
        await client.end();
        return json(400, { error: "Unknown action" });
      }

      const res = await client.query(`SELECT * FROM civic_call.event_ingestion_candidates WHERE id = $1`, [id]);
      await client.end();
      return json(200, { candidate: rowToCandidate(res.rows[0]) });
    }

    await client.end();
    return json(405, { error: "Method not allowed" });
  } catch (err) {
    try {
      await client.end();
    } catch (_) {}
    return json(500, { error: err.message });
  }
};
