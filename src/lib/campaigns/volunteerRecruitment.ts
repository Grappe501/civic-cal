import type { CivicEvent } from "../types";
import type { CampaignEventPlan, CampaignWorkspace } from "./types";
import { loadPlansForCampaign } from "./planStore";
import { listCampaignWorkspaces } from "./workspaces";
import { getVolunteerBadgeLabel, resolveVolunteerDestination } from "../integrations/mobilizeLinks";

export interface PublicVolunteerAsk {
  workspaceSlug: string;
  campaignName: string;
  candidateName: string;
  eventId: string;
  eventTitle?: string;
  eventSlug?: string;
  plan: CampaignEventPlan;
  badgeLabel: string;
  hasDestination: boolean;
  destinationUrl: string | null;
}

function isAdvertisingVolunteers(plan: CampaignEventPlan): boolean {
  return Boolean(plan.needsVolunteers && (plan.advertiseVolunteers ?? plan.showVolunteersNeeded));
}

export function listCampaignPublicVolunteerAsks(
  workspace: CampaignWorkspace,
  events: CivicEvent[] = [],
): PublicVolunteerAsk[] {
  const plans = loadPlansForCampaign(workspace.slug);
  const byId = new Map(events.map((e) => [e.id, e]));
  const asks: PublicVolunteerAsk[] = [];

  for (const [eventId, plan] of Object.entries(plans)) {
    if (!isAdvertisingVolunteers(plan)) continue;
    const event = byId.get(eventId);
    const dest = resolveVolunteerDestination(plan, workspace);
    asks.push({
      workspaceSlug: workspace.slug,
      campaignName: workspace.campaignName,
      candidateName: workspace.candidateName,
      eventId,
      eventTitle: event?.title,
      eventSlug: event?.slug,
      plan,
      badgeLabel: getVolunteerBadgeLabel(plan, workspace),
      hasDestination: dest.url != null,
      destinationUrl: dest.url,
    });
  }

  return asks.sort((a, b) => (a.eventTitle ?? a.eventId).localeCompare(b.eventTitle ?? b.eventId));
}

export function listAllPublicVolunteerAsks(events: CivicEvent[] = []): PublicVolunteerAsk[] {
  const byId = new Map(events.map((e) => [e.id, e]));
  const all: PublicVolunteerAsk[] = [];

  for (const ws of listCampaignWorkspaces()) {
    for (const ask of listCampaignPublicVolunteerAsks(ws, events)) {
      const event = byId.get(ask.eventId);
      all.push({
        ...ask,
        eventTitle: event?.title ?? ask.eventTitle,
        eventSlug: event?.slug ?? ask.eventSlug,
      });
    }
  }

  return all;
}

export function eventHasPublicVolunteerAsk(eventId: string): boolean {
  for (const ws of listCampaignWorkspaces()) {
    const plan = loadPlansForCampaign(ws.slug)[eventId];
    if (plan && isAdvertisingVolunteers(plan)) return true;
  }
  return false;
}

export function normalizeVolunteerPlan(plan: CampaignEventPlan): CampaignEventPlan {
  const advertiseVolunteers = plan.advertiseVolunteers ?? plan.showVolunteersNeeded ?? false;
  return {
    ...plan,
    advertiseVolunteers,
    showVolunteersNeeded: advertiseVolunteers || plan.showVolunteersNeeded,
    volunteerNeededCount: plan.volunteerNeededCount ?? plan.volunteerGoal,
  };
}
