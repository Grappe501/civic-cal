import { useMemo } from "react";
import { Link } from "react-router-dom";
import { scoreAllPublicEventPages, eventPageQualitySummary } from "../lib/events/eventPageQuality";

export function AdminEventPageQualityPage() {
  const scores = useMemo(() => scoreAllPublicEventPages(), []);
  const summary = useMemo(() => eventPageQualitySummary(scores), [scores]);
  const weakest = scores.slice(0, 100);
  const highPriorityThin = scores.filter(
    (s) =>
      s.band === "thin" &&
      (s.publicPriority === "Essential local tradition" ||
        s.publicPriority === "Major community gathering" ||
        s.publicPriority === "Civic meeting"),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-kicker">Admin only · Pass 35</p>
          <h1 className="page-header text-2xl">Event page quality</h1>
          <p className="text-muted text-sm mt-1">Public intelligence completeness — not campaign scores.</p>
        </div>
        <Link to="/admin/data-health" className="btn-ghost text-sm">
          ← Data health
        </Link>
      </div>

      <section className="card-readable grid gap-3 sm:grid-cols-4 text-sm mb-8">
        <Stat label="Public event pages" value={String(summary.total)} />
        <Stat label="Thin pages (&lt;45%)" value={String(summary.thin)} highlight />
        <Stat label="High-priority thin" value={String(summary.highPriorityThin)} highlight={summary.highPriorityThin > 0} />
        <Stat label="Strong pages (≥70%)" value={String(summary.strong)} />
      </section>

      {highPriorityThin.length > 0 && (
        <section className="card-readable mb-8 border-amber-200 bg-amber-50">
          <h2 className="font-semibold text-amber-950">High-priority events needing enrichment</h2>
          <ul className="mt-3 space-y-2 text-sm text-amber-950">
            {highPriorityThin.slice(0, 15).map((s) => (
              <li key={s.slug}>
                <Link to={`/event/${s.slug}`} className="text-ark-rust hover:underline font-medium">
                  {s.title}
                </Link>
                <span className="text-caption ml-2">
                  {s.percent}% · {s.publicPriority} · missing: {s.missing.slice(0, 3).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card-readable">
        <h2 className="font-semibold text-[var(--text-secondary)]">Weakest 100 event pages</h2>
        <div className="mt-4 overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-white">
              <tr className="text-caption border-b border-[var(--border)]">
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Priority</th>
                <th className="py-2 pr-3">Event</th>
                <th className="py-2 pr-3">County</th>
                <th className="py-2 pr-3">Missing</th>
              </tr>
            </thead>
            <tbody>
              {weakest.map((s) => (
                <tr key={s.slug} className="border-b border-[var(--border)] align-top">
                  <td className="py-2 pr-3 font-semibold">{s.percent}%</td>
                  <td className="py-2 pr-3 text-xs">{s.publicPriority}</td>
                  <td className="py-2 pr-3">
                    <Link to={`/event/${s.slug}`} className="text-ark-rust hover:underline">
                      {s.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{s.county}</td>
                  <td className="py-2 pr-3 text-caption">{s.missing.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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
