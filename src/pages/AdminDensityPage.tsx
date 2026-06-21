import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Target } from "lucide-react";
import { fetchEvents } from "../lib/api";
import { buildDensityEngineReport } from "../lib/density/densityReport";
import { countySlugify } from "../lib/profiles/profileLinks";
import type { CivicEvent } from "../lib/types";

export function AdminDensityPage() {
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents({ limit: 2000 })
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const report = useMemo(() => (events.length || !loading ? buildDensityEngineReport(events) : null), [events, loading]);

  if (loading) return <p className="mx-auto max-w-5xl px-4 py-10 text-muted">Computing density…</p>;
  if (!report) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-kicker">Event Density Engine 1.0</p>
          <h1 className="page-header text-2xl">Where to harvest next</h1>
          <p className="text-muted text-sm mt-1">
            Institution-first coverage — goal 5,000+ projected harvest targets, not empty county pages.
          </p>
        </div>
        <Link to="/admin" className="btn-ghost text-sm">← Admin</Link>
      </div>

      <section className="card-readable grid gap-3 sm:grid-cols-3 mb-8 text-sm">
        <Stat label="Projected institution feeds" value={String(report.totalProjectedFutureEvents)} highlight />
        <Stat label="Critical-gap counties" value={String(report.bottomCounties.filter((c) => c.coverageScore < 25).length)} />
        <Stat label="Events loaded" value={String(events.length)} />
      </section>

      <section className="card-readable mb-8">
        <h2 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" /> Lowest coverage counties
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs uppercase text-muted border-b">
                <th className="py-2 pr-4">County</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Events</th>
                <th className="py-2 pr-4">Institutions</th>
                <th className="py-2 pr-4">Projected</th>
                <th className="py-2">Top gap</th>
              </tr>
            </thead>
            <tbody>
              {report.bottomCounties.map((c) => (
                <tr key={c.county} className="border-b border-ark-sage/20">
                  <td className="py-2 pr-4">
                    <Link to={`/${countySlugify(c.county)}-county`} className="text-ark-rust hover:underline font-medium">
                      {c.county}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 font-bold">{c.coverageScore}%</td>
                  <td className="py-2 pr-4">{c.events.total}</td>
                  <td className="py-2 pr-4">{c.institutions.total}</td>
                  <td className="py-2 pr-4">{c.projectedFutureEvents}</td>
                  <td className="py-2 text-xs text-muted">{c.gaps[0]?.message ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-readable mb-8">
        <h2 className="font-semibold flex items-center gap-2">
          <Target className="h-4 w-4" /> Priority gap queue
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {report.topGaps.slice(0, 20).map((g, i) => (
            <li key={`${g.kind}-${i}`} className="border border-ark-sage/20 rounded-lg px-3 py-2">
              <span className={`text-[10px] font-bold uppercase mr-2 ${g.severity === "critical" ? "badge-warning" : "badge-info"}`}>
                {g.severity}
              </span>
              {g.message}
              <p className="text-xs text-muted mt-1">{g.suggestedAction}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-readable text-sm">
        <h2 className="font-semibold mb-2">Harvest commands</h2>
        <pre className="text-xs bg-ark-porch rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
{`npm run discover:sources          # institution feed templates (250 cities)
npm run harvest:top200            # search harvest (needs API key)
npm run harvest:registry          # merge recurring traditions → staged
npm run density:build             # refresh county density JSON
npm run density:project           # institution → staged harvest targets`}
        </pre>
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-lg bg-ark-pine/5 border border-ark-sage px-3 py-2" : ""}>
      <p className="text-xs uppercase font-bold text-muted">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
