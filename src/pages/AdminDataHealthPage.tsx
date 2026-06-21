import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Database, RefreshCw } from "lucide-react";
import { runEventDataDiagnostics, type EventDataDiagnostics } from "../lib/events/eventDataDiagnostics";
import { runProfileHealth } from "../lib/profiles/profileHealth";
import { runPartyMeetingHealth } from "../lib/party-meetings/partyMeetingHealth";
import { loadFeedAttachmentReport } from "../lib/feeds/feedAttachmentReport";
import { formatEventRange } from "../lib/format";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

export function AdminDataHealthPage() {
  const [diag, setDiag] = useState<EventDataDiagnostics | null>(null);
  const [server, setServer] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const profileHealth = useMemo(() => runProfileHealth(), []);
  const partyHealth = useMemo(() => runPartyMeetingHealth(), []);
  const feedReport = useMemo(() => loadFeedAttachmentReport(), []);

  async function refresh() {
    setLoading(true);
    try {
      const [d, res] = await Promise.all([
        runEventDataDiagnostics(),
        fetch(`${fnBase}/events-health`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      setDiag(d);
      setServer(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const modeBanner =
    diag?.dataMode === "live-db"
      ? { label: "Live DB mode", className: "badge-success" }
      : diag?.dataMode === "seed-demo"
        ? { label: "Seed / demo mode", className: "badge-warning" }
        : diag?.dataMode === "empty"
          ? { label: "No visible data", className: "badge-danger" }
          : { label: "Mixed / checking", className: "badge-info" };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-kicker">Admin only</p>
          <h1 className="page-header text-2xl">Data health</h1>
          <p className="text-muted text-sm mt-1">Why the public calendar has (or lacks) events.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary text-sm" onClick={refresh} disabled={loading}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <Link to="/admin" className="btn-ghost text-sm">
            ← Admin
          </Link>
        </div>
      </div>

      {diag && (
        <div className={`inline-flex items-center gap-2 mb-4 ${modeBanner.className} text-sm px-3 py-1.5 rounded-full`}>
          {diag.dataMode === "empty" ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {modeBanner.label}
        </div>
      )}

      {loading && <p className="text-muted">Running diagnostics…</p>}

      {diag && !loading && (
        <div className="space-y-6">
          <section className="card-readable grid gap-3 sm:grid-cols-2 text-sm">
            <Stat label="Visible events" value={String(diag.visibleEventsCount)} highlight />
            <Stat label="Current source" value={diag.currentSource} />
            <Stat label="Main seed count" value={String(diag.seedEventsCount)} />
            <Stat label="Demo seed count" value={String(diag.demoSeedEventsCount)} />
            <Stat label="Bundled seed" value={String(diag.bundledSeedCount)} />
            <Stat label="API events (raw)" value={diag.apiEventsCount == null ? "n/a" : String(diag.apiEventsCount)} />
            <Stat label="API source tag" value={diag.rawApiSource ?? "n/a"} />
            <Stat label="Past/archived hidden" value={String(diag.archivedOrPastHiddenCount)} />
            <Stat label="Unapproved hidden" value={String(diag.pendingOrUnapprovedHiddenCount)} />
            <Stat label="Missing dates" value={String(diag.missingDateCount)} />
            <Stat label="Missing slugs" value={String(diag.missingSlugCount)} />
            <Stat label="VITE_USE_SEED" value={String(diag.viteUseSeed)} />
            <Stat label="API reachable" value={String(diag.apiReachable)} />
          </section>

          <section className="card-readable">
            <h2 className="font-semibold text-[var(--text-secondary)]">Community profile graph</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
              <Stat label="Total profiles" value={String(profileHealth.totalProfiles)} />
              <Stat label="Stale profiles" value={String(profileHealth.staleCount)} highlight={profileHealth.staleCount > 0} />
              <Stat label="Low confidence" value={String(profileHealth.lowConfidenceCount)} />
              <Stat label="Missing sources" value={String(profileHealth.missingSourceCount)} />
              <Stat label="Refresh needed" value={String(profileHealth.refreshNeededCount)} />
            </div>
            <Link to="/admin/density" className="btn-secondary text-xs mt-4 inline-flex">
              Open density engine →
            </Link>
            <Link to="/admin" className="btn-ghost text-xs mt-4 ml-2 inline-flex" onClick={() => sessionStorage.setItem("civic-admin-tab", "profile_refresh")}>
              Profile refresh queue →
            </Link>
          </section>

          <section className="card-readable">
            <h2 className="font-semibold text-[var(--text-secondary)]">Public party meeting lane</h2>
            <p className="text-caption mt-1">Neutral civic-meetings coverage — admin approval required before publish.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
              <Stat label="Party sources found" value={String(partyHealth.sourcesFound)} />
              <Stat label="Staged party meetings" value={String(partyHealth.stagedMeetings)} highlight />
              <Stat label="Approved party meetings" value={String(partyHealth.approvedMeetings)} />
              <Stat label="Counties with party data" value={String(partyHealth.countiesWithData)} />
              <Stat label="Recurrence needs review" value={String(partyHealth.recurrenceNeedsReview)} highlight={partyHealth.recurrenceNeedsReview > 0} />
              <Stat label="Avg recurrence confidence" value={`${partyHealth.avgRecurrenceConfidence}%`} />
              <Stat label="Republican staged" value={String(partyHealth.partyCounts.Republican ?? 0)} />
              <Stat label="Democratic staged" value={String(partyHealth.partyCounts.Democratic ?? 0)} />
              <Stat label="Libertarian staged" value={String(partyHealth.partyCounts.Libertarian ?? 0)} />
            </div>
            <Link to="/admin" className="btn-secondary text-xs mt-4 inline-flex" onClick={() => sessionStorage.setItem("civic-admin-tab", "event_coverage")}>
              Review party meetings →
            </Link>
          </section>

          <section className="card-readable">
            <h2 className="font-semibold text-[var(--text-secondary)]">Feed attachment (Pass 23A)</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
              <Stat label="Known institutions" value={String(feedReport.metrics.knownInstitutions)} />
              <Stat label="Feed slots" value={String(feedReport.metrics.feedSlotsTotal)} />
              <Stat label="Feeds attached" value={String(feedReport.metrics.feedsAttached)} highlight />
              <Stat label="Coverage" value={`${feedReport.metrics.coveragePercent}%`} highlight />
              <Stat label="Attached projected yield" value={String(feedReport.metrics.attachedProjectedYield)} />
              <Stat label="Potential projected yield" value={String(Math.round(feedReport.metrics.potentialProjectedYield))} />
            </div>
            <Link to="/admin/feeds" className="btn-secondary text-xs mt-4 inline-flex">
              Open feed coverage dashboard →
            </Link>
          </section>

          {server && (
            <section className="card-readable text-sm">
              <h2 className="font-semibold flex items-center gap-2 text-[var(--text-secondary)]">
                <Database className="h-4 w-4" /> Server-side (Netlify function)
              </h2>
              <pre className="mt-2 text-xs bg-ark-porch rounded-lg p-3 overflow-x-auto text-[var(--text-primary)]">
                {JSON.stringify(server, null, 2)}
              </pre>
            </section>
          )}

          {diag.whyPublicCalendarEmpty.length > 0 && (
            <section className="card-readable border-amber-200 bg-amber-50">
              <h2 className="font-semibold text-amber-950">Why calendar may be empty</h2>
              <ul className="mt-2 list-disc pl-5 text-sm text-amber-950 space-y-1">
                {diag.whyPublicCalendarEmpty.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </section>
          )}

          <EventList title="First 20 visible events" events={diag.visibleSamples} />
          <HiddenList samples={diag.hiddenSamples} />

          <div className="flex flex-wrap gap-2">
            <Link to="/calendar/month" className="btn-primary text-sm">
              Open month calendar
            </Link>
            {diag.visibleSamples[0] && (
              <Link to={`/event/${diag.visibleSamples[0].slug}`} className="btn-secondary text-sm">
                First visible event
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-ark-wheat/30 px-3 py-2">
      <p className="text-caption">{label}</p>
      <p className={highlight ? "text-2xl font-bold text-[var(--text-secondary)]" : "font-medium text-[var(--text-primary)]"}>
        {value}
      </p>
    </div>
  );
}

function EventList({ title, events }: { title: string; events: EventDataDiagnostics["visibleSamples"] }) {
  return (
    <section className="card-readable">
      <h2 className="font-semibold text-[var(--text-secondary)]">{title}</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {events.map((e) => (
          <li key={e.id} className="border-b border-[var(--border)] pb-2">
            <Link to={`/event/${e.slug}`} className="font-medium text-ark-rust hover:underline">
              {e.title}
            </Link>
            <p className="text-caption">{formatEventRange(e)} · {e.county} County</p>
          </li>
        ))}
        {events.length === 0 && <li className="text-muted">None</li>}
      </ul>
    </section>
  );
}

function HiddenList({ samples }: { samples: EventDataDiagnostics["hiddenSamples"] }) {
  return (
    <section className="card-readable">
      <h2 className="font-semibold text-[var(--text-secondary)]">First 20 hidden events (with reason)</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {samples.map(({ event, reason, detail }) => (
          <li key={event.id} className="border-b border-[var(--border)] pb-2">
            <span className="font-medium">{event.title || event.id}</span>
            <span className="badge-warning text-[10px] ml-2">{reason}</span>
            <p className="text-caption">{detail}</p>
          </li>
        ))}
        {samples.length === 0 && <li className="text-muted">None in sample</li>}
      </ul>
    </section>
  );
}
