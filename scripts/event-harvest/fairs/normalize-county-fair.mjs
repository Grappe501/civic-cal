/**
 * Normalize county fair harvest records into staged candidate shape.
 */
import { enrichCandidate } from "../lib/layer-inference.mjs";

const HARVEST_BATCH = "county_fair_lane_pass29";

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

export function normalizeCountyFair(raw) {
  const hasDate = Boolean(raw.date_start);
  const confidence =
    raw.source_confidence === "high" ? 85 : raw.source_confidence === "medium" ? 70 : hasDate ? 55 : 35;

  return enrichCandidate({
    id: raw.id || `county-fair-${slugify(`${raw.fair_name}-${raw.county}`)}`,
    title: raw.fair_name,
    description: raw.notes || null,
    event_date: raw.date_start,
    end_date: raw.date_end || raw.date_start,
    venue_name: raw.venue,
    address: raw.address,
    city: raw.city,
    county: raw.county,
    state: "AR",
    category: "community",
    harvest_category: "county_fair",
    intelligence_layer: "community_identity",
    civic_value: "high",
    political_opportunity_score: 75,
    relationship_density_score: 72,
    typical_attendance_band: "large",
    confidence_score: confidence,
    source_name: raw.fair_name,
    source_url: raw.source_url,
    official_url: raw.official_url,
    ticket_url: raw.ticket_url,
    vendor_url: raw.vendor_url,
    schedule_url: raw.schedule_url,
    source_type: raw.source_type || "county_fair_page",
    discovered_by: "county_fair_harvest",
    review_status: raw.verification_status === "verified_dated" ? "needs_review" : "needs_verification",
    is_recurring_annual: true,
    harvest_batch: HARVEST_BATCH,
    source_confidence: raw.source_confidence,
    verification_status: raw.verification_status,
    fair_lane_id: raw.id,
    is_regional_fair: Boolean(raw.is_regional_fair),
    is_state_fair: Boolean(raw.is_state_fair),
    admission_info: raw.admission_info,
    parking_info: raw.parking_info,
    facebook_url: raw.facebook_url,
    livestock_url: raw.livestock_url,
  });
}

export function normalizeResearchTask(raw) {
  return {
    id: `research-${raw.id}`,
    fair_id: raw.id,
    fair_name: raw.fair_name,
    county: raw.county,
    city: raw.city,
    task_type: "confirm_fair_dates",
    priority: raw.official_url ? "medium" : "high",
    status: "open",
    verification_status: raw.verification_status,
    suggested_urls: [raw.official_url, raw.cofairs_url].filter(Boolean),
    notes:
      raw.notes ||
      `No verified 2026 fair dates found for ${raw.county} County. Confirm annually from official fair, extension, or tourism pages.`,
    created_at: new Date().toISOString(),
  };
}
