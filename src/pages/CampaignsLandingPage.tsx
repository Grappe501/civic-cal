import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Calendar, ExternalLink, HandHeart, MapPin, Shield } from "lucide-react";
import { resolveCampaignColors } from "../lib/campaigns/brandingProfile";
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
      <p className="text-kicker">Campaign command centers</p>
      <h1 className="font-display text-3xl font-bold text-[var(--text-secondary)] mt-1">Where should your campaign show up?</h1>
      <p className="mt-3 text-muted max-w-2xl">
        Named workspaces with personalized branding, district scope, event intelligence, and planning —
        without auto-syncing to Google Calendar or Mobilize until you explicitly authorize.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {workspaces.map((ws) => {
          const t = ws.dashboardTheme;
          const colors = resolveCampaignColors(ws);
          return (
            <Link
              key={ws.slug}
              to={`/campaigns/${ws.slug}`}
              className="card group overflow-hidden p-0 hover:shadow-lg transition"
              style={dashboardThemeVars(t, colors) as React.CSSProperties}
            >
              <div className="panel-brand p-5" style={{ background: colors.heroGradient, color: colors.textOnBrand }}>
                <div className="panel-brand-overlay" aria-hidden />
                <div className="panel-brand-content">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-medium bg-black/20 px-2 py-0.5 rounded-full border border-white/30">{t.badgeLabel}</span>
                      <h2 className="font-display text-xl font-bold mt-2 group-hover:underline">{ws.candidateName}</h2>
                      <p className="text-sm mt-1 opacity-90">{ws.officeSought}</p>
                    </div>
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-xl font-bold text-lg overflow-hidden shrink-0 border-2 border-white/40"
                      style={{ backgroundColor: colors.brandSoft, color: colors.textOnSoft }}
                    >
                      {t.logoUrl ? (
                        <img src={t.logoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        t.logoInitials
                      )}
                    </span>
                  </div>
                  <p className="text-sm mt-3 italic opacity-95">&ldquo;{t.heroTagline}&rdquo;</p>
                </div>
              </div>
              <div className="p-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-muted-soft">{ws.districtName}</span>
                <div className="flex flex-wrap items-center gap-3">
                  {ws.campaignWebsiteUrl && (
                    <a
                      href={ws.campaignWebsiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-muted hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Campaign site <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {ws.defaultVolunteerSignupUrl && (
                    <a
                      href={ws.defaultVolunteerSignupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[var(--text-secondary)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HandHeart className="h-3.5 w-3.5" /> Volunteer
                    </a>
                  )}
                  <span className="flex items-center gap-1 font-semibold text-[var(--text-secondary)]">
                    Open dashboard <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
              {isBoundaryPending(ws) && (
                <p className="px-4 pb-3 text-xs text-amber-800 font-medium">Boundary GIS pending</p>
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
          <div key={title} className="card-readable">
            <Icon className="h-6 w-6 text-ark-rust" />
            <h2 className="font-semibold mt-2 text-[var(--text-secondary)]">{title}</h2>
            <p className="text-sm text-muted-soft mt-1">{desc}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 card-readable bg-ark-wheat/40">
        <Shield className="h-5 w-5 text-[var(--text-secondary)]" />
        <p className="text-sm text-muted mt-2">
          Event plans stored in your browser for now. Database sync and auth coming later. No political preference data stored.
        </p>
        <Link to="/campaigns/demo" className="btn-secondary mt-4 inline-flex text-sm">
          Generic demo workspace
        </Link>
      </section>
    </div>
  );
}
