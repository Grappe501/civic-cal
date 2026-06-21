import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CampaignDashboard } from "../components/campaigns/CampaignDashboard";
import { BetaPasswordGate } from "../components/auth/BetaPasswordGate";
import { fetchCampaignWorkspaceBySlug } from "../lib/campaigns/workspaces";
import type { CampaignWorkspace } from "../lib/campaigns/types";

export function CampaignWorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  const [workspace, setWorkspace] = useState<CampaignWorkspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetchCampaignWorkspaceBySlug(slug)
      .then(setWorkspace)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 animate-pulse h-48 bg-ark-wheat/30 rounded-2xl" />;
  }

  if (!workspace) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>Campaign workspace not found.</p>
        <Link to="/campaigns" className="btn-primary mt-4 inline-flex">All campaigns</Link>
      </div>
    );
  }

  return (
    <BetaPasswordGate title={`${workspace.candidateName} — campaign dashboard`}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link to="/campaigns" className="text-sm hover:underline" style={{ color: workspace.dashboardTheme.accentColor }}>
          ← All campaign dashboards
        </Link>
        <div className="mt-4">
          <CampaignDashboard workspace={workspace} />
        </div>
      </div>
    </BetaPasswordGate>
  );
}
