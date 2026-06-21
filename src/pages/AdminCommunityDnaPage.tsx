import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  allCountyCalendarDnaScores,
  listDiscoveryGuides,
  runCommunityDnaHealth,
} from "../lib/community-dna/communityDnaEngine";

export function AdminCommunityDnaPage() {
  const health = useMemo(() => runCommunityDnaHealth(), []);
  const scores = useMemo(() => allCountyCalendarDnaScores(), []);
  const guides = useMemo(() => listDiscoveryGuides(), []);
  const weakest = scores.slice(0, 20);
  const strongest = [...scores].sort((a, b) => b.total_score - a.total_score).slice(0, 15);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-kicker">Admin only · Pass 38</p>
          <h1 className="page-header text-2xl">Community DNA</h1>
          <p className="text-muted text-sm mt-1">Census + BLS dossiers and Calendar DNA scores — community intelligence only.</p>
        </div>
        <Link to="/admin/data-health" className="btn-ghost text-sm">
          ← Data health
        </Link>
      </div>

      <section className="card-readable grid gap-3 sm:grid-cols-4 text-sm mb-8">
        <Stat label="City DNA profiles" value={String(health.cityCount)} />
        <Stat label="County DNA profiles" value={String(health.countyCount)} />
        <Stat label="Avg calendar DNA score" value={`${health.avgScore}%`} highlight />
        <Stat label="Discovery guides" value={String(health.guideCount)} />
        <Stat label="Thin counties (&lt;45)" value={String(health.thinCounties)} highlight={health.thinCounties > 0} />
        <Stat label="Strong counties (≥70)" value={String(health.strongCounties)} />
      </section>

      <section className="card-readable mb-8">
        <h2 className="font-semibold">Discovery guides (live routes)</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
          {guides.map((g) => (
            <li key={g.id}>
              <Link to={g.path} className="text-ark-rust hover:underline">
                {g.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-readable mb-8">
        <h2 className="font-semibold">Weakest calendar DNA (harvest priority)</h2>
        <div className="mt-4 overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-caption border-b border-[var(--border)]">
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">County</th>
                <th className="py-2 pr-3">Events</th>
                <th className="py-2 pr-3">Thin dimensions</th>
              </tr>
            </thead>
            <tbody>
              {weakest.map((s) => (
                <tr key={s.county} className="border-b border-[var(--border)]">
                  <td className="py-2 pr-3 font-semibold">{s.total_score}%</td>
                  <td className="py-2 pr-3">
                    <Link to={`/${s.county.toLowerCase().replace(/\s+/g, "-")}-county`} className="text-ark-rust hover:underline">
                      {s.county}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{s.public_events}</td>
                  <td className="py-2 pr-3 text-caption">{s.thin_dimensions.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-readable">
        <h2 className="font-semibold">Strongest calendar DNA</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {strongest.map((s) => (
            <li key={s.county}>
              {s.county} County — <strong>{s.total_score}%</strong> · {s.public_events} events
            </li>
          ))}
        </ul>
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
