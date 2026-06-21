import { useMemo } from "react";
import { Link } from "react-router-dom";
import { runSchoolHarvestHealth } from "../lib/schools/schoolHarvestHealth";
import parsedBundle from "../../data/ingestion/school-events-parsed-dated.json";
import approvedBundle from "../../data/ingestion/school-events-approved-events.json";

type DatedEvent = {
  title: string;
  event_date: string;
  source_name?: string;
  source_url?: string;
  confidence_score?: number;
  platform?: string;
  review_status?: string;
};

export function AdminSchoolCalendarPage() {
  const health = useMemo(() => runSchoolHarvestHealth(), []);
  const approvedCount = (approvedBundle as { events?: unknown[] }).events?.length ?? health.funnel.approvedPublicEvents;
  const f = health.funnel;
  const datedSample = ((parsedBundle as { events?: DatedEvent[] }).events ?? []).slice(0, 25);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <div>
          <p className="text-kicker">Pass 28 — School Platform Parser Upgrade</p>
          <h1 className="page-header text-2xl">School & college event funnel</h1>
          <p className="text-muted text-sm mt-1">
            Targets → platform parse → dated review queue → manual approval only.
          </p>
        </div>
        <Link to="/admin" className="btn-ghost text-sm">← Admin</Link>
      </div>

      <section className="card-readable mb-8">
        <h2 className="font-semibold mb-4">Harvest funnel</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <FunnelStep label="HS discovered" value={f.highSchoolsDiscovered} />
          <span className="text-muted">→</span>
          <FunnelStep label="Calendar URL" value={f.highSchoolsCalendarUrl} />
          <span className="text-muted">→</span>
          <FunnelStep label="Projection targets" value={f.projectionTargets ?? 0} />
          <span className="text-muted">→</span>
          <FunnelStep label="Dated parsed" value={f.datedParsedEvents ?? 0} highlight />
          <span className="text-muted">→</span>
          <FunnelStep label="Approved" value={approvedCount} highlight />
        </div>
        {f.pass28TargetMet === false && (
          <p className="text-xs text-amber-800 mt-3">Pass 28 target: 150+ dated parsed events (currently {f.datedParsedEvents ?? 0}).</p>
        )}
      </section>

      <section className="card-readable grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8 text-sm">
        <Stat label="Dated parsed" value={String(f.datedParsedEvents ?? 0)} highlight />
        <Stat label="Pending dated review" value={String(f.datedPendingReview ?? 0)} />
        <Stat label="Projection targets" value={String(f.projectionTargets ?? 0)} />
        <Stat label="Approved / public" value={String(approvedCount)} />
      </section>

      {Object.keys(health.platformCounts ?? {}).length > 0 && (
        <section className="card-readable mb-8">
          <h2 className="font-semibold mb-3">Platform parse hits</h2>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            {Object.entries(health.platformCounts ?? {}).map(([p, n]) => (
              <div key={p} className="flex justify-between border-b border-ark-sage/20 py-1.5">
                <span className="text-muted">{p.replace(/_/g, " ")}</span>
                <span className="font-medium">{n}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card-readable mb-8 overflow-x-auto">
        <h2 className="font-semibold mb-3">Dated events — review lane (sample)</h2>
        <p className="text-xs text-muted mb-3">Requires title, date, source, URL, confidence ≥ 50 before approval.</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted border-b">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Title</th>
              <th className="py-2 pr-3">Platform</th>
              <th className="py-2">Conf.</th>
            </tr>
          </thead>
          <tbody>
            {datedSample.map((e) => (
              <tr key={`${e.event_date}-${e.title.slice(0, 20)}`} className="border-b border-ark-sage/20">
                <td className="py-2 pr-3 whitespace-nowrap">{e.event_date}</td>
                <td className="py-2 pr-3">
                  {e.source_url ? (
                    <a href={e.source_url} className="hover:underline" target="_blank" rel="noreferrer">
                      {e.title.slice(0, 60)}
                    </a>
                  ) : (
                    e.title.slice(0, 60)
                  )}
                </td>
                <td className="py-2 pr-3 text-muted">{e.platform ?? "—"}</td>
                <td className="py-2">{e.confidence_score ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card-readable mb-8 text-sm text-muted">
        <h2 className="font-semibold text-foreground mb-2">Operator commands</h2>
        <pre className="text-xs bg-ark-pine/5 p-3 rounded-lg overflow-x-auto">{`npm run schools:attach-urls
npm run schools:harvest-calendars
npm run audit:school-events
npm run schools:approve-events -- --all-parsed   # manual publish step`}</pre>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link to="/admin" className="btn-secondary text-sm" onClick={() => sessionStorage.setItem("civic-admin-tab", "intelligence")}>
          Event Intelligence review →
        </Link>
        <Link to="/admin/data-health" className="btn-secondary text-sm">Data health →</Link>
      </div>
    </div>
  );
}

function FunnelStep({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <span className={highlight ? "rounded-lg bg-ark-pine/5 border border-ark-sage px-2 py-1" : "px-1"}>
      {value} {label}
    </span>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-lg bg-ark-pine/5 border border-ark-sage px-3 py-2" : ""}>
      <p className="text-xs uppercase font-bold text-muted">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
