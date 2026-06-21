import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  auditCrowdedCalendarDays,
  buildCalendarDisplayPriorityQaFixtures,
  runCalendarDisplayPrioritySelfTest,
  selectVisibleCalendarEvents,
} from "../lib/calendar/calendarDisplayPriority";
import { analyzeEventCatalog } from "../lib/events/eventDataDiagnostics";
import { getBundledSeedEvents } from "../lib/events/seedCatalog";

export function AdminCalendarPriorityPage() {
  const selfTest = useMemo(() => runCalendarDisplayPrioritySelfTest(), []);
  const qaVisible = useMemo(
    () => selectVisibleCalendarEvents(buildCalendarDisplayPriorityQaFixtures(), 3, "audit"),
    [],
  );

  const crowdedAudit = useMemo(() => {
    const { visible } = analyzeEventCatalog(getBundledSeedEvents());
    return auditCrowdedCalendarDays(visible);
  }, []);

  const bugDays = crowdedAudit.filter((r) => r.hadVisibilityBug);
  const sampleDays = crowdedAudit.slice(0, 40);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-kicker">Admin only</p>
          <h1 className="page-header text-2xl">Calendar display priority</h1>
          <p className="text-muted text-sm mt-1">
            Compact month/week cells — which events earn visible slots before &quot;+ more&quot; (not campaign scoring).
          </p>
        </div>
        <Link to="/admin/data-health" className="btn-ghost text-sm">
          ← Data health
        </Link>
      </div>

      <section className="card-readable mb-6">
        <h2 className="font-semibold text-[var(--text-secondary)] flex items-center gap-2">
          {selfTest.ok ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-700" />
          )}
          QA fixture (crowded test day)
        </h2>
        <p className="text-caption mt-1">
          GOP + Dem + fair + festival + filler — expected visible: Dem → Fair → Festival.
        </p>
        {selfTest.ok ? (
          <ul className="mt-3 text-sm space-y-1">
            {qaVisible.map((e, i) => (
              <li key={e.id}>
                <span className="font-bold text-ark-rust">{i + 1}.</span> {e.title}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-3 text-sm text-red-800 list-disc pl-5">
            {selfTest.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-readable mb-6 grid gap-3 sm:grid-cols-3 text-sm">
        <Stat label="Crowded days (>3 events)" value={String(crowdedAudit.length)} />
        <Stat
          label="Days Dem/fair/festival hidden before fix"
          value={String(bugDays.length)}
          highlight={bugDays.length > 0}
        />
        <Stat label="Self-test" value={selfTest.ok ? "PASS" : "FAIL"} highlight={!selfTest.ok} />
      </section>

      {bugDays.length > 0 && (
        <section className="card-readable mb-6 border-amber-200 bg-amber-50">
          <h2 className="font-semibold text-amber-950">Days where key events were hidden (naive top-3)</h2>
          <p className="text-caption text-amber-900 mt-1">
            These days had Democratic meetings, fairs, or festivals that would not appear in the first three slots
            using chronological sort alone.
          </p>
          <ul className="mt-3 space-y-3 text-sm text-amber-950">
            {bugDays.slice(0, 15).map((row) => (
              <li key={row.date} className="border-b border-amber-200 pb-2">
                <p className="font-semibold">{row.date} · {row.totalEvents} events</p>
                <p className="text-caption">Before: {row.naiveVisibleTitles.join(" · ")}</p>
                <p className="text-caption">After: {row.priorityVisibleTitles.join(" · ")}</p>
                {(row.hiddenDemMeetings.length > 0 || row.hiddenFairs.length > 0 || row.hiddenFestivals.length > 0) && (
                  <p className="text-xs mt-1">
                    Still hidden after fix:{" "}
                    {[...row.hiddenDemMeetings, ...row.hiddenFairs, ...row.hiddenFestivals].join(" · ") || "none"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card-readable">
        <h2 className="font-semibold text-[var(--text-secondary)]">Crowded days — current top 3 visible slots</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-caption border-b border-[var(--border)]">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Top 3 (priority)</th>
                <th className="py-2 pr-3">Naive top 3</th>
              </tr>
            </thead>
            <tbody>
              {sampleDays.map((row) => (
                <tr key={row.date} className="border-b border-[var(--border)] align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{row.date}</td>
                  <td className="py-2 pr-3">{row.totalEvents}</td>
                  <td className="py-2 pr-3">{row.priorityVisibleTitles.join(" · ")}</td>
                  <td className="py-2 pr-3 text-muted">{row.naiveVisibleTitles.join(" · ")}</td>
                </tr>
              ))}
              {sampleDays.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-muted">
                    No crowded days in current catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6">
        <Link to="/calendar/month" className="btn-primary text-sm">
          Open month calendar
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-ark-wheat/30 px-3 py-2">
      <p className="text-caption">{label}</p>
      <p className={highlight ? "text-2xl font-bold text-[var(--text-secondary)]" : "font-medium"}>{value}</p>
    </div>
  );
}
