/**
 * Normalize party meeting records into staged ingestion candidates.
 * Neutral scoring — no partisan weighting.
 */
import { parseRecurrenceRule, expandRecurrenceDates, parseTimeTo24 } from "./parse-recurring-meetings.mjs";

const HARVEST_END = "2027-12-31";
const HARVEST_START = "2026-06-20";

export function normalizePartyMeeting(raw) {
  const rule = parseRecurrenceRule(raw.recurrence_text || raw.meeting_info || "");
  const dates = rule.recurrence && !rule.ambiguous ? expandRecurrenceDates(rule, { start: HARVEST_START, end: HARVEST_END }) : [];

  const base = {
    title: raw.meeting_name || `${raw.county} County ${raw.party_label} Committee Meeting`,
    description: buildDescription(raw, rule),
    category: "public_party_meeting",
    meeting_subtype: raw.meeting_subtype || "county_party_committee",
    intelligence_layer: "government",
    civic_value: rule.confidence >= 70 ? "high" : "medium",
    political_opportunity_score: 50,
    relationship_density_score: 55,
    confidence_score: rule.confidence ?? raw.confidence_score ?? 40,
    source_name: raw.organization || `${raw.party_label} Party of Arkansas`,
    source_url: raw.source_url,
    source_type: "political_party_public_page",
    discovered_by: raw.discovered_by || "harvest:party-meetings",
    review_status: "needs_review",
    party_label: raw.party_label,
    county: raw.county,
    city: raw.city || null,
    venue_name: raw.venue || null,
    address: raw.address || null,
    contact_url: raw.contact_url || raw.source_url,
    verification_status: rule.ambiguous ? "needs_review" : "needs_verification",
    recurrence_rule: rule.rawRule || raw.recurrence_text || null,
    recurrence_parsed: rule,
    is_recurring_annual: false,
    is_recurring_series: Boolean(rule.recurrence && !rule.ambiguous),
    raw_text: raw.raw_excerpt || null,
    notes: buildNotes(raw, rule),
    start_time: parseTimeTo24(rule.time || raw.time),
    chair_public: raw.chair || null,
    series_key: seriesKey(raw),
    recurring_registry_id: seriesKey(raw),
  };

  if (dates.length > 0) {
    return dates.map((event_date, i) => ({
      ...base,
      id: `${raw.id || slug(raw.county + raw.party_label)}-${event_date}`,
      event_date,
      notes: `${base.notes} Projected occurrence ${i + 1}/${dates.length} from public recurrence rule — verify before approve.`,
    }));
  }

  return [
    {
      ...base,
      id: raw.id || slug(`${raw.county}-${raw.party_label}-meeting`),
      event_date: raw.next_date || null,
      notes: `${base.notes}${!raw.next_date && rule.ambiguous ? " Recurrence unclear — human must confirm next date." : ""}`,
    },
  ];
}

function buildDescription(raw, rule) {
  const parts = [
    `Public ${raw.party_label} county committee meeting in ${raw.county} County, Arkansas.`,
    raw.chair ? `County chair (public listing): ${raw.chair}.` : null,
    rule.rawRule ? `Recurrence (from official page): ${rule.rawRule}.` : null,
    raw.venue ? `Venue: ${raw.venue}.` : null,
    "Neutral civic calendar listing — not an endorsement.",
  ];
  return parts.filter(Boolean).join(" ");
}

function buildNotes(raw, rule) {
  return [
    "Public party meeting lane — admin approval required.",
    rule.ambiguous ? "Recurrence needs review." : null,
    raw.source_url ? `Source: ${raw.source_url}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function seriesKey(raw) {
  return `${slug(raw.county || "statewide")}-${slug(raw.party_label || "other")}`;
}

export function normalizeAll(records) {
  return records.flatMap((r) => normalizePartyMeeting(r));
}
