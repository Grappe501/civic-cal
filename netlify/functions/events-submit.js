const { getClient, json } = require("./lib/db");
const { geocodeAddress } = require("./lib/geocode");

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

  let mapFields = {
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    place_id: body.placeId ?? null,
    formatted_address: body.formattedAddress ?? null,
    location_confidence: body.locationConfidence ?? null,
    map_status: body.mapStatus ?? "pending",
    geocoded_at: null,
    is_online_only: body.isOnlineOnly ?? false,
    state: body.state || "AR",
  };

  if (body.isOnlineOnly) {
    mapFields.map_status = "online";
  } else if (!mapFields.latitude && (body.address || body.locationName || body.city)) {
    const geo = await geocodeAddress({
      address: body.address,
      locationName: body.locationName,
      city: body.city,
      county: body.county,
      state: body.state || "AR",
    });
    if (geo.ok) {
      mapFields = {
        latitude: geo.latitude,
        longitude: geo.longitude,
        place_id: geo.placeId,
        formatted_address: geo.formattedAddress,
        location_confidence: geo.locationConfidence,
        map_status: geo.mapStatus,
        geocoded_at: new Date().toISOString(),
        is_online_only: false,
        state: body.state || "AR",
      };
    } else if (!geo.disabled) {
      mapFields.map_status = "manual_review";
    }
  } else if (mapFields.latitude) {
    mapFields.geocoded_at = new Date().toISOString();
    mapFields.map_status = body.mapStatus || "geocoded";
  }

  try {
    await client.connect();
    const res = await client.query(
      `INSERT INTO civic_call.events (
        slug, title, description, start_at, end_at, all_day, timezone,
        city, county, state, address, location_name, category, host_organization,
        contact_name, contact_email, website_url, is_recurring,
        is_public_government_meeting, candidate_relevant, is_family_friendly,
        is_free, status, source, submitter_name,
        latitude, longitude, place_id, formatted_address, location_confidence,
        map_status, geocoded_at, is_online_only
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
        'pending','public_submission',$23,$24,$25,$26,$27,$28,$29,$30,$31
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
        mapFields.state,
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
        mapFields.latitude,
        mapFields.longitude,
        mapFields.place_id,
        mapFields.formatted_address,
        mapFields.location_confidence,
        mapFields.map_status,
        mapFields.geocoded_at,
        mapFields.is_online_only,
      ],
    );
    await client.end();
    const row = res.rows[0];
    return json(201, {
      ok: true,
      message: "Thanks — your event is under review.",
      eventId: row.id,
      slug: row.slug,
      mapStatus: row.map_status,
    });
  } catch (err) {
    try {
      await client.end();
    } catch (_) {}
    console.error(err);
    return json(500, { error: "Submission failed" });
  }
};
