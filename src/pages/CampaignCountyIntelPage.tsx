import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CountyIntelligenceBrief } from "../components/local-intelligence/CountyIntelligenceBrief";
import { fetchCampaignWorkspaceBySlug } from "../lib/campaigns/workspaces";
import { countyFromSlugLocal } from "../lib/local-intelligence/registry";
import { countyFromSlug } from "../lib/counties";
import { getCountyDossier } from "../lib/local-intelligence/registry";
import type { CampaignWorkspace } from "../lib/campaigns/types";

export function CampaignCountyIntelPage() {
  const { slug, countySlug: countySlugParam } = useParams<{ slug: string; countySlug: string }>();
  const [workspace, setWorkspace] = useState<CampaignWorkspace | null>(null);
  const countyName = countySlugParam ? countyFromSlug(countySlugParam) : undefined;
  const county = countyName ? getCountyDossier(countyName) : countySlugParam ? countyFromSlugLocal(countySlugParam) : undefined;

  useEffect(() => {
    if (slug) fetchCampaignWorkspaceBySlug(slug).then(setWorkspace);
  }, [slug]);

  if (!workspace || !county) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>County intelligence not found.</p>
        <Link to={`/campaigns/${slug}`} className="btn-primary mt-4 inline-flex">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to={`/campaigns/${slug}`} className="text-sm hover:underline" style={{ color: workspace.dashboardTheme.accentColor }}>
        ← {workspace.dashboardLabel}
      </Link>
      <div className="mt-4">
        <CountyIntelligenceBrief workspace={workspace} county={county} />
      </div>
    </div>
  );
}
