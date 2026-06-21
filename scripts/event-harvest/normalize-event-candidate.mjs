/**
 * Normalize raw search hits or flagship/registry records into staged candidate shape.
 */
import { enrichCandidate, inferCategory } from "./lib/layer-inference.mjs";
import { getHarvestWindow } from "./lib/harvest-window.mjs";

export function normalizeFromSearchHit(hit, ctx = {}) {
  const text = `${hit.title} ${hit.snippet || ""}`;
  const category = inferCategory(text);
  const window = ctx.harvest_window || getHarvestWindow();
  const enriched = enrichCandidate({
    title: hit.title?.slice(0, 500) || "Untitled discovery",
    description: hit.snippet || null,
    event_date: extractDate(text),
    start_time: extractTime(text, "start"),
    end_time: extractTime(text, "end"),
    venue_name: extractVenue(text),
    address: null,
    city: ctx.city || null,
    county: ctx.county || null,
    state: "AR",
    latitude: null,
    longitude: null,
    category,
    civic_value: inferCivicValue(category, text),
    political_opportunity_score: scoreFromText(text, category),
    confidence_score: 40,
    source_name: ctx.source_name || hit.provider || "web_search",
    source_url: hit.url || null,
    source_type: ctx.source_type || "event_platform",
    discovered_by: ctx.discovered_by || "search_harvest",
    raw_text: text,
    review_status: "needs_review",
    duplicate_of_event_id: null,
    notes: "Auto-staged from public search — requires human verification.",
    is_recurring_annual: /annual|yearly|tradition|recurring/i.test(text),
    harvest_batch: ctx.harvest_batch || null,
    harvest_window: { start: window.start, end: window.end },
  });
  return enriched;
}

export function normalizeFromFlagship(record) {
  return enrichCandidate({
    title: record.title,
    description: record.notes || null,
    event_date: record.recurrence?.last_verified_occurrence || null,
    start_time: null,
    end_time: null,
    venue_name: record.venue_name || null,
    address: record.address || null,
    city: record.city || null,
    county: record.county || null,
    state: record.state || "AR",
    latitude: null,
    longitude: null,
    category: record.category || "community_church",
    intelligence_layer: record.intelligence_layer || "community_church",
    civic_value: record.civic_value || "high",
    political_opportunity_score: record.political_opportunity_score ?? 70,
    relationship_density_score: record.relationship_density ?? null,
    typical_attendance_band: record.typical_attendance_band || record.recurrence?.typical_attendance_band || null,
    tradition_started_year: record.recurrence?.tradition_started || null,
    recurring_registry_id: record.recurring_registry_id || record.id,
    confidence_score: record.confidence_score ?? 50,
    source_name: record.source_name,
    source_url: record.source_url,
    source_type: record.source_type,
    discovered_by: record.discovered_by || "flagship_registry",
    raw_text: record.raw_text || record.notes,
    review_status: record.review_status || "needs_review",
    duplicate_of_event_id: null,
    notes: record.notes,
    is_recurring_annual: Boolean(record.recurrence?.pattern === "annual"),
    flagship_id: record.id,
  });
}

export function normalizeFromRegistry(tradition) {
  return enrichCandidate({
    title: tradition.event_name,
    description: tradition.notes || null,
    event_date: null,
    venue_name: tradition.venue_name || null,
    city: tradition.city || null,
    county: tradition.county || null,
    state: tradition.state || "AR",
    category: tradition.category || "community",
    intelligence_layer: tradition.intelligence_layer,
    civic_value: tradition.community_value >= 90 ? "very_high" : "high",
    political_opportunity_score: tradition.political_value,
    relationship_density_score: tradition.relationship_density,
    typical_attendance_band: tradition.typical_attendance_band,
    tradition_started_year: tradition.first_year_held,
    recurring_registry_id: tradition.id,
    confidence_score: tradition.review_status === "needs_verification" ? 35 : 75,
    source_name: tradition.source_name || "recurring_events_registry",
    source_url: tradition.source_url || null,
    source_type: "manual_tip",
    discovered_by: "recurring_registry",
    raw_text: tradition.notes,
    review_status: tradition.review_status || "needs_review",
    notes: `${tradition.notes || ""} Typical month: ${tradition.typical_month || "confirm yearly"}.`.trim(),
    is_recurring_annual: true,
  });
}

function inferCivicValue(category, text) {
  if (category === "civic_meeting") return "very_high";
  if (/spaghetti|catholic point|thousands/.test(text.toLowerCase())) return "very_high";
  if (category === "community_church" || category === "faith_meal") return "high";
  return "medium";
}

function scoreFromText(text, category) {
  let score = 50;
  const t = text.toLowerCase();
  if (category === "civic_meeting") score += 35;
  if (category === "community_church") score += 30;
  if (/annual|tradition|thousands/.test(t)) score += 20;
  if (/spaghetti|catholic point|center ridge/.test(t)) score += 40;
  return Math.min(100, score);
}

function extractDate(text) {
  const m = text.match(/(\d{4}-\d{2}-\d{2})|((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})/i);
  if (!m) return null;
  if (m[1]) return m[1];
  try {
    return new Date(m[0]).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function extractTime(text, which) {
  const range = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (range) return which === "start" ? range[1].trim() : range[2].trim();
  const single = text.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  return which === "start" && single ? single[1].trim() : null;
}

function extractVenue(text) {
  const at = text.match(/\bat\s+([A-Z][A-Za-z0-9\s&'.-]{3,60})/);
  if (at) return at[1].trim();
  const venue = text.match(/(?:venue|location):\s*([^.,\n]{3,60})/i);
  return venue ? venue[1].trim() : null;
}
