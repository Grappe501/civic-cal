import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Database, RefreshCw } from "lucide-react";
import { runEventDataDiagnostics, type EventDataDiagnostics } from "../lib/events/eventDataDiagnostics";
import { runProfileHealth } from "../lib/profiles/profileHealth";
import { runPartyMeetingHealth } from "../lib/party-meetings/partyMeetingHealth";
import { runSchoolHarvestHealth } from "../lib/schools/schoolHarvestHealth";
import { runCountyFairHealth } from "../lib/fairs/countyFairHealth";
import { runHistoricPoliticalHealth } from "../lib/political-events/historicPoliticalEvents";
import { loadFeedAttachmentReport } from "../lib/feeds/feedAttachmentReport";
import { formatEventRange } from "../lib/format";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

export function AdminDataHealthPage() {
  const [diag, setDiag] = useState<EventDataDiagnostics | null>(null);
  const [server, setServer] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const profileHealth = useMemo(() => runProfileHealth(), []);
  const partyHealth = useMemo(() => runPartyMeetingHealth(), []);
  const schoolHealth = useMemo(() => runSchoolHarvestHealth(), []);
  const countyFairHealth = useMemo(() => runCountyFairHealth(), []);
  const politicalHealth = useMemo(() => runHistoricPoliticalHealth(), []);
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
            <h2 className="font-semibold text-[var(--text-secondary)]">Election calendar horizon</h2>
            <p className="text-caption mt-1">
              Public calendar shows events through {diag.electionCalendarLastDay}. Post-election events compile but stay
              hidden until September release ({diag.postElectionReleaseActive ? "release active" : "hold active"}).
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
              <Stat label="Held post-election" value={String(diag.postElectionHeldCount)} highlight={diag.postElectionHeldCount > 0} />
              <Stat label="Last public day" value={diag.electionCalendarLastDay} />
              <Stat label="Counties w/ events in window" value={String(diag.countyHorizonSummary.filter((c) => c.visibleWindow > 0).length)} />
            </div>
            <div className="mt-4 overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-caption border-b border-[var(--border)]">
                    <th className="py-1 pr-2">County</th>
                    <th className="py-1 pr-2">Now → Nov 3</th>
                    <th className="py-1 pr-2">Held after</th>
                    <th className="py-1 pr-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {diag.countyHorizonSummary.map((row) => (
                    <tr key={row.county} className="border-b border-[var(--border)]">
                      <td className="py-1 pr-2">{row.county}</td>
                      <td className="py-1 pr-2 font-semibold">{row.visibleWindow}</td>
                      <td className="py-1 pr-2">{row.heldPostElection}</td>
                      <td className="py-1 pr-2 text-muted">{row.totalApproved}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card-readable">
            <h2 className="font-semibold text-[var(--text-secondary)]">Calendar display priority</h2>
            <p className="text-caption mt-1">
              Compact month/week cells — Dem meetings, fairs, and festivals visible before &quot;+ more&quot;.
            </p>
            <Link to="/admin/calendar-priority" className="btn-secondary text-xs mt-4 inline-flex">
              Open calendar priority audit →
            </Link>
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
            <h2 className="font-semibold text-[var(--text-secondary)]">School calendar harvest (Pass 27)</h2>
            <p className="text-caption mt-1">328 high schools + 18 colleges → URLs → staged → approved.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
              <Stat label="HS discovered" value={String(schoolHealth.funnel.highSchoolsDiscovered)} />
              <Stat label="HS calendar URLs" value={`${schoolHealth.funnel.highSchoolsCalendarUrl} / ${schoolHealth.funnel.highSchoolsDiscovered}`} highlight />
              <Stat label="HS athletics URLs" value={`${schoolHealth.funnel.highSchoolsAthleticsUrl} / ${schoolHealth.funnel.highSchoolsDiscovered}`} />
              <Stat label="Staged school events" value={String(schoolHealth.funnel.stagedSchoolEvents)} highlight />
              <Stat label="Approved public" value={String(schoolHealth.funnel.approvedPublicEvents)} />
              <Stat label="Colleges w/ calendar" value={`${schoolHealth.funnel.collegesCalendarUrl} / ${schoolHealth.funnel.collegesDiscovered}`} />
            </div>
            <Link to="/admin/school-calendars" className="btn-secondary text-xs mt-4 inline-flex">
              School calendar funnel →
            </Link>
          </section>

          <section className="card-readable">
            <h2 className="font-semibold text-[var(--text-secondary)]">County fair lane (Pass 29)</h2>
            <p className="text-caption mt-1">75 county fair profiles — publish calendar events only when dates are source-backed.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
              <Stat label="County fair registry" value={String(countyFairHealth.countyRegistryCount)} highlight />
              <Stat label="Verified 2026 dated" value={String(countyFairHealth.verifiedDatedCount)} highlight />
              <Stat label="Needs date confirmation" value={String(countyFairHealth.needsConfirmationCount)} />
              <Stat label="Approved public fairs" value={String(countyFairHealth.approvedPublicCount)} />
              <Stat label="Research tasks open" value={String(countyFairHealth.researchTaskCount)} />
              <Stat label="Regional fairs tracked" value={String(countyFairHealth.regionalFairCount)} />
              <Stat label="Arkansas State Fair" value={countyFairHealth.stateFairStatus} />
            </div>
          </section>

          <section className="card-readable">
            <h2 className="font-semibold text-[var(--text-secondary)]">Historic political events (Pass 30)</h2>
            <p className="text-caption mt-1">Recurring civic-political dinners and forums — candidate-relevant intelligence with source-backed history.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
              <Stat label="Registry traditions" value={String(politicalHealth.registryCount)} highlight />
              <Stat label="History dossiers" value={String(politicalHealth.historyDossierCount)} />
              <Stat label="Verified 2026 dates" value={String(politicalHealth.verified2026Count)} highlight />
              <Stat label="Approved public events" value={String(politicalHealth.approvedPublicCount)} />
              <Stat label="Staged / needs review" value={String(politicalHealth.stagedCount)} />
              <Stat label="Research tasks open" value={String(politicalHealth.researchTaskCount)} />
            </div>
            <Link to="/civic-political-events" className="btn-secondary text-xs mt-4 inline-flex">
              Open civic-political directory →
            </Link>
          </section>

          <section className="card-readable">
            <h2 className="font-semibold text-[var(--text-secondary)]">Feed attachment (Pass 23A)</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
              <Stat label="Known institutions" value={String(feedReport.metrics.knownInstitutions)} />
              <Stat label="Feed slots" value={String(feedReport.metrics.feedSlotsTotal)} />
              <Stat label="Feeds attached" value={String(feedReport.metrics.feedsAttached)} highlight />
              <Stat label="Attachment goal" value={`${feedReport.metrics.feedsAttached} / ${feedReport.metrics.attachmentGoal ?? 1500}`} highlight />
              <Stat label="Goal progress" value={`${feedReport.metrics.attachmentGoalProgress ?? 0}%`} />
              <Stat label="Attached projected yield" value={String(feedReport.metrics.attachedProjectedYield)} />
              <Stat label="Potential projected yield" value={String(Math.round(feedReport.metrics.potentialProjectedYield))} />
            </div>
            <Link to="/admin/feeds" className="btn-secondary text-xs mt-4 inline-flex">
              Open feed coverage dashboard →
            </Link>
            <Link to="/admin/ai-brain" className="btn-secondary text-xs mt-4 ml-2 inline-flex">
              AI Brain console →
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
