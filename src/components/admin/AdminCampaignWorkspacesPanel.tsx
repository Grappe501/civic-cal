import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCampaignWorkspaces } from "../../lib/campaigns/workspaces";
import type { CampaignWorkspace } from "../../lib/campaigns/types";
import { isBoundaryPending } from "../../lib/campaigns/districtScope";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

interface Props {
  token: string;
}

export function AdminCampaignWorkspacesPanel({ token }: Props) {
  const [workspaces, setWorkspaces] = useState<CampaignWorkspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaignWorkspaces().then(setWorkspaces).finally(() => setLoading(false));
  }, []);

  async function toggleActive(slug: string, isActive: boolean) {
    try {
      await fetch(`${fnBase}/campaign-workspaces`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug, isActive }),
      });
      setWorkspaces((prev) => prev.map((w) => (w.slug === slug ? { ...w, isActive } : w)));
    } catch (_) {}
  }

  if (loading) return <p className="text-muted-soft">Loading workspaces…</p>;

  return (
    <div>
      <p className="text-sm text-muted-soft mb-4">
        Named campaign dashboards — edit scope placeholders in DB or seed JSON. District GIS is next pass.
      </p>
      <div className="space-y-4">
        {workspaces.map((ws) => (
          <div key={ws.slug} className="card border-l-4" style={{ borderLeftColor: ws.dashboardTheme.accentColor }}>
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <h3 className="font-semibold text-ark-pine">{ws.dashboardLabel}</h3>
                <p className="text-sm text-muted-soft">
                  {ws.candidateName} · {ws.officeSought} · {ws.districtName}
                </p>
              </div>
              <span className={`chip text-xs ${ws.isActive ? "bg-emerald-800 text-white" : "bg-ark-wheat"}`}>
                {ws.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {ws.notes && <p className="text-sm text-muted mt-2">{ws.notes}</p>}
            {isBoundaryPending(ws) && (
              <p className="text-xs text-amber-700 mt-2">{ws.districtScope.boundaryNote}</p>
            )}
            <p className="text-xs text-caption mt-2">
              Counties: {ws.counties.length ? ws.counties.join(", ") : "all (statewide)"} · Cities:{" "}
              {ws.cities.length ? ws.cities.join(", ") : "—"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/campaigns/${ws.slug}`} className="btn-primary text-xs py-2">
                View dashboard
              </Link>
              <button
                type="button"
                className="btn-secondary text-xs py-2"
                onClick={() => toggleActive(ws.slug, !ws.isActive)}
              >
                {ws.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
