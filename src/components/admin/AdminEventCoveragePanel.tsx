import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEvents } from "../../lib/api";
import { buildAllLaneCoverage } from "../../lib/event-lanes/laneCoverageEngine";
import { planNextLaneHarvest } from "../../lib/event-lanes/laneHarvestPlan";
import { listLanes, phase1LaneIds } from "../../lib/event-lanes/laneRegistry";
import { countySlugify } from "../../lib/profiles/profileLinks";
import type { CivicEvent } from "../../lib/types";

export function AdminEventCoveragePanel() {
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents({ limit: 2000 })
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const { counties } = useMemo(() => buildAllLaneCoverage(events), [events]);
  const plan = useMemo(() => planNextLaneHarvest(counties, 25), [counties]);
  const phase1 = phase1LaneIds();

  if (loading) return <p className="text-muted">Loading lane coverage…</p>;

  const avgOverall = Math.round(counties.reduce((s, c) => s + c.overallCoverage, 0) / Math.max(1, counties.length));
  const avgPhase1 = Math.round(counties.reduce((s, c) => s + c.phase1Coverage, 0) / Math.max(1, counties.length));

  return (
    <div className="space-y-6">
      <section className="card-readable grid gap-3 sm:grid-cols-3 text-sm">
        <Stat label="Counties tracked" value={String(counties.length)} />
        <Stat label="Avg overall coverage" value={`${avgOverall}%`} highlight={avgOverall < 50} />
        <Stat label="Avg Phase 1 coverage" value={`${avgPhase1}%`} highlight={avgPhase1 < 40} />
      </section>

      <section className="card-readable">
        <h2 className="font-semibold">20-lane framework (Phase 1 first)</h2>
        <ol className="mt-3 grid gap-1 sm:grid-cols-2 text-xs text-muted">
          {listLanes().map((l) => (
            <li key={l.id} className={phase1.includes(l.id) ? "font-medium text-[var(--text-primary)]" : ""}>
              {l.number}. {l.name}
              {phase1.includes(l.id) && <span className="badge-info ml-1 text-[9px]">P1</span>}
            </li>
          ))}
        </ol>
      </section>

      <section className="card-readable overflow-x-auto">
        <h2 className="font-semibold mb-3">Lowest coverage counties</h2>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-xs uppercase text-muted border-b">
              <th className="py-2 pr-3">County</th>
              <th className="py-2 pr-3">Overall</th>
              <th className="py-2 pr-3">Phase 1</th>
              <th className="py-2 pr-3">Gov</th>
              <th className="py-2 pr-3">Schools</th>
              <th className="py-2 pr-3">Churches</th>
              <th className="py-2 pr-3">Extension</th>
              <th className="py-2 pr-3">VFD</th>
              <th className="py-2">Festivals</th>
            </tr>
          </thead>
          <tbody>
            {[...counties].sort((a, b) => a.overallCoverage - b.overallCoverage).slice(0, 15).map((c) => {
              const lane = (id: string) => c.lanes.find((l) => l.laneId === id)?.coveragePercent ?? 0;
              return (
                <tr key={c.county} className="border-b border-ark-sage/20">
                  <td className="py-2 pr-3">
                    <Link to={`/${countySlugify(c.county)}-county`} className="text-ark-rust hover:underline font-medium">
                      {c.county}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 font-bold">{c.overallCoverage}%</td>
                  <td className="py-2 pr-3">{c.phase1Coverage}%</td>
                  <td className="py-2 pr-3">{lane("government_civic")}%</td>
                  <td className="py-2 pr-3">{lane("schools")}%</td>
                  <td className="py-2 pr-3">{lane("churches")}%</td>
                  <td className="py-2 pr-3">{lane("community_anchors")}%</td>
                  <td className="py-2 pr-3">{lane("vfds")}%</td>
                  <td className="py-2">{lane("festivals")}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card-readable">
        <h2 className="font-semibold">Next lane harvest queue</h2>
        <p className="text-xs text-muted mt-1">Phase 1 order: Government → Schools → Churches → Extension → VFD → Festivals</p>
        <ul className="mt-3 space-y-2 text-sm">
          {plan.map((p) => (
            <li key={`${p.county}-${p.laneId}`} className="border border-ark-sage/25 rounded-lg px-3 py-2">
              <span className="font-medium">{p.county} County</span> — {p.laneName}{" "}
              <span className="badge-warning text-[10px]">{p.coveragePercent}%</span>
              <p className="text-xs text-muted mt-1">{p.reason}</p>
              <p className="text-[10px] text-muted font-mono mt-1">{p.suggestedCommands.join(" · ")}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-readable text-sm">
        <h2 className="font-semibold mb-2">Coverage scripts</h2>
        <pre className="text-xs bg-ark-porch rounded-lg p-3 whitespace-pre-wrap">
{`npm run lanes:generate    # refresh county + city lane JSON
npm run lanes:plan        # next harvest tasks JSON
npm run discover:sources  # Lane 1 government feed templates`}
        </pre>
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2" : ""}>
      <p className="text-xs uppercase font-bold text-muted">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
