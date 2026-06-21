const { getClient, json } = require("./lib/db");

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*" } };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const required = ["title", "startAt", "county", "category"];
  for (const key of required) {
    if (!body[key]) return json(400, { error: `Missing ${key}` });
  }

  const slug = slugify(`${body.title}-${body.startAt}-${body.county}`);
  const client = getClient();
  if (!client) {
    return json(503, {
      error: "Database not configured",
      message: "Submission received in demo mode — configure DATABASE_URL on Netlify.",
      preview: { slug, ...body, status: "pending" },
    });
  }

  try {
    await client.connect();
    const res = await client.query(
      `INSERT INTO civic_call.events (
        slug, title, description, start_at, end_at, all_day, timezone,
        city, county, address, location_name, category, host_organization,
        contact_name, contact_email, website_url, is_recurring,
        is_public_government_meeting, candidate_relevant, is_family_friendly,
        is_free, status, source, submitter_name
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,'pending','public_submission',$22
      )
      ON CONFLICT (slug) DO UPDATE SET updated_at = now()
      RETURNING *`,
      [
        slug,
        body.title,
        body.description || null,
        body.startAt,
        body.endAt || null,
        body.allDay ?? false,
        body.timezone || "America/Chicago",
        body.city || null,
        body.county,
        body.address || null,
        body.locationName || body.location || null,
        body.category,
        body.hostOrganization || null,
        body.contactName || null,
        body.contactEmail || null,
        body.websiteUrl || null,
        body.isRecurring ?? false,
        body.isPublicGovernmentMeeting ?? false,
        body.candidateRelevant ?? false,
        body.isFamilyFriendly ?? true,
        body.isFree ?? true,
        body.submitterName || body.contactName || null,
      ],
    );
    await client.end();
    const row = res.rows[0];
    return json(201, {
      ok: true,
      message: "Thanks — your event is under review.",
      eventId: row.id,
      slug: row.slug,
    });
  } catch (err) {
    try {
      await client.end();
    } catch (_) {}
    console.error(err);
    return json(500, { error: "Submission failed" });
  }
};
