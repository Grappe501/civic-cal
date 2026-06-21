import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Calendar, MapPin, Shield } from "lucide-react";
import { fetchCampaignWorkspaces, dashboardThemeVars } from "../lib/campaigns/workspaces";
import type { CampaignWorkspace } from "../lib/campaigns/types";
import { isBoundaryPending } from "../lib/campaigns/districtScope";

export function CampaignsLandingPage() {
  const [workspaces, setWorkspaces] = useState<CampaignWorkspace[]>([]);

  useEffect(() => {
    fetchCampaignWorkspaces().then(setWorkspaces).catch(console.error);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-ark-sage">Campaign command centers</p>
      <h1 className="font-display text-3xl font-bold text-ark-pine mt-1">Where should your campaign show up?</h1>
      <p className="mt-3 text-ark-pine/70 max-w-2xl">
        Named workspaces with personalized branding, district scope, event intelligence, and planning —
        without auto-syncing to Google Calendar or Mobilize until you explicitly authorize.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {workspaces.map((ws) => {
          const t = ws.dashboardTheme;
          return (
            <Link
              key={ws.slug}
              to={`/campaigns/${ws.slug}`}
              className="card group overflow-hidden p-0 hover:shadow-lg transition"
              style={dashboardThemeVars(t) as React.CSSProperties}
            >
              <div
                className="p-5 text-white"
                style={{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.accentColor})` }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">{t.badgeLabel}</span>
                    <h2 className="font-display text-xl font-bold mt-2 group-hover:underline">{ws.candidateName}</h2>
                    <p className="text-sm text-white/80 mt-1">{ws.officeSought}</p>
                  </div>
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-xl font-bold text-lg"
                    style={{ backgroundColor: t.surfaceColor, color: t.primaryColor }}
                  >
                    {t.logoInitials}
                  </span>
                </div>
                <p className="text-sm text-white/90 mt-3 italic">&ldquo;{t.heroTagline}&rdquo;</p>
              </div>
              <div className="p-4 flex items-center justify-between text-sm">
                <span className="text-ark-pine/60">{ws.districtName}</span>
                <span className="flex items-center gap-1 font-medium" style={{ color: t.primaryColor }}>
                  Open dashboard <ArrowRight className="h-4 w-4" />
                </span>
              </div>
              {isBoundaryPending(ws) && (
                <p className="px-4 pb-3 text-xs text-amber-700">Boundary GIS pending</p>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { icon: MapPin, title: "District scope", desc: "Statewide live; congressional & senate use placeholder counties until GIS pass." },
          { icon: BarChart3, title: "PO + RD intelligence", desc: "Political opportunity and relationship density on every event." },
          { icon: Calendar, title: "Integrations planned", desc: "Google Calendar & Mobilize disabled until explicit campaign authorization." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card">
            <Icon className="h-6 w-6 text-ark-rust" />
            <h2 className="font-semibold mt-2">{title}</h2>
            <p className="text-sm text-ark-pine/60 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 card bg-ark-wheat/30">
        <Shield className="h-5 w-5 text-ark-pine" />
        <p className="text-sm text-ark-pine/80 mt-2">
          Event plans stored in your browser for now. Database sync and auth coming later. No political preference data stored.
        </p>
        <Link to="/campaigns/demo" className="btn-secondary mt-4 inline-flex text-sm">
          Generic demo workspace
        </Link>
      </section>
    </div>
  );
}
