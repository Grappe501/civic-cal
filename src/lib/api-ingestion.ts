import type { IngestionCandidate, IntelligenceSection } from "./intelligence/types";
import flagshipBundle from "../../data/ingestion/flagship-recurring-events.json";
import stagedBundle from "../../data/ingestion/staged-event-candidates.json";

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
  };
}

function localCandidates(): IngestionCandidate[] {
  const staged = (stagedBundle as { candidates?: Record<string, unknown>[] }).candidates ?? [];
  if (staged.length) return staged.map(mapRawCandidate);
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
      return list.filter((c) => c.category === "civic_meeting");
    case "church_fundraisers":
      return list.filter((c) => c.category === "faith_meal");
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
  action: "approve_to_events" | "reject" | "mark_duplicate" | "mark_recurring",
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
