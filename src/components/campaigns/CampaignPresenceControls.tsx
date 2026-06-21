import type { CampaignEventPlan, CampaignWorkspace } from "../../lib/campaigns/types";
import { savePlanForCampaign } from "../../lib/campaigns/planStore";
import { notifyPresenceUpdate } from "../../lib/campaigns/presenceLayer";
import { VolunteerRecruitmentControls } from "./VolunteerRecruitmentControls";

interface Props {
  workspace: CampaignWorkspace;
  eventId: string;
  plan?: CampaignEventPlan;
  onUpdate: (plan: CampaignEventPlan) => void;
}

export function CampaignPresenceControls({ workspace, eventId, plan, onUpdate }: Props) {
  if (!plan || plan.planStatus === "skip" || plan.planStatus === "needs_research") return null;

  const theme = workspace.dashboardTheme;
  const canShowCandidate =
    plan.planStatus === "attending" || plan.planStatus === "candidate_should_attend";
  const canShowSurrogate = plan.planStatus === "surrogate_should_attend";
  const showVisibilityToggles = !["considering"].includes(plan.planStatus);

  function patch(partial: Partial<CampaignEventPlan>) {
    const updated: CampaignEventPlan = {
      ...plan!,
      eventId,
      ...partial,
      publicPresenceStatus:
        partial.showCandidateAttending ||
        partial.showSurrogateAttending ||
        partial.advertiseVolunteers ||
        plan!.advertiseVolunteers
          ? "public"
          : partial.publicPresenceStatus ?? plan!.publicPresenceStatus ?? "private",
      candidateColor: partial.candidateColor ?? plan!.candidateColor ?? theme.primaryColor,
      volunteerColor: partial.volunteerColor ?? plan!.volunteerColor ?? theme.accentColor,
    };
    savePlanForCampaign(workspace.slug, eventId, updated);
    notifyPresenceUpdate();
    onUpdate(updated);
  }

  return (
    <div className="mt-3 pt-3 border-t border-ark-pine/10 space-y-2">
      {showVisibilityToggles && (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Public calendar visibility</p>
      )}

      {showVisibilityToggles && canShowCandidate && (
        <label className="flex items-center gap-2 text-xs text-ark-pine cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(plan.showCandidateAttending)}
            onChange={(e) => patch({ showCandidateAttending: e.target.checked })}
          />
          Show candidate attending publicly
        </label>
      )}

      {showVisibilityToggles && canShowSurrogate && (
        <label className="flex items-center gap-2 text-xs text-ark-pine cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(plan.showSurrogateAttending)}
            onChange={(e) => patch({ showSurrogateAttending: e.target.checked })}
          />
          Show surrogate attending publicly
        </label>
      )}

      {showVisibilityToggles && (plan.showCandidateAttending || plan.showSurrogateAttending) && (
        <input
          className="input text-xs py-1.5"
          placeholder={`Public note (e.g. "${workspace.candidateName.split(" ").pop()} attending")`}
          value={plan.publicNote || ""}
          onChange={(e) => patch({ publicNote: e.target.value || undefined })}
        />
      )}

      <VolunteerRecruitmentControls workspace={workspace} eventId={eventId} plan={plan} onUpdate={onUpdate} />

      <p className="text-[10px] text-muted">Private plans stay off the public calendar until you enable visibility above.</p>
    </div>
  );
}
