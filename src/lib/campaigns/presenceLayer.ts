import { listCampaignWorkspaces } from "./workspaces";
import { loadPlansForCampaign } from "./planStore";
import { getWorkspaceBySlug } from "./workspaces";
import type { CampaignEventPlan, PlanStatus } from "./types";
import {
  getVolunteerBadgeColor,
  getVolunteerBadgeLabel,
  resolveVolunteerDestination,
} from "../integrations/mobilizeLinks";
import { normalizeVolunteerPlan } from "./volunteerRecruitment";

export type PresenceCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type PresenceBadgeKind = "candidate" | "volunteer" | "surrogate" | "watching";

export interface PublicPresenceBadge {
  kind: PresenceBadgeKind;
  corner: PresenceCorner;
  label: string;
  color: string;
  textColor?: string;
  slug: string;
  campaignName: string;
  destinationUrl?: string | null;
  hasDestination?: boolean;
}

export interface CampaignPresenceEntry {
  slug: string;
  campaignName: string;
  candidateName: string;
  candidateColor: string;
  volunteerColor: string;
  planStatus: PlanStatus;
  showCandidateAttending: boolean;
  advertiseVolunteers: boolean;
  showSurrogateAttending: boolean;
  publicNote?: string;
  volunteerPublicNote?: string;
  plan: CampaignEventPlan;
}

export interface EventPresence {
  eventId: string;
  attendingCampaigns: CampaignPresenceEntry[];
  volunteerNeeds: CampaignPresenceEntry[];
  surrogatePlans: CampaignPresenceEntry[];
  watchingCampaigns: number;
  publicBadges: PublicPresenceBadge[];
}

const PUBLIC_PLAN_STATUSES: PlanStatus[] = [
  "attending",
  "candidate_should_attend",
  "surrogate_should_attend",
  "needs_volunteers",
  "considering",
];

function isPublicPlan(plan: CampaignEventPlan): boolean {
  const normalized = normalizeVolunteerPlan(plan);
  if (normalized.publicPresenceStatus === "public") return true;
  return Boolean(
    normalized.showCandidateAttending ||
      normalized.advertiseVolunteers ||
      normalized.showSurrogateAttending,
  );
}

function shortCandidateName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

function buildBadges(entries: CampaignPresenceEntry[], watchingCount: number): PublicPresenceBadge[] {
  const badges: PublicPresenceBadge[] = [];

  for (const e of entries) {
    const ws = getWorkspaceBySlug(e.slug);
    if (!ws) continue;

    if (e.showCandidateAttending && (e.planStatus === "attending" || e.planStatus === "candidate_should_attend")) {
      badges.push({
        kind: "candidate",
        corner: "top-left",
        label: e.publicNote || `${shortCandidateName(e.candidateName)} attending`,
        color: e.candidateColor,
        textColor: "#fff",
        slug: e.slug,
        campaignName: e.campaignName,
      });
    }

    if (e.advertiseVolunteers && e.plan.needsVolunteers) {
      const dest = resolveVolunteerDestination(e.plan, ws);
      badges.push({
        kind: "volunteer",
        corner: "top-right",
        label: getVolunteerBadgeLabel(e.plan, ws),
        color: getVolunteerBadgeColor(e.plan, ws),
        textColor: "#fff",
        slug: e.slug,
        campaignName: e.campaignName,
        destinationUrl: dest.url,
        hasDestination: dest.url != null,
      });
    }

    if (e.showSurrogateAttending && e.planStatus === "surrogate_should_attend") {
      badges.push({
        kind: "surrogate",
        corner: "bottom-left",
        label: e.publicNote || "Surrogate planned",
        color: e.candidateColor,
        textColor: "#fff",
        slug: e.slug,
        campaignName: e.campaignName,
      });
    }
  }

  const attendingCount = entries.filter((e) => e.showCandidateAttending || e.showSurrogateAttending).length;
  if (watchingCount > 1 || (watchingCount > 0 && attendingCount === 0)) {
    badges.push({
      kind: "watching",
      corner: "bottom-right",
      label: watchingCount > 1 ? `${watchingCount} campaigns watching` : "Campaign watching",
      color: "#1A1F2E",
      textColor: "#fff",
      slug: "multi",
      campaignName: "Multiple",
    });
  }

  return badges;
}

/** Aggregate public presence from localStorage demo plans across all workspaces */
export function getEventPresence(eventId: string): EventPresence {
  const workspaces = listCampaignWorkspaces();
  const attendingCampaigns: CampaignPresenceEntry[] = [];
  const volunteerNeeds: CampaignPresenceEntry[] = [];
  const surrogatePlans: CampaignPresenceEntry[] = [];
  let watchingCount = 0;

  for (const ws of workspaces) {
    const raw = loadPlansForCampaign(ws.slug)[eventId];
    if (!raw) continue;
    const plan = normalizeVolunteerPlan(raw);
    if (!PUBLIC_PLAN_STATUSES.includes(plan.planStatus)) continue;

    if (!isPublicPlan(plan)) {
      if (plan.planStatus !== "skip" && plan.planStatus !== "needs_research") watchingCount++;
      continue;
    }

    const entry: CampaignPresenceEntry = {
      slug: ws.slug,
      campaignName: ws.campaignName,
      candidateName: ws.candidateName,
      candidateColor: plan.candidateColor || ws.dashboardTheme.primaryColor,
      volunteerColor: getVolunteerBadgeColor(plan, ws),
      planStatus: plan.planStatus,
      showCandidateAttending: Boolean(plan.showCandidateAttending),
      advertiseVolunteers: Boolean(plan.advertiseVolunteers),
      showSurrogateAttending: Boolean(plan.showSurrogateAttending),
      publicNote: plan.publicNote,
      volunteerPublicNote: plan.volunteerPublicNote,
      plan,
    };

    if (
      entry.showCandidateAttending &&
      (plan.candidateAttending || plan.planStatus === "candidate_should_attend" || plan.planStatus === "attending")
    ) {
      attendingCampaigns.push(entry);
    }
    if (entry.advertiseVolunteers && plan.needsVolunteers) volunteerNeeds.push(entry);
    if (entry.showSurrogateAttending && (plan.surrogateAttending || plan.planStatus === "surrogate_should_attend")) {
      surrogatePlans.push(entry);
    }
    watchingCount++;
  }

  const publicBadges = buildBadges(
    [...attendingCampaigns, ...volunteerNeeds, ...surrogatePlans],
    watchingCount,
  );

  return {
    eventId,
    attendingCampaigns,
    volunteerNeeds,
    surrogatePlans,
    watchingCampaigns: watchingCount,
    publicBadges,
  };
}

export function notifyPresenceUpdate(): void {
  window.dispatchEvent(new CustomEvent("civic-presence-updated"));
}
