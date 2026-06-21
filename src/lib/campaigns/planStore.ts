import type { CampaignEventPlan, PlanStatus } from "./types";

const PREFIX = "civic-cal-campaign-plans";

function storageKey(slug: string): string {
  return `${PREFIX}:${slug}`;
}

export function loadPlansForCampaign(slug: string): Record<string, CampaignEventPlan> {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (raw) return JSON.parse(raw) as Record<string, CampaignEventPlan>;
  } catch (_) {}
  return {};
}

export function savePlanForCampaign(slug: string, eventId: string, plan: CampaignEventPlan): void {
  const all = loadPlansForCampaign(slug);
  all[eventId] = { ...plan, updatedAt: new Date().toISOString() };
  localStorage.setItem(storageKey(slug), JSON.stringify(all));
}

export function buildPlan(eventId: string, planStatus: PlanStatus, existing?: CampaignEventPlan): CampaignEventPlan {
  return {
    ...existing,
    eventId,
    planStatus,
    candidateAttending: planStatus === "attending" || planStatus === "candidate_should_attend",
    surrogateAttending: planStatus === "surrogate_should_attend",
    needsVolunteers: planStatus === "needs_volunteers",
  };
}

/** Future API contract — POST /campaign-workspaces/:slug/plans */
export interface CampaignPlanApiPayload {
  workspaceSlug: string;
  eventId: string;
  planStatus: PlanStatus;
  candidateAttending?: boolean;
  surrogateAttending?: boolean;
  needsVolunteers?: boolean;
  volunteerGoal?: number;
  staffingNotes?: string;
  travelNotes?: string;
}

export function toApiPayload(slug: string, plan: CampaignEventPlan): CampaignPlanApiPayload {
  return {
    workspaceSlug: slug,
    eventId: plan.eventId,
    planStatus: plan.planStatus,
    candidateAttending: plan.candidateAttending,
    surrogateAttending: plan.surrogateAttending,
    needsVolunteers: plan.needsVolunteers,
    volunteerGoal: plan.volunteerGoal,
    staffingNotes: plan.staffingNotes,
    travelNotes: plan.travelNotes,
  };
}
