const { Client } = require("pg");

function getClient() {
  const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!url) return null;
  return new Client({
    connectionString: url,
    ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
  });
}

function rowToEvent(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day,
    timezone: row.timezone,
    city: row.city,
    county: row.county,
    address: row.address,
    locationName: row.location_name,
    category: row.category,
    hostOrganization: row.host_organization,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    websiteUrl: row.website_url,
    imageUrl: row.image_url,
    isRecurring: row.is_recurring,
    isPublicGovernmentMeeting: row.is_public_government_meeting,
    candidateRelevant: row.candidate_relevant,
    isFamilyFriendly: row.is_family_friendly,
    isFree: row.is_free,
    highCivicValue: row.high_civic_value,
    featured: row.featured,
    status: row.status,
    source: row.source,
    submitterName: row.submitter_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    placeId: row.place_id,
    formattedAddress: row.formatted_address,
    locationConfidence: row.location_confidence,
    mapStatus: row.map_status,
    state: row.state,
    isOnlineOnly: row.is_online_only,
  };
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Content-Type": "application/json",
  };
}

function json(statusCode, body) {
  return { statusCode, headers: corsHeaders(), body: JSON.stringify(body) };
}

function parseFilters(params) {
  return {
    county: params.county || null,
    city: params.city || null,
    category: params.category || null,
    q: params.q || null,
    from: params.from || null,
    to: params.to || null,
    civicOnly: params.civicOnly === "true",
    familyFriendly: params.familyFriendly === "true",
    freeOnly: params.freeOnly === "true",
    candidateRelevant: params.candidateRelevant === "true",
    thisWeekend: params.thisWeekend === "true",
    featured: params.featured === "true",
    mapReview: params.mapReview === "true",
    status: params.status || "approved",
    limit: Math.min(parseInt(params.limit || "100", 10), 500),
    offset: parseInt(params.offset || "0", 10),
  };
}

function buildWhere(filters, forAdmin) {
  const clauses = [];
  const values = [];
  let i = 1;

  if (!forAdmin) {
    clauses.push(`status = $${i++}`);
    values.push("approved");
  } else if (filters.status) {
    clauses.push(`status = $${i++}`);
    values.push(filters.status);
  }

  if (filters.county) {
    clauses.push(`county ILIKE $${i++}`);
    values.push(filters.county);
  }
  if (filters.city) {
    clauses.push(`city ILIKE $${i++}`);
    values.push(`%${filters.city}%`);
  }
  if (filters.category) {
    clauses.push(`category = $${i++}`);
    values.push(filters.category);
  }
  if (filters.q) {
    clauses.push(`(title ILIKE $${i} OR description ILIKE $${i} OR location_name ILIKE $${i})`);
    values.push(`%${filters.q}%`);
    i += 1;
  }
  if (filters.from) {
    clauses.push(`start_at >= $${i++}`);
    values.push(filters.from);
  }
  if (filters.to) {
    clauses.push(`start_at <= $${i++}`);
    values.push(filters.to);
  }
  if (filters.civicOnly) {
    clauses.push(`(category = 'civic_meeting' OR is_public_government_meeting = true)`);
  }
  if (filters.familyFriendly) {
    clauses.push(`is_family_friendly = true`);
  }
  if (filters.freeOnly) {
    clauses.push(`is_free = true`);
  }
  if (filters.candidateRelevant) {
    clauses.push(`candidate_relevant = true`);
  }
  if (filters.featured) {
    clauses.push(`featured = true`);
  }
  if (filters.thisWeekend) {
    clauses.push(`start_at >= date_trunc('week', now()) + interval '5 days'`);
    clauses.push(`start_at < date_trunc('week', now()) + interval '7 days'`);
  }
  if (filters.mapReview) {
    clauses.push(`(latitude IS NULL OR map_status IN ('pending', 'manual_review'))`);
  }

  return { where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", values, nextIndex: i };
}

module.exports = { getClient, rowToEvent, json, corsHeaders, parseFilters, buildWhere };
