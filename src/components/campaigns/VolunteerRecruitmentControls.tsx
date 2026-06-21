import { ExternalLink } from "lucide-react";
import type { CampaignEventPlan, CampaignWorkspace } from "../../lib/campaigns/types";
import { savePlanForCampaign } from "../../lib/campaigns/planStore";
import { notifyPresenceUpdate } from "../../lib/campaigns/presenceLayer";
import { normalizeVolunteerPlan } from "../../lib/campaigns/volunteerRecruitment";

interface Props {
  workspace: CampaignWorkspace;
  eventId: string;
  plan?: CampaignEventPlan;
  onUpdate: (plan: CampaignEventPlan) => void;
}

export function VolunteerRecruitmentControls({ workspace, eventId, plan, onUpdate }: Props) {
  if (!plan || plan.planStatus === "skip") return null;

  const theme = workspace.dashboardTheme;
  const normalized = normalizeVolunteerPlan(plan);

  function patch(partial: Partial<CampaignEventPlan>) {
    const merged = normalizeVolunteerPlan({
      ...normalized,
      eventId,
      ...partial,
    });
    if (partial.advertiseVolunteers != null) {
      merged.showVolunteersNeeded = partial.advertiseVolunteers;
    }
    if (partial.needsVolunteers === false) {
      merged.advertiseVolunteers = false;
      merged.showVolunteersNeeded = false;
    }
    merged.publicPresenceStatus =
      merged.advertiseVolunteers ||
      merged.showCandidateAttending ||
      merged.showSurrogateAttending
        ? "public"
        : merged.publicPresenceStatus ?? "private";

    savePlanForCampaign(workspace.slug, eventId, merged);
    notifyPresenceUpdate();
    onUpdate(merged);
  }

  return (
    <div className="mt-3 pt-3 border-t border-ark-pine/10 space-y-2 volunteer-recruitment-controls">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted flex items-center gap-1">
        Volunteer recruitment
        <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
      </p>

      <label className="flex items-center gap-2 text-xs text-ark-pine cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(normalized.needsVolunteers)}
          onChange={(e) => patch({ needsVolunteers: e.target.checked })}
        />
        Need volunteers at this event
      </label>

      {normalized.needsVolunteers && (
        <>
          <label className="flex items-center gap-2 text-xs text-ark-pine cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(normalized.advertiseVolunteers)}
              onChange={(e) => patch({ advertiseVolunteers: e.target.checked })}
            />
            Advertise publicly on calendar
          </label>

          <input
            className="input text-xs py-1.5"
            type="url"
            placeholder="Mobilize event URL (optional)"
            value={normalized.mobilizeEventUrl ?? ""}
            onChange={(e) => patch({ mobilizeEventUrl: e.target.value || null })}
          />
          <input
            className="input text-xs py-1.5"
            type="url"
            placeholder="Volunteer signup URL (optional)"
            value={normalized.volunteerSignupUrl ?? ""}
            onChange={(e) => patch({ volunteerSignupUrl: e.target.value || null })}
          />
          <input
            className="input text-xs py-1.5"
            placeholder="Volunteer role summary (e.g. Door greeters, setup crew)"
            value={normalized.volunteerRoleSummary ?? ""}
            onChange={(e) => patch({ volunteerRoleSummary: e.target.value || null })}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input text-xs py-1.5"
              type="number"
              min={1}
              placeholder="# needed"
              value={normalized.volunteerNeededCount ?? ""}
              onChange={(e) =>
                patch({
                  volunteerNeededCount: e.target.value ? Number(e.target.value) : null,
                  volunteerGoal: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <input
              className="input text-xs py-1.5"
              placeholder="Badge label"
              value={normalized.volunteerBadgeLabel ?? ""}
              onChange={(e) => patch({ volunteerBadgeLabel: e.target.value || null })}
            />
          </div>
          <input
            className="input text-xs py-1.5"
            placeholder="Shift notes (optional)"
            value={normalized.volunteerShiftNotes ?? ""}
            onChange={(e) => patch({ volunteerShiftNotes: e.target.value || null })}
          />
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted shrink-0">Badge color</label>
            <input
              type="color"
              className="h-8 w-10 rounded border border-ark-pine/20"
              value={normalized.volunteerBadgeColor ?? theme.accentColor}
              onChange={(e) => patch({ volunteerBadgeColor: e.target.value, volunteerColor: e.target.value })}
            />
          </div>
          <p className="text-[10px] text-muted">
            Public badge appears only when “Advertise publicly” is on. Click priority: Mobilize → signup URL → campaign default.
          </p>
        </>
      )}
    </div>
  );
}
