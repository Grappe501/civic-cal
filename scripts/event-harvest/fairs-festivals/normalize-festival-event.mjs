/**
 * Normalize raw fair/festival harvest records into staged candidate shape.
 */
import { enrichCandidate } from "../lib/layer-inference.mjs";

const HARVEST_BATCH = "fair_festival_harvest_pass29";

const CATEGORY_TO_EVENT = {
  festival: "community",
  county_fair: "community",
  food_festival: "food_truck_festival",
  music_festival: "culture",
  rodeo: "community",
  parade: "community",
  farmers_market: "community",
  arts_crafts: "culture",
  heritage_festival: "culture",
  fairground_event: "community",
};

export function mapHarvestCategory(category) {
  return CATEGORY_TO_EVENT[category] || "community";
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

export function normalizeFestivalRecord(raw, sourceMeta = {}) {
  const category = raw.category || sourceMeta.category || "festival";
  const eventCategory = mapHarvestCategory(category);
  const confidence =
    raw.source_confidence === "high"
      ? 85
      : raw.source_confidence === "medium"
        ? 65
        : raw.verification_status === "verified"
          ? 80
          : 45;

  const title = raw.title || sourceMeta.title;
  const eventDate = raw.date || raw.event_date || null;
  const endDate = raw.end_date || raw.endDate || eventDate;

  const enriched = enrichCandidate({
    id: raw.id || `fest-${slugify(`${title}-${eventDate}-${sourceMeta.id || "unknown"}`)}`,
    title,
    description: raw.description || sourceMeta.description || null,
    event_date: eventDate,
    end_date: endDate,
    start_time: null,
    end_time: null,
    venue_name: raw.venue || sourceMeta.venue || null,
    address: raw.address || sourceMeta.address || null,
    city: raw.city || sourceMeta.city || null,
    county: raw.county || sourceMeta.county || null,
    state: "AR",
    latitude: null,
    longitude: null,
    category: eventCategory,
    harvest_category: category,
    intelligence_layer: "community_identity",
    civic_value: "high",
    political_opportunity_score: category === "music_festival" ? 72 : 78,
    relationship_density_score: 70,
    typical_attendance_band: raw.expected_attendance || sourceMeta.expected_attendance || "large",
    confidence_score: confidence,
    source_name: sourceMeta.source_name || raw.source_name || title,
    source_url: raw.source_url || sourceMeta.source_url || sourceMeta.official_url || null,
    official_url: raw.official_url || sourceMeta.official_url || null,
    ticket_url: raw.ticket_url || sourceMeta.ticket_url || null,
    vendor_url: raw.vendor_url || sourceMeta.vendor_url || null,
    sponsor_url: raw.sponsor_url || sourceMeta.sponsor_url || null,
    source_type: sourceMeta.source_type || raw.source_type || "official_festival_website",
    discovered_by: "fair_festival_harvest",
    raw_text: raw.raw_excerpt || raw.raw_text || null,
    review_status: raw.verification_status === "verified" ? "needs_review" : "needs_review",
    duplicate_of_event_id: null,
    notes: raw.notes || null,
    is_recurring_annual: Boolean(raw.recurring_pattern || sourceMeta.recurring_pattern),
    harvest_batch: HARVEST_BATCH,
    food_available: raw.food_available ?? sourceMeta.food_available ?? null,
    family_friendly: raw.family_friendly ?? sourceMeta.family_friendly ?? true,
    source_confidence: raw.source_confidence || sourceMeta.source_confidence || "medium",
    verification_status: raw.verification_status || "needs_review",
    festival_source_id: sourceMeta.id || raw.festival_source_id || null,
  });

  return enriched;
}

export function normalizeAll(rawRecords, registryById) {
  const staged = [];
  for (const raw of rawRecords) {
    const meta = registryById.get(raw.festival_source_id) || {};
    if (!raw.title && !meta.title) continue;
    staged.push(
      normalizeFestivalRecord(
        { ...raw, title: raw.title || meta.title },
        meta,
      ),
    );
  }
  return staged;
}
