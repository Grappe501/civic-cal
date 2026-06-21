import type { CivicEvent } from "../types";
import type { CampaignWorkspace } from "../campaigns/types";
import type { CampaignEventPlan } from "../campaigns/types";
import type { CampaignGoalSettings } from "../campaigns/campaignGoalSettings";
import { scoreEventForCampaign } from "../campaigns/eventIntel";
import { traditionStrengthEstimate } from "../campaigns/eventIntel";
import { getEventPresence } from "../campaigns/presenceLayer";

export type CampaignPriorityRecommendation =
  | "must_attend"
  | "should_attend"
  | "send_surrogate"
  | "send_volunteers"
  | "monitor_only"
  | "skip";

export interface CampaignPriorityResult {
  eventId: string;
  slug: string;
  title: string;
  score: number;
  recommendation: CampaignPriorityRecommendation;
  confidence: "high" | "medium" | "low";
  factors: string[];
  warnings: string[];
  travelBurden: "low" | "medium" | "high" | "unknown";
  sourceConfidence: number;
}

function districtMatch(event: CivicEvent, workspace: CampaignWorkspace): number {
  if (workspace.districtScope.mode === "statewide") return 85;
  const counties = workspace.counties.map((c) => c.toLowerCase());
  if (counties.includes(String(event.county ?? "").toLowerCase())) return 95;
  if (workspace.cities.some((c) => c.toLowerCase() === String(event.city ?? "").toLowerCase())) return 90;
  return 25;
}

function travelBurden(event: CivicEvent, goals: CampaignGoalSettings | null): "low" | "medium" | "high" | "unknown" {
  if (!goals?.priorityCounties?.length) return "unknown";
  const inPriority = goals.priorityCounties.some((c) => c.toLowerCase() === String(event.county ?? "").toLowerCase());
  return inPriority ? "low" : goals.statewideFocus ? "medium" : "high";
}

function hasConflict(event: CivicEvent, plans: Record<string, CampaignEventPlan>): boolean {
  const plan = plans[event.id];
  return plan?.planStatus === "skip";
}

function presenceNearby(event: CivicEvent, workspace: CampaignWorkspace): boolean {
  const presence = getEventPresence(event.id);
  return presence.attendingCampaigns.some((p) => p.slug === workspace.slug);
}

export function scoreCampaignEventPriority(
  event: CivicEvent,
  workspace: CampaignWorkspace,
  plans: Record<string, CampaignEventPlan>,
  goals: CampaignGoalSettings | null,
): CampaignPriorityResult {
  const scored = scoreEventForCampaign(event);
  const tradition = traditionStrengthEstimate(event) ?? 0;
  const factors: string[] = [];
  const warnings: string[] = [];

  let total = 0;
  const weights = {
    district: 0.2,
    po: 0.12,
    rd: 0.18,
    tradition: 0.1,
    attendance: 0.1,
    source: 0.08,
    freshness: 0.07,
    volunteer: 0.05,
    gap: 0.1,
  };

  const dm = districtMatch(event, workspace);
  total += dm * weights.district;
  if (dm >= 90) factors.push("In district scope");

  total += scored.politicalOpportunityScore * weights.po;
  total += scored.relationshipDensityScore * weights.rd;
  if (scored.relationshipDensityScore >= 85) factors.push("High relationship-density room");

  total += tradition * weights.tradition;
  if (tradition >= 70) factors.push("Strong local tradition");

  const att = event.typicalAttendanceBand === "large" || event.typicalAttendanceBand === "massive" ? 85 : 50;
  total += att * weights.attendance;

  const sourceConf = event.websiteUrl || event.source ? 70 : 40;
  total += sourceConf * weights.source;
  if (!event.websiteUrl && !event.source) warnings.push("Missing source URL");

  const daysOut = event.startAt ? (new Date(event.startAt).getTime() - Date.now()) / 86400000 : 999;
  const fresh = daysOut <= 7 ? 90 : daysOut <= 30 ? 75 : 55;
  total += fresh * weights.freshness;

  const vol = event.category === "volunteer" || /volunteer|cleanup/i.test(event.title) ? 80 : 35;
  total += vol * weights.volunteer;

  const gapBoost = goals?.priorityCounties?.includes(String(event.county ?? "")) ? 85 : 50;
  total += gapBoost * weights.gap;

  if (hasConflict(event, plans)) {
    total -= 15;
    warnings.push("Marked skip in plan");
  }
  if (presenceNearby(event, workspace)) {
    total += 8;
    factors.push("Campaign presence already noted");
  }

  const travel = travelBurden(event, goals);
  if (travel === "high") {
    total -= 10;
    warnings.push("Outside priority counties — travel burden");
  }

  if (goals?.preferredEventTypes?.length) {
    const match = goals.preferredEventTypes.some((t) => event.category === t || event.title.toLowerCase().includes(t));
    if (match) {
      total += 5;
      factors.push("Matches preferred event type");
    }
  }

  const score = Math.round(Math.min(100, Math.max(0, total)));
  let recommendation: CampaignPriorityRecommendation = "monitor_only";
  if (score >= 82) recommendation = "must_attend";
  else if (score >= 72) recommendation = "should_attend";
  else if (score >= 62 && scored.relationshipDensityScore >= 80) recommendation = "send_surrogate";
  else if (score >= 55 && vol >= 70) recommendation = "send_volunteers";
  else if (score < 40) recommendation = "skip";

  const confidence: CampaignPriorityResult["confidence"] =
    sourceConf >= 70 && factors.length >= 2 ? "high" : factors.length >= 1 ? "medium" : "low";

  return {
    eventId: event.id,
    slug: event.slug,
    title: event.title,
    score,
    recommendation,
    confidence,
    factors,
    warnings,
    travelBurden: travel,
    sourceConfidence: sourceConf,
  };
}

export const RECOMMENDATION_LABELS: Record<CampaignPriorityRecommendation, string> = {
  must_attend: "Must attend",
  should_attend: "Should attend",
  send_surrogate: "Send surrogate",
  send_volunteers: "Send volunteers",
  monitor_only: "Monitor only",
  skip: "Skip",
};
