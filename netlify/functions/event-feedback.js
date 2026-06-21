const { getClient, json } = require("./lib/db");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  }
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const { eventId, eventSlug } = body;
  if (!eventId && !eventSlug) return json(400, { error: "Missing eventId or eventSlug" });

  const client = getClient();
  if (!client) {
    return json(503, {
      error: "Database not configured",
      message: "Feedback received in demo mode — configure DATABASE_URL.",
    });
  }

  try {
    await client.connect();

    let resolvedEventId = eventId;
    if (eventSlug) {
      const bySlug = await client.query(`SELECT id FROM civic_call.events WHERE slug = $1 LIMIT 1`, [eventSlug]);
      if (bySlug.rows.length) resolvedEventId = bySlug.rows[0].id;
    }

    if (!resolvedEventId || !UUID_RE.test(resolvedEventId)) {
      await client.end();
      return json(400, { error: "Event not found in database — feedback available for published DB events only" });
    }

    const exists = await client.query(`SELECT id FROM civic_call.events WHERE id = $1`, [resolvedEventId]);
    if (!exists.rows.length) {
      await client.end();
      return json(404, { error: "Event not found" });
    }

    const res = await client.query(
      `INSERT INTO civic_call.event_feedback (
        event_id, submitter_name, submitter_email, submitter_city, submitter_county,
        crowd_size_estimate, tradition_years, local_notes,
        is_good_for_candidates, why_it_matters, correction_notes,
        trust_signal, review_status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'new','needs_review')
      RETURNING id, created_at`,
      [
        resolvedEventId,
        body.submitterName || null,
        body.submitterEmail || null,
        body.submitterCity || null,
        body.submitterCounty || null,
        body.crowdSizeEstimate ?? null,
        body.traditionYears ?? null,
        body.localNotes || body.attendedBefore ? body.localNotes || "Attended before" : null,
        body.isGoodForCandidates ?? null,
        body.whyItMatters || null,
        body.correctionNotes || null,
      ],
    );

    await client.end();
    return json(201, {
      ok: true,
      message: "Thanks — your local knowledge helps verify what matters.",
      feedbackId: res.rows[0].id,
    });
  } catch (err) {
    try {
      await client.end();
    } catch (_) {}
    console.error(err);
    return json(500, { error: "Feedback submission failed" });
  }
};
