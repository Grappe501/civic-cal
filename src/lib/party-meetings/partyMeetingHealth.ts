import partySummary from "../../../data/ingestion/political-party-meetings-summary.json";
import partyStaged from "../../../data/ingestion/political-party-meetings-staged.json";
import partyRegistry from "../../../data/event-harvest/political-party-source-registry.json";

export interface PartyMeetingHealth {
  sourcesFound: number;
  stagedMeetings: number;
  approvedMeetings: number;
  countiesWithData: number;
  recurrenceNeedsReview: number;
  partyCounts: Record<string, number>;
  avgRecurrenceConfidence: number;
}

export function runPartyMeetingHealth(): PartyMeetingHealth {
  const summary = partySummary as {
    stagedCandidates?: number;
    countiesWithData?: number;
    recurrenceNeedsReview?: number;
    partyCounts?: Record<string, number>;
  };
  const staged = (partyStaged as { candidates?: { confidence_score?: number }[] }).candidates ?? [];
  const avg =
    staged.length > 0
      ? Math.round(staged.reduce((s, c) => s + (c.confidence_score ?? 0), 0) / staged.length)
      : 0;

  return {
    sourcesFound: (partyRegistry as { sources?: unknown[] }).sources?.length ?? 0,
    stagedMeetings: summary.stagedCandidates ?? staged.length,
    approvedMeetings: 0,
    countiesWithData: summary.countiesWithData ?? 0,
    recurrenceNeedsReview: summary.recurrenceNeedsReview ?? 0,
    partyCounts: summary.partyCounts ?? {},
    avgRecurrenceConfidence: avg,
  };
}
