/**
 * Pass 30 — Normalize city festival harvest records to calendar events.
 */
import { enrichCandidate } from "../lib/layer-inference.mjs";

export const HARVEST_BATCH = "top250_city_festival_pass30";

export const FESTIVAL_SEARCH_PATTERNS = [
  (city) => `${city} Arkansas festival 2026`,
  (city) => `${city} AR summer festival`,
  (city) => `${city} Arkansas food truck festival`,
  (city) => `${city} Arkansas music festival`,
  (city) => `${city} Arkansas parade 2026`,
  (city) => `${city} Arkansas fall festival`,
  (city) => `${city} Arkansas spring festival`,
  (city) => `${city} Arkansas Christmas parade`,
  (city) => `${city} Arkansas farmers market`,
  (city) => `${city} Arkansas parks recreation events`,
  (city) => `${city} Arkansas city calendar`,
  (city) => `${city} Arkansas chamber events`,
];

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function buildCitySearchQueries(city) {
  return FESTIVAL_SEARCH_PATTERNS.map((fn) => fn(city));
}

export function normalizeCityFestivalCandidate(raw) {
  const hasDate = Boolean(raw.event_date);
  const confidence = raw.source_confidence === "high" ? 88 : raw.source_confidence === "medium" ? 72 : hasDate ? 65 : 35;

  return enrichCandidate({
    id: raw.id || slugify(`${raw.title}-${raw.city}-${raw.event_date}`),
    title: raw.title,
    description: raw.description || null,
    event_date: raw.event_date,
    end_date: raw.end_date || raw.event_date,
    venue_name: raw.venue,
    address: raw.address,
    city: raw.city,
    county: raw.county,
    state: "AR",
    category: raw.category || "community",
    harvest_category: raw.harvest_category || "festival",
    intelligence_layer: "community_identity",
    civic_value: "high",
    political_opportunity_score: 70,
    relationship_density_score: raw.relationship_density_score ?? 75,
    typical_attendance_band: raw.typical_attendance_band || "medium",
    confidence_score: confidence,
    source_name: raw.host_organization || raw.title,
    source_url: raw.source_url,
    official_url: raw.official_url || raw.source_url,
    source_type: raw.source_type || "city_official",
    discovered_by: "top250_city_festival_harvest",
    review_status: hasDate && raw.source_url ? "auto_approved" : "needs_review",
    is_recurring_annual: Boolean(raw.is_recurring_annual),
    harvest_batch: HARVEST_BATCH,
    verification_status: hasDate && raw.source_url ? "verified_dated" : "needs_review",
    start_time: raw.start_time ?? null,
    end_time: raw.end_time ?? null,
  });
}

export function candidateToPublicEvent(c, countyCentroids = {}) {
  let startAt = new Date().toISOString();
  if (c.event_date) {
    const time = c.start_time ? `${c.start_time}:00` : "15:00:00";
    const d = new Date(`${c.event_date}T${time}-05:00`);
    if (!Number.isNaN(d.getTime())) startAt = d.toISOString();
  }
  let endAt = null;
  if (c.end_date) {
    const time = c.end_time ? `${c.end_time}:00` : "23:00:00";
    const d = new Date(`${c.end_date}T${time}-05:00`);
    if (!Number.isNaN(d.getTime())) endAt = d.toISOString();
  }

  const county = c.county || "Unknown";
  const centroid = countyCentroids[county.toLowerCase()];
  const mapCategory = c.harvest_category || "festival";

  return {
    id: `top250-fest-${c.id}`,
    slug: slugify(`${c.title}-${c.event_date}-${c.city}-fest`),
    title: c.title,
    description:
      c.description ||
      `Source-backed ${c.city} community event in ${county} County. Confirm details at official source.`,
    startAt,
    endAt,
    allDay: !c.start_time,
    timezone: "America/Chicago",
    city: c.city,
    county,
    address: c.address ?? null,
    locationName: c.venue_name ?? null,
    category: c.category || "community",
    hostOrganization: c.source_name,
    status: "approved",
    source: c.source_url,
    websiteUrl: c.official_url || c.source_url,
    highCivicValue: true,
    candidateRelevant: false,
    isRecurring: Boolean(c.is_recurring_annual),
    intelligenceLayer: c.intelligence_layer || "community_identity",
    relationshipDensityScore: c.relationship_density_score ?? 75,
    isFamilyFriendly: true,
    harvestBatch: HARVEST_BATCH,
    festivalCategory: mapCategory,
    mapDiscoveryCategory: mapCategory,
    latitude: centroid?.lat ?? null,
    longitude: centroid?.lng ?? null,
    locationConfidence: centroid ? "low" : "unknown",
    mapStatus: centroid ? "manual_review" : "pending",
  };
}

export function isAutoPublishable(c) {
  return Boolean(
    c.title &&
      c.event_date &&
      c.city &&
      c.county &&
      c.source_url &&
      c.verification_status === "verified_dated",
  );
}
