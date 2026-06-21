import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Copy, ExternalLink, QrCode } from "lucide-react";
import { fetchEvents } from "../lib/api";
import { getWorkspaceBySlug } from "../lib/campaigns/workspaces";
import { loadPlansForCampaign } from "../lib/campaigns/planStore";
import { formatEventRange } from "../lib/format";
import { PageMeta } from "../components/seo/PageMeta";
import type { CivicEvent } from "../lib/types";
import type { CampaignEventPlan } from "../lib/campaigns/types";

function isPublicPlan(plan: CampaignEventPlan): boolean {
  return (
    plan.publicPresenceStatus === "public" ||
    plan.showCandidateAttending ||
    plan.showVolunteersNeeded ||
    plan.showSurrogateAttending ||
    Boolean(plan.publicNote || plan.volunteerPublicNote)
  );
}

export function CampaignPublicCalendarPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const workspace = getWorkspaceBySlug(slug);
  const [copied, setCopied] = useState(false);
  const [events, setEvents] = useState<CivicEvent[]>([]);

  const plans = useMemo(() => (slug ? loadPlansForCampaign(slug) : {}), [slug]);

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/campaigns/${slug}/public-calendar` : "";

  useEffect(() => {
    fetchEvents({ limit: 800 })
      .then(setEvents)
      .catch(console.error);
  }, []);

  if (!workspace) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>Campaign not found.</p>
        <Link to="/campaigns" className="btn-primary mt-4 inline-flex">
          All campaigns
        </Link>
      </div>
    );
  }

  const publicEvents = events
    .filter((e) => {
      const plan = plans[e.id];
      return plan && isPublicPlan(plan) && plan.planStatus !== "skip";
    })
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageMeta
        title={`${workspace.candidateName} — public campaign calendar`}
        description={`Public events ${workspace.candidateName} plans to attend or staff.`}
        canonicalPath={`/campaigns/${slug}/public-calendar`}
      />
      <Link to={`/campaigns/${slug}`} className="text-sm text-ark-sage hover:underline">
        ← {workspace.dashboardLabel}
      </Link>
      <h1 className="page-header mt-4">Public campaign calendar</h1>
      <p className="text-muted text-sm mt-2">
        Events {workspace.candidateName} has added to their campaign calendar with public presence enabled.
        Main Arkansas Everywhere calendar includes all source-backed community events — this is your curated sub-calendar.
      </p>

      <div className="card-readable mt-6 flex flex-col sm:flex-row gap-6 items-start">
        <div className="flex-1">
          <p className="text-kicker mb-2">Share link</p>
          <code className="text-xs break-all block bg-surface-muted p-2 rounded">{publicUrl}</code>
          <button type="button" className="btn-primary text-sm mt-3" onClick={copyLink}>
            <Copy className="h-4 w-4" /> {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <div className="text-center">
          <p className="text-kicker mb-2 flex items-center justify-center gap-1">
            <QrCode className="h-4 w-4" /> QR code
          </p>
          <img src={qrUrl} alt="QR code for public campaign calendar" className="rounded border mx-auto" width={160} height={160} />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5" /> {publicEvents.length} public events
        </h2>
        {publicEvents.length === 0 ? (
          <p className="text-sm text-muted mt-4">
            No public campaign events yet. On your dashboard, click &quot;Add to my campaign calendar&quot; and enable public presence.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {publicEvents.map((e) => {
              const plan = plans[e.id];
              return (
                <li key={e.id} className="card py-3">
                  <Link to={`/event/${e.slug}`} className="font-medium text-ark-pine hover:underline">
                    {e.title}
                  </Link>
                  <p className="text-xs text-muted mt-1">
                    {formatEventRange(e)} · {e.city}, {e.county} County
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    {plan.candidateAttending && <span className="badge-success">Candidate attending</span>}
                    {plan.surrogateAttending && <span className="badge-info">Surrogate</span>}
                    {plan.needsVolunteers && <span className="badge-warning">Volunteers needed</span>}
                  </div>
                  {plan.publicNote && <p className="text-sm mt-2">{plan.publicNote}</p>}
                  {plan.volunteerSignupUrl && (
                    <a href={plan.volunteerSignupUrl} target="_blank" rel="noreferrer" className="link-inline text-xs mt-2 inline-flex items-center gap-1">
                      Volunteer signup <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
