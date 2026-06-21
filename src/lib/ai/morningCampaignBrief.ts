import { isThisWeek, format } from "date-fns";
import type { CampaignWorkspace } from "../campaigns/types";
import type { ClassifiedCampaignEvent } from "../campaigns/districtScope";
import type { CampaignEventPlan } from "../campaigns/types";
import type { CampaignOwnedEvent, ScheduleConflict } from "../campaigns/campaignEventTypes";
import { analyzeCalendarGaps } from "../campaigns/calendarGapAnalyzer";
import { detectScheduleConflicts } from "../campaigns/campaignConflictDetector";
import { getEventPresence } from "../campaigns/presenceLayer";
import { listCampaignWorkspaces } from "../campaigns/workspaces";
import { institutionsNeedingAttention, buildInstitutionRelationships } from "../institutions/institutionRelationshipEngine";
import { translateEventToOpportunity } from "../intelligence/eventImportanceEngine";
import type { CivicEvent } from "../types";

export interface MorningBriefInsight {
  type: "alert" | "opportunity" | "gap" | "conflict" | "opponent" | "institution" | "volunteer";
  message: string;
  severity?: "high" | "medium";
  eventSlug?: string;
  county?: string;
}

export interface MorningCampaignBrief {
  generatedFor: string;
  candidateName: string;
  insights: MorningBriefInsight[];
  topEventsThisWeek: { title: string; slug: string; rd: number; insight?: string }[];
  conflicts: ScheduleConflict[];
}

export function buildMorningCampaignBrief(
  workspace: CampaignWorkspace,
  classified: ClassifiedCampaignEvent[],
  plans: Record<string, CampaignEventPlan>,
  campaignEvents: CampaignOwnedEvent[],
  communityEvents: CivicEvent[],
): MorningCampaignBrief {
  const insights: MorningBriefInsight[] = [];
  const thisWeek = classified.filter((c) => isThisWeek(new Date(c.scored.event.startAt), { weekStartsOn: 0 }));

  const gap = analyzeCalendarGaps(classified, plans, workspace);
  for (const county of gap.countiesWithoutPresence.slice(0, 3)) {
    insights.push({
      type: "gap",
      severity: "high",
      message: `You are missing ${county} County — no planned presence in scope.`,
      county,
    });
  }

  const highRd = thisWeek
    .filter((c) => c.scored.relationshipDensityScore >= 90)
    .slice(0, 3);
  for (const c of highRd) {
    const opp = translateEventToOpportunity(c.scored.event);
    insights.push({
      type: "opportunity",
      severity: "high",
      message: `${c.scored.event.title} — RD ${c.scored.relationshipDensityScore}. ${opp.narrative}`,
      eventSlug: c.scored.event.slug,
      county: c.scored.event.county,
    });
  }

  if (highRd.length === 0) {
    const top = [...thisWeek].sort((a, b) => b.scored.relationshipDensityScore - a.scored.relationshipDensityScore).slice(0, 3);
    if (top.length) {
      insights.push({
        type: "opportunity",
        message: `${top.length} high-opportunity events this week (top RD ${top[0].scored.relationshipDensityScore}).`,
      });
    }
  }

  const conflicts = detectScheduleConflicts(campaignEvents, communityEvents);
  for (const conflict of conflicts.slice(0, 2)) {
    insights.push({
      type: "conflict",
      severity: conflict.severity,
      message: conflict.message,
      eventSlug: conflict.communityEvent.slug,
    });
  }

  const volunteerGaps = gap.volunteerGaps.slice(0, 2);
  for (const v of volunteerGaps) {
    insights.push({
      type: "volunteer",
      message: `Volunteer coverage needed: ${v.scored.event.title} (${v.scored.event.county} County)`,
      eventSlug: v.scored.event.slug,
      county: v.scored.event.county,
    });
  }

  const countiesInScope = [...new Set(classified.map((c) => c.scored.event.county))];
  const institutions = buildInstitutionRelationships(
    workspace.slug,
    countiesInScope.length ? countiesInScope : workspace.counties,
    communityEvents,
    plans,
  );
  for (const inst of institutionsNeedingAttention(institutions, 3)) {
    insights.push({
      type: "institution",
      message: `${inst.institutionName}: relationship ${inst.scoreLabel} (${inst.relationshipScore}). ${inst.recommendedAction ?? ""}`.trim(),
      county: inst.county,
    });
  }

  const otherSlugs = listCampaignWorkspaces().filter((w) => w.slug !== workspace.slug).map((w) => w.slug);
  let opponentHits = 0;
  for (const c of thisWeek.slice(0, 20)) {
    const presence = getEventPresence(c.scored.event.id);
    const others = presence.attendingCampaigns.filter((p) => otherSlugs.includes(p.slug));
    const myPlan = plans[c.scored.event.id];
    const imGoing = myPlan && ["attending", "candidate_should_attend"].includes(myPlan.planStatus);
    if (others.length > 0 && !imGoing) {
      opponentHits += 1;
      if (opponentHits <= 2) {
        insights.push({
          type: "opponent",
          severity: "medium",
          message: `Others scheduled at "${c.scored.event.title}" — you are not marked attending.`,
          eventSlug: c.scored.event.slug,
        });
      }
    }
  }

  for (const c of classified) {
    const opp = translateEventToOpportunity(c.scored.event);
    if (opp.scores.attendanceScore >= 85 && /dinner|fish fry|spaghetti/i.test(c.scored.event.title)) {
      insights.push({
        type: "opportunity",
        severity: "high",
        message: `${c.scored.event.title} — ${opp.headline}. Large community meal — verify crowd locally.`,
        eventSlug: c.scored.event.slug,
      });
      break;
    }
  }

  const topEventsThisWeek = [...thisWeek]
    .sort((a, b) => b.scored.relationshipDensityScore - a.scored.relationshipDensityScore)
    .slice(0, 5)
    .map((c) => ({
      title: c.scored.event.title,
      slug: c.scored.event.slug,
      rd: c.scored.relationshipDensityScore,
      insight: translateEventToOpportunity(c.scored.event).headline,
    }));

  return {
    generatedFor: format(new Date(), "EEEE, MMM d"),
    candidateName: workspace.candidateName,
    insights: insights.slice(0, 10),
    topEventsThisWeek,
    conflicts,
  };
}
