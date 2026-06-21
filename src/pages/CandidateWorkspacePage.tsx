import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { BetaPasswordGate } from "../components/auth/BetaPasswordGate";
import { getCandidateBySlug } from "../lib/candidates/registry";
import { fetchCampaignWorkspaceBySlug } from "../lib/campaigns/workspaces";
import { useEffect, useState } from "react";
import type { CampaignWorkspace } from "../lib/campaigns/types";
import { CampaignDashboard } from "../components/campaigns/CampaignDashboard";

export function CandidateWorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  const candidate = slug ? getCandidateBySlug(slug) : undefined;
  const [workspace, setWorkspace] = useState<CampaignWorkspace | null>(null);

  useEffect(() => {
    const dashSlug = candidate?.dashboard_slug ?? slug;
    if (!dashSlug) return;
    fetchCampaignWorkspaceBySlug(dashSlug).then(setWorkspace);
  }, [candidate, slug]);

  const displayName = candidate?.name ?? workspace?.candidateName ?? slug;

  const meta = useMemo(
    () =>
      candidate
        ? [
            { label: "Office", value: candidate.office },
            { label: "Party", value: candidate.party ?? "Nonpartisan" },
            { label: "Race type", value: candidate.race_type },
            { label: "District", value: candidate.district ?? "—" },
            { label: "County", value: candidate.county ?? "—" },
            { label: "Filing status", value: candidate.filing_status },
            { label: "Verification", value: candidate.verification_status },
          ]
        : [],
    [candidate],
  );

  if (!candidate && !workspace) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>Candidate not found in public registry.</p>
        <Link to="/campaigns" className="btn-primary mt-4 inline-flex">Campaign index</Link>
      </div>
    );
  }

  const dashboardSlug = candidate?.dashboard_slug ?? workspace?.slug ?? slug;

  return (
    <BetaPasswordGate title={`${displayName} — candidate workspace`}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link to="/admin/candidates" className="text-sm text-muted hover:underline">
          ← Candidate registry
        </Link>

        <header className="mt-4 mb-8">
          <p className="text-kicker">Public candidate profile · neutral listing</p>
          <h1 className="page-header text-3xl">{displayName}</h1>
          <p className="text-muted">{candidate?.office ?? workspace?.officeSought}</p>
        </header>

        {candidate && (
          <section className="card-readable mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            {meta.map((m) => (
              <div key={m.label}>
                <p className="text-xs uppercase font-bold text-muted">{m.label}</p>
                <p>{m.value}</p>
              </div>
            ))}
            {candidate.public_contact && (
              <div className="sm:col-span-2">
                <p className="text-xs uppercase font-bold text-muted">Public contact</p>
                <p>{candidate.public_contact}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 sm:col-span-3">
              {candidate.website && (
                <a href={candidate.website} target="_blank" rel="noreferrer" className="btn-secondary text-sm inline-flex items-center gap-1">
                  <ExternalLink className="h-4 w-4" /> Campaign site
                </a>
              )}
              <a href={candidate.source_url} target="_blank" rel="noreferrer" className="btn-secondary text-sm inline-flex items-center gap-1">
                <ExternalLink className="h-4 w-4" /> Source: Arkansas SOS filings
              </a>
              {dashboardSlug && (
                <Link to={`/campaigns/${dashboardSlug}`} className="btn-primary text-sm">
                  Open command dashboard →
                </Link>
              )}
            </div>
          </section>
        )}

        {workspace && (
          <section>
            <h2 className="font-semibold text-lg mb-4">Campaign command dashboard</h2>
            <CampaignDashboard workspace={workspace} />
          </section>
        )}
      </div>
    </BetaPasswordGate>
  );
}
