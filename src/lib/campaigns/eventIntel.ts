import type { CivicEvent } from "../types";
import { scoreEventIntelligence } from "../intelligence/eventOpportunityScore";
import { inferIntelligenceLayer } from "../intelligence/eventLayers";
import type { IntelligenceLayer } from "../intelligence/eventLayers";
import type { ScoredEvent } from "./types";

export function scoreEventForCampaign(event: CivicEvent): ScoredEvent {
  const layer =
    (event.intelligenceLayer as IntelligenceLayer | undefined) ??
    inferIntelligenceLayer(`${event.title} ${event.description ?? ""}`, event.category);
  const intel = scoreEventIntelligence({
    title: event.title,
    category: event.category,
    intelligenceLayer: layer,
    description: event.description ?? undefined,
    isPublicGovernmentMeeting: event.isPublicGovernmentMeeting,
    candidateRelevant: event.candidateRelevant,
  });

  const combined = intel.politicalOpportunityScore * 0.45 + intel.relationshipDensityScore * 0.55;
  let candidateUsefulness: ScoredEvent["candidateUsefulness"] = "low";
  if (combined >= 85) candidateUsefulness = "very_high";
  else if (combined >= 70) candidateUsefulness = "high";
  else if (combined >= 50) candidateUsefulness = "medium";

  return {
    event,
    layer,
    politicalOpportunityScore: intel.politicalOpportunityScore,
    relationshipDensityScore: intel.relationshipDensityScore,
    candidateUsefulness,
  };
}

export function traditionStrengthEstimate(event: CivicEvent): number | null {
  const text = `${event.title} ${event.description ?? ""}`.toLowerCase();
  if (/annual|\d+(st|nd|rd|th)/.test(text)) return 75;
  if (event.isRecurring) return 60;
  return null;
}

export function verificationLabel(event: CivicEvent): string {
  if (event.status === "approved") return "verified";
  if (event.source === "public_submission") return "needs_review";
  return "pending";
}
