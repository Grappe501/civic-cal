/**
 * Normalize raw search hits or flagship records into staged candidate shape.
 */
export function normalizeFromSearchHit(hit, ctx = {}) {
  const text = `${hit.title} ${hit.snippet || ""}`;
  const category = inferCategory(text);
  return {
    title: hit.title?.slice(0, 500) || "Untitled discovery",
    description: hit.snippet || null,
    event_date: extractDate(text),
    start_time: null,
    end_time: null,
    venue_name: null,
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
    is_recurring_annual: /annual|yearly|tradition/i.test(text),
  };
}

export function normalizeFromFlagship(record) {
  return {
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
    category: record.category || "community",
    civic_value: record.civic_value || "high",
    political_opportunity_score: record.political_opportunity_score ?? 70,
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
  };
}

function inferCategory(text) {
  const t = text.toLowerCase();
  if (/city council|quorum court|planning commission|public hearing/.test(t)) return "civic_meeting";
  if (/school board/.test(t)) return "school";
  if (/spaghetti|fish fry|bbq|brisket|church dinner|picnic/.test(t)) return "faith_meal";
  if (/festival|fair|parade/.test(t)) return "community";
  if (/football|basketball|rivalry|game/.test(t)) return "school";
  if (/forum|town hall|candidate/.test(t)) return "candidate_event";
  if (/library/.test(t)) return "culture";
  if (/chamber|breakfast/.test(t)) return "small_business";
  if (/volunteer|cleanup|food bank/.test(t)) return "volunteer";
  return "community";
}

function inferCivicValue(category, text) {
  if (category === "civic_meeting") return "very_high";
  if (/spaghetti|catholic point|thousands/.test(text.toLowerCase())) return "very_high";
  if (category === "faith_meal") return "high";
  return "medium";
}

function scoreFromText(text, category) {
  let score = 50;
  const t = text.toLowerCase();
  if (category === "civic_meeting") score += 35;
  if (/annual|tradition|thousands/.test(t)) score += 20;
  if (/spaghetti|catholic point|center ridge/.test(t)) score += 40;
  if (/bbq|brisket/.test(t)) score += 15;
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
