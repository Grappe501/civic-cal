import { isToday, isThisWeek, isThisMonth } from "date-fns";
import type { CampaignWorkspace } from "../campaigns/types";
import type { CampaignEventPlan } from "../campaigns/types";
import type { CivicEvent } from "../types";
import { loadCampaignGoalSettings, type CampaignGoalSettings } from "../campaigns/campaignGoalSettings";
import {
  scoreCampaignEventPriority,
  type CampaignPriorityResult,
  RECOMMENDATION_LABELS,
} from "../intelligence/campaignPriorityScore";
import { detectScheduleConflicts } from "../campaigns/campaignConflictDetector";
import type { CampaignOwnedEvent } from "../campaigns/campaignEventTypes";
import { analyzeCalendarGaps } from "../campaigns/calendarGapAnalyzer";
import { classifyCampaignEvents, dashboardEvents } from "../campaigns/districtBoundaryEngine";

export interface CopilotEventCard {
  priority: CampaignPriorityResult;
  event: CivicEvent;
  whyItMatters: string;
  suggestedRole: string;
  localIntelNeeded: string[];
  conflictWarning?: string;
  volunteerNotes?: string;
  sourceUrl?: string | null;
}

export interface CampaignCopilotBrief {
  horizon: "today" | "week" | "month";
  generatedAt: string;
  headline: string;
  urgent: string[];
  topEvents: CopilotEventCard[];
  gaps: string[];
  volunteerNotes: string[];
}

function whyMatters(p: CampaignPriorityResult): string {
  const parts = p.factors.slice(0, 2);
  return parts.length ? parts.join(" · ") : "Public community event in scope — verify locally.";
}

function suggestedRole(p: CampaignPriorityResult): string {
  return RECOMMENDATION_LABELS[p.recommendation];
}

function buildCards(
  events: CivicEvent[],
  workspace: CampaignWorkspace,
  plans: Record<string, CampaignEventPlan>,
  goals: CampaignGoalSettings | null,
  conflicts: Map<string, string>,
): CopilotEventCard[] {
  return events
    .map((event) => {
      const priority = scoreCampaignEventPriority(event, workspace, plans, goals);
      return {
        priority,
        event,
        whyItMatters: whyMatters(priority),
        suggestedRole: suggestedRole(priority),
        localIntelNeeded: priority.confidence === "low" ? ["Verify attendance", "Confirm venue"] : [],
        conflictWarning: conflicts.get(event.id),
        volunteerNotes: priority.recommendation === "send_volunteers" ? "Deploy volunteer team if candidate unavailable" : undefined,
        sourceUrl: event.websiteUrl ?? event.source ?? null,
      };
    })
    .sort((a, b) => b.priority.score - a.priority.score);
}

export function buildCampaignCopilotBrief(
  horizon: "today" | "week" | "month",
  workspace: CampaignWorkspace,
  allEvents: CivicEvent[],
  plans: Record<string, CampaignEventPlan>,
  campaignEvents: CampaignOwnedEvent[],
): CampaignCopilotBrief {
  const goals = loadCampaignGoalSettings(workspace.slug);
  const breakdown = classifyCampaignEvents(allEvents, workspace);
  const classified = dashboardEvents(breakdown);
  const scoped = classified.map((c) => c.scored.event);

  const filtered = scoped.filter((e) => {
    const d = new Date(e.startAt);
    if (horizon === "today") return isToday(d);
    if (horizon === "week") return isThisWeek(d, { weekStartsOn: 0 });
    return isThisMonth(d);
  });

  const conflictList = detectScheduleConflicts(campaignEvents, scoped);
  const conflictMap = new Map(conflictList.map((c) => [c.communityEvent.id, c.message]));

  const cards = buildCards(filtered, workspace, plans, goals, conflictMap).slice(0, horizon === "today" ? 5 : horizon === "week" ? 10 : 15);

  const gap = analyzeCalendarGaps(classified, plans, workspace);
  const urgent: string[] = [];
  if (horizon === "today") {
    if (cards.some((c) => c.priority.recommendation === "must_attend")) urgent.push("Must-attend event(s) today");
    if (conflictList.length) urgent.push(`${conflictList.length} schedule conflict(s) detected`);
  }
  if (gap.countiesWithoutPresence.length) {
    urgent.push(`No presence in ${gap.countiesWithoutPresence.slice(0, 2).join(", ")}`);
  }

  const headlines = {
    today: `Where ${workspace.candidateName} should be today`,
    week: `Best rooms this week — cut through the noise`,
    month: `Coverage gaps and recurring traditions this month`,
  };

  return {
    horizon,
    generatedAt: new Date().toISOString(),
    headline: headlines[horizon],
    urgent,
    topEvents: cards,
    gaps: gap.countiesWithoutPresence.slice(0, 5).map((c) => `${c} County — no planned presence`),
    volunteerNotes: cards.filter((c) => c.volunteerNotes).map((c) => `${c.event.title}: ${c.volunteerNotes}`),
  };
}

export interface AskAiWhyPayload {
  eventTitle: string;
  recommendation: string;
  factors: string[];
  warnings: string[];
  confidence: string;
}

export function buildAskAiWhyPayload(card: CopilotEventCard): AskAiWhyPayload {
  return {
    eventTitle: card.event.title,
    recommendation: card.suggestedRole,
    factors: card.priority.factors,
    warnings: card.priority.warnings,
    confidence: card.priority.confidence,
  };
}
