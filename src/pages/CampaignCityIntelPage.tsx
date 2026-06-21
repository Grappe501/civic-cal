import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CityIntelligenceBrief } from "../components/local-intelligence/CityIntelligenceBrief";
import { fetchCampaignWorkspaceBySlug } from "../lib/campaigns/workspaces";
import { cityFromSlug } from "../lib/local-intelligence/registry";
import type { CampaignWorkspace } from "../lib/campaigns/types";

export function CampaignCityIntelPage() {
  const { slug, citySlug: citySlugParam } = useParams<{ slug: string; citySlug: string }>();
  const [workspace, setWorkspace] = useState<CampaignWorkspace | null>(null);
  const city = citySlugParam ? cityFromSlug(citySlugParam) : undefined;

  useEffect(() => {
    if (slug) fetchCampaignWorkspaceBySlug(slug).then(setWorkspace);
  }, [slug]);

  if (!workspace || !city) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>City intelligence not found.</p>
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
        <CityIntelligenceBrief workspace={workspace} city={city} />
      </div>
    </div>
  );
}
