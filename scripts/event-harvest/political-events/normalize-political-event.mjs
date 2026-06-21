/**
 * Pass 30 — Normalize historic political event harvest records.
 */
import { enrichCandidate } from "../lib/layer-inference.mjs";

export const HARVEST_BATCH = "historic_political_events_pass30";

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

function pickVerifiedDate(entry) {
  const verified = (entry.verified_dates ?? []).find((d) => d.year === 2026 && d.start);
  if (verified) return verified;
  const any = (entry.verified_dates ?? []).find((d) => d.start);
  return any ?? null;
}

export function normalizePoliticalEvent(entry, rawMeta = {}) {
  const verified = pickVerifiedDate(entry);
  const hasDate = Boolean(verified?.start);
  const confidence = entry.confidence_score ?? (hasDate ? 80 : 40);

  const descriptionParts = [];
  if (entry.historic_significance) descriptionParts.push(entry.historic_significance);
  if (entry.typical_audience) descriptionParts.push(`Typical audience: ${entry.typical_audience}.`);
  descriptionParts.push("Neutral civic-political calendar entry — confirm details at official source.");

  return enrichCandidate({
    id: entry.id || slugify(entry.title),
    title: entry.title,
    description: descriptionParts.join(" "),
    event_date: verified?.start ?? null,
    end_date: verified?.end || verified?.start || null,
    venue_name: entry.venue,
    address: entry.address,
    city: entry.city,
    county: entry.county,
    state: "AR",
    category: entry.event_type === "candidate_forum" ? "candidate_event" : "candidate_event",
    harvest_category: entry.event_type,
    intelligence_layer: "relationship",
    civic_value: "high",
    political_opportunity_score: 88,
    relationship_density_score: 92,
    typical_attendance_band: entry.expected_attendance_min >= 300 ? "large" : "medium",
    confidence_score: confidence,
    source_name: entry.host_organization,
    source_url: verified?.source_url || entry.source_url,
    official_url: entry.official_url || entry.source_url,
    ticket_url: entry.ticket_url,
    sponsor_url: entry.sponsor_url ?? null,
    source_type: entry.source_type,
    discovered_by: "historic_political_harvest",
    review_status: entry.verification_status === "verified_dated" ? "needs_review" : "needs_verification",
    is_recurring_annual: Boolean(entry.recurring_pattern),
    harvest_batch: HARVEST_BATCH,
    source_confidence: entry.source_confidence,
    verification_status: entry.verification_status,
    political_event_id: entry.id,
    political_context: entry.political_context,
    history_available: Boolean(entry.history_available),
    first_year_held: entry.first_year_held ?? null,
    honors: entry.honors ?? null,
    expected_attendance_min: entry.expected_attendance_min ?? null,
    expected_attendance_max: entry.expected_attendance_max ?? null,
    notable_speakers: entry.notable_speakers ?? [],
    recurring_pattern: entry.recurring_pattern ?? null,
    ...rawMeta,
  });
}

export function normalizeResearchTask(entry, query) {
  return {
    id: `research-${entry.id}`,
    political_event_id: entry.id,
    title: entry.title,
    county: entry.county ?? null,
    city: entry.city ?? null,
    entity: entry.title,
    task_type: entry.verification_status === "research_task" ? "discover_event" : "confirm_event_date",
    reason: entry.notes || `Historic political event needs official source confirmation: ${entry.title}`,
    suggested_query: query || `${entry.title} Arkansas 2026 date official`,
    priority: entry.source_url ? "medium" : "high",
    status: "open",
    source_url: entry.source_url ?? null,
    approval_status: "needs_human_review",
    created_at: new Date().toISOString(),
  };
}

export function normalizeAll(entries, searchQueries = []) {
  const candidates = [];
  const dated_events = [];
  const research = [];

  for (const entry of entries) {
    const norm = normalizePoliticalEvent(entry);
    if (norm.event_date) dated_events.push(norm);
    else candidates.push(norm);

    if (
      entry.verification_status === "needs_date_confirmation" ||
      entry.verification_status === "research_task" ||
      !norm.event_date
    ) {
      const q = searchQueries.find((s) => s.toLowerCase().includes(entry.title.split(" ")[0].toLowerCase()));
      research.push(normalizeResearchTask(entry, q));
    }
  }

  return { candidates, dated_events, research };
}
