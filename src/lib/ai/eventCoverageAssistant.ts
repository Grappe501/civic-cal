import type { GeoLaneCoverage } from "../event-lanes/laneTypes";
import type { IngestionCandidate } from "../intelligence/types";
import type { AdminBatchSummary, LaneGapSuggestion } from "./eventCoverageTypes";
import { extractRecurrenceFromText } from "./recurrenceExtractor";
import { verifyCandidateSource } from "./sourceVerifier";

export function suggestLaneGaps(countyCoverage: GeoLaneCoverage): LaneGapSuggestion {
  const thin = countyCoverage.lanes.filter((l) => l.coveragePercent < 40).map((l) => l.shortName);
  const searches: string[] = [];

  if (thin.includes("Government")) searches.push(`${countyCoverage.county} County Arkansas city council calendar`);
  if (thin.includes("Schools")) searches.push(`${countyCoverage.county} County Arkansas school district calendar`);
  if (thin.includes("Churches")) searches.push(`${countyCoverage.county} County Arkansas church fish fry events`);
  if (thin.includes("Extension")) searches.push(`UAEX ${countyCoverage.county} County extension calendar`);
  if (thin.includes("VFD")) searches.push(`${countyCoverage.county} County volunteer fire department fundraiser`);

  return {
    thinLanes: thin,
    recommendedSearches: searches.slice(0, 6),
    notes: ["AI advisory only — verify sources before staging events.", "No events invented."],
  };
}

export function summarizeAdminBatch(candidates: IngestionCandidate[]): AdminBatchSummary {
  const readyToApprove: string[] = [];
  const needsReview: string[] = [];
  const possibleDuplicates: string[] = [];
  const highConfidenceRecurring: string[] = [];

  for (const c of candidates) {
    const v = verifyCandidateSource(c);
    if (c.reviewStatus === "duplicate" || (c.notes || "").toLowerCase().includes("duplicate")) {
      possibleDuplicates.push(c.title);
    } else if (v.supported && c.eventDate && (c.confidenceScore ?? 0) >= 70) {
      readyToApprove.push(c.title);
    } else if ((c as { is_recurring_series?: boolean }).is_recurring_series || c.isRecurringAnnual) {
      if ((c.confidenceScore ?? 0) >= 65) highConfidenceRecurring.push(c.title);
      else needsReview.push(c.title);
    } else {
      needsReview.push(c.title);
    }
  }

  return { readyToApprove, needsReview, possibleDuplicates, highConfidenceRecurring };
}

export function extractRecurrence(rawText: string) {
  return extractRecurrenceFromText(rawText);
}

export function verifySource(candidate: IngestionCandidate, excerpt?: string) {
  return verifyCandidateSource(candidate, excerpt);
}

export const eventCoverageAssistant = {
  suggestLaneGaps,
  summarizeAdminBatch,
  extractRecurrence,
  verifySource,
};
