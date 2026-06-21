/**
 * Candidate event priority — display layer over campaignPriorityScore.
 */
import type { CivicEvent } from "../types";
import type { CampaignWorkspace, CampaignEventPlan } from "../campaigns/types";
import type { CampaignGoalSettings } from "../campaigns/campaignGoalSettings";
import {
  scoreCampaignEventPriority,
  RECOMMENDATION_LABELS,
  type CampaignPriorityRecommendation,
  type CampaignPriorityResult,
} from "./campaignPriorityScore";

export type { CampaignPriorityRecommendation, CampaignPriorityResult };
export { RECOMMENDATION_LABELS };

export type CandidatePriorityGuidance = {
  priority: CampaignPriorityRecommendation;
  priorityLabel: string;
  score: number;
  whyThisMatters: string;
  recommendedRole: string;
  doNotWasteTime: boolean;
  confidence: CampaignPriorityResult["confidence"];
  factors: string[];
  warnings: string[];
};

export function scoreCandidateEventPriority(
  event: CivicEvent,
  workspace: CampaignWorkspace,
  plans: Record<string, CampaignEventPlan>,
  goals: CampaignGoalSettings | null,
): CandidatePriorityGuidance {
  const result = scoreCampaignEventPriority(event, workspace, plans, goals);
  return toCandidatePriorityGuidance(result, event);
}

export function toCandidatePriorityGuidance(
  result: CampaignPriorityResult,
  event: CivicEvent,
): CandidatePriorityGuidance {
  const priorityLabel = RECOMMENDATION_LABELS[result.recommendation];
  const whyThisMatters =
    result.factors.length > 0
      ? result.factors.join(" · ")
      : event.highCivicValue
        ? "High civic-value community gathering in scope."
        : "Verify locally before committing candidate time.";

  const recommendedRole = roleFromRecommendation(result.recommendation);
  const doNotWasteTime = result.recommendation === "skip" || result.score < 40;

  return {
    priority: result.recommendation,
    priorityLabel,
    score: result.score,
    whyThisMatters,
    recommendedRole,
    doNotWasteTime,
    confidence: result.confidence,
    factors: result.factors,
    warnings: result.warnings,
  };
}

function roleFromRecommendation(rec: CampaignPriorityRecommendation): string {
  switch (rec) {
    case "must_attend":
      return "Candidate should attend in person";
    case "should_attend":
      return "Strong candidate appearance — confirm schedule";
    case "send_surrogate":
      return "Send trusted surrogate with talking points";
    case "send_volunteers":
      return "Staff volunteers — candidate optional";
    case "monitor_only":
      return "Track for intel — no deployment yet";
    case "skip":
      return "Do not waste time — low ROI for this cycle";
    default:
      return "Review locally";
  }
}

export function priorityBadgeClass(rec: CampaignPriorityRecommendation): string {
  if (rec === "must_attend" || rec === "should_attend") return "badge-success";
  if (rec === "send_surrogate" || rec === "send_volunteers") return "badge-info";
  if (rec === "skip") return "badge-warning";
  return "chip chip-muted";
}
