import type { CampaignEventPlan, CampaignWorkspace } from "../campaigns/types";

export interface VolunteerDestination {
  url: string | null;
  source: "mobilize_event" | "event_signup" | "campaign_default" | "none";
  isMobilize: boolean;
}

const MOBILIZE_HOST = /mobilize\.us/i;

export function isMobilizeUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    return MOBILIZE_HOST.test(new URL(url.trim()).hostname);
  } catch {
    return MOBILIZE_HOST.test(url);
  }
}

function cleanUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  return trimmed || null;
}

/** Mobilize event URL → event signup URL → campaign default signup URL */
export function resolveVolunteerDestination(
  plan: CampaignEventPlan,
  workspace: CampaignWorkspace,
): VolunteerDestination {
  const mobilize = cleanUrl(plan.mobilizeEventUrl);
  if (mobilize) {
    return { url: mobilize, source: "mobilize_event", isMobilize: isMobilizeUrl(mobilize) };
  }

  const signup = cleanUrl(plan.volunteerSignupUrl);
  if (signup) {
    return { url: signup, source: "event_signup", isMobilize: isMobilizeUrl(signup) };
  }

  const fallback = cleanUrl(workspace.defaultVolunteerSignupUrl);
  if (fallback) {
    return { url: fallback, source: "campaign_default", isMobilize: isMobilizeUrl(fallback) };
  }

  return { url: null, source: "none", isMobilize: false };
}

export function getVolunteerBadgeLabel(plan: CampaignEventPlan, workspace: CampaignWorkspace): string {
  if (plan.volunteerBadgeLabel?.trim()) return plan.volunteerBadgeLabel.trim();

  const defaultLabel = workspace.volunteerBadgeLabel?.trim();
  if (defaultLabel) return defaultLabel;

  const count = plan.volunteerNeededCount ?? plan.volunteerGoal;
  const lastName = workspace.candidateName.split(/\s+/).pop() ?? workspace.candidateName;
  if (count != null && count > 0) {
    return `${lastName} team needs ${count}`;
  }

  if (plan.volunteerPublicNote?.trim()) return plan.volunteerPublicNote.trim();

  return `Help ${lastName}`;
}

export function getVolunteerBadgeColor(plan: CampaignEventPlan, workspace: CampaignWorkspace): string {
  return (
    plan.volunteerBadgeColor?.trim() ||
    plan.volunteerColor?.trim() ||
    workspace.volunteerBrandColor?.trim() ||
    workspace.dashboardTheme.accentColor
  );
}
