import type { IngestionCandidate, IntelligenceSection } from "./intelligence/types";
import type { IntelligenceLayer } from "./intelligence/eventLayers";
import flagshipBundle from "../../data/ingestion/flagship-recurring-events.json";
import stagedBundle from "../../data/ingestion/staged-event-candidates.json";
import stagedTop200Bundle from "../../data/ingestion/staged-event-candidates-top-200.json";
import partyStagedBundle from "../../data/ingestion/political-party-meetings-staged.json";
import schoolStagedBundle from "../../data/ingestion/school-events-staged.json";
import fairFestivalStagedBundle from "../../data/ingestion/fair-festival-staged.json";
import countyFairStagedBundle from "../../data/ingestion/county-fair-staged.json";
import autogrowStagedBundle from "../../data/ingestion/autogrow-staged-candidates.json";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

function mapRawCandidate(c: Record<string, unknown>, i: number): IngestionCandidate {
  return {
    id: String(c.flagship_id || c.id || `staged-${i}`),
    title: String(c.title),
    description: (c.description as string) || null,
    eventDate: (c.event_date as string) || (c.recurrence as { last_verified_occurrence?: string })?.last_verified_occurrence || null,
    venueName: (c.venue_name as string) || null,
    address: (c.address as string) || null,
    city: (c.city as string) || null,
    county: (c.county as string) || null,
    state: (c.state as string) || "AR",
    category: (c.category as string) || null,
    civicValue: (c.civic_value as string) || null,
    politicalOpportunityScore: (c.political_opportunity_score as number) ?? null,
    confidenceScore: (c.confidence_score as number) ?? null,
    sourceName: (c.source_name as string) || null,
    sourceUrl: (c.source_url as string) || null,
    sourceType: (c.source_type as string) || null,
    discoveredBy: (c.discovered_by as string) || null,
    rawText: (c.raw_text as string) || (c.notes as string) || null,
    reviewStatus: (c.review_status as string) || "needs_review",
    notes: (c.notes as string) || null,
    isRecurringAnnual: Boolean(c.is_recurring_annual || (c.recurrence as { pattern?: string })?.pattern === "annual"),
    flagshipId: (c.flagship_id as string) || (c.id as string),
    intelligenceLayer: c.intelligence_layer as IntelligenceLayer | undefined,
    relationshipDensityScore: (c.relationship_density_score as number) ?? null,
    typicalAttendanceBand: (c.typical_attendance_band as IngestionCandidate["typicalAttendanceBand"]) ?? null,
    recurringRegistryId: (c.recurring_registry_id as string) || null,
    harvestBatch: (c.harvest_batch as string) || null,
    harvestWindow: (c.harvest_window as { start: string; end: string }) || null,
    estimatedCrowdMin: (c.estimated_crowd_min as number) ?? null,
    estimatedCrowdMax: (c.estimated_crowd_max as number) ?? null,
    partyLabel: (c.party_label as string) || null,
    meetingSubtype: (c.meeting_subtype as string) || null,
    seriesKey: (c.series_key as string) || null,
    isRecurringSeries: Boolean(c.is_recurring_series),
  };
}

function localCandidates(): IngestionCandidate[] {
  const top200 = (stagedTop200Bundle as { candidates?: Record<string, unknown>[] }).candidates ?? [];
  const staged = (stagedBundle as { candidates?: Record<string, unknown>[] }).candidates ?? [];
  const party = (partyStagedBundle as { candidates?: Record<string, unknown>[] }).candidates ?? [];
  const school = (schoolStagedBundle as { candidates?: Record<string, unknown>[] }).candidates ?? [];
  const fairs = (fairFestivalStagedBundle as { candidates?: Record<string, unknown>[] }).candidates ?? [];
  const countyFairs = (countyFairStagedBundle as { candidates?: Record<string, unknown>[] }).candidates ?? [];
  const autogrow = (autogrowStagedBundle as { candidates?: Record<string, unknown>[] }).candidates ?? [];
  const merged = [...top200, ...staged, ...party, ...school, ...fairs, ...countyFairs, ...autogrow].filter(
    (c) => c.review_status !== "approved" && c.review_status !== "rejected",
  );
  if (merged.length) return merged.map(mapRawCandidate);
  const flagship = (flagshipBundle as { events?: Record<string, unknown>[] }).events ?? [];
  return flagship.map(mapRawCandidate);
}

function filterSection(list: IngestionCandidate[], section: IntelligenceSection): IngestionCandidate[] {
  switch (section) {
    case "needs_review":
      return list.filter((c) => c.reviewStatus === "needs_review" || c.reviewStatus === "needs_verification");
    case "high_civic_value":
      return list.filter((c) => (c.politicalOpportunityScore ?? 0) >= 80);
    case "missing_date":
      return list.filter((c) => !c.eventDate);
    case "missing_location":
      return list.filter((c) => !c.city && !c.county && !c.venueName);
    case "possible_duplicates":
      return list.filter((c) => c.reviewStatus === "duplicate" || (c.notes || "").includes("duplicate"));
    case "flagship_annual":
      return list.filter((c) => c.isRecurringAnnual || c.reviewStatus === "verified_flagship");
    case "government_meetings":
      return list.filter((c) => c.intelligenceLayer === "government" || c.category === "civic_meeting");
    case "public_party_meetings":
      return list.filter((c) => c.category === "public_party_meeting");
    case "school_events":
      return list.filter((c) => c.category === "school" || c.category === "school_athletics" || c.category === "school_board_meeting" || c.category === "school_graduation");
    case "church_fundraisers":
      return list.filter((c) => c.intelligenceLayer === "community_church" || c.category === "community_church" || c.category === "faith_meal");
    default:
      return list;
  }
}

export async function fetchIngestionCandidates(section: IntelligenceSection = "newly_discovered"): Promise<IngestionCandidate[]> {
  try {
    const res = await fetch(`${fnBase}/ingestion-candidates?section=${section}`);
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    return data.candidates ?? [];
  } catch {
    return filterSection(localCandidates(), section);
  }
}

export async function candidateAdminAction(
  token: string,
  id: string,
  action: "approve_to_events" | "reject" | "mark_duplicate" | "mark_recurring" | "approve_recurring_series",
  extra?: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${fnBase}/ingestion-candidates`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, action, ...extra }),
  });
  if (!res.ok) throw new Error("Candidate action failed");
}

export async function approveRecurringSeriesAction(token: string, seriesKey: string): Promise<{ ok: boolean; eventsPublished?: number }> {
  const res = await fetch(`${fnBase}/ingestion-candidates`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "approve_recurring_series", seriesKey }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Series approval failed");
  return data;
}
