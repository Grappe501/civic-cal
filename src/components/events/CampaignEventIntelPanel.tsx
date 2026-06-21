import { Link } from "react-router-dom";
import type { CivicEvent } from "../../lib/types";
import type { EventDossierBundle } from "../../lib/intelligence/eventDossierTypes";
import { scoreEventForCampaign } from "../../lib/campaigns/eventIntel";
import { scoreCampaignEventPriority } from "../../lib/intelligence/campaignPriorityScore";
import { getCountyDossier, voteTargetGap } from "../../lib/local-intelligence/registry";
import { LayerBadge, DensityBadge } from "../intelligence/LayerBadge";
import type { IntelligenceLayer } from "../../lib/intelligence/eventLayers";
import { loadPlansForCampaign } from "../../lib/campaigns/planStore";
import { loadCampaignGoalSettings } from "../../lib/campaigns/campaignGoalSettings";
import { getWorkspaceBySlug } from "../../lib/campaigns/workspaces";

interface Props {
  event: CivicEvent;
  bundle: EventDossierBundle;
  campaignSlug?: string;
}

export function CampaignEventIntelPanel({ event, bundle, campaignSlug }: Props) {
  const scored = scoreEventForCampaign(event);
  const workspace = campaignSlug ? getWorkspaceBySlug(campaignSlug) ?? undefined : undefined;
  const countyDossier = event.county ? getCountyDossier(event.county) : undefined;
  const countyGap = countyDossier ? voteTargetGap(countyDossier) : null;

  const campaignPriority =
    workspace &&
    scoreCampaignEventPriority(
      event,
      workspace,
      loadPlansForCampaign(workspace.slug),
      loadCampaignGoalSettings(workspace.slug),
    );

  return (
    <section className="dossier-section card border-l-4 border-l-ark-pine bg-ark-wheat/30">
      <h2 className="dossier-section-title text-ark-pine">Campaign intelligence (private)</h2>
      <p className="text-caption mt-1">Not shown on the public community calendar.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <LayerBadge layer={scored.layer as IntelligenceLayer} compact />
        <span className="chip chip-score">PO {scored.politicalOpportunityScore}</span>
        <DensityBadge score={scored.relationshipDensityScore} />
        {campaignPriority && (
          <span className="chip chip-active">{campaignPriority.recommendation.replace(/_/g, " ")}</span>
        )}
      </div>
      {countyGap != null && <p className="text-sm text-muted mt-2">County vote gap: {countyGap.toLocaleString()}</p>}
      {bundle.dossier.candidateGuidance && (
        <p className="text-sm mt-3 text-[var(--text-primary)]">{bundle.dossier.candidateGuidance}</p>
      )}
      {bundle.dossier.volunteerGuidance && (
        <p className="text-xs text-muted mt-2">Volunteer deployment: {bundle.dossier.volunteerGuidance}</p>
      )}
      {campaignSlug && (
        <Link to={`/campaigns/${campaignSlug}`} className="btn-secondary text-xs mt-4 inline-flex">
          Open campaign workspace →
        </Link>
      )}
    </section>
  );
}
