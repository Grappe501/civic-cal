import { useMemo } from "react";
import { Link } from "react-router-dom";
import { runSchoolHarvestHealth } from "../lib/schools/schoolHarvestHealth";
import approvedBundle from "../../data/ingestion/school-events-approved-events.json";

export function AdminSchoolCalendarPage() {
  const health = useMemo(() => runSchoolHarvestHealth(), []);
  const approvedCount = (approvedBundle as { events?: unknown[] }).events?.length ?? health.funnel.approvedPublicEvents;
  const f = health.funnel;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <div>
          <p className="text-kicker">Pass 27 — School Calendar Harvest</p>
          <h1 className="page-header text-2xl">School & college event funnel</h1>
          <p className="text-muted text-sm mt-1">328 high schools + 18 colleges → calendar URLs → staged events → approved public listings.</p>
        </div>
        <Link to="/admin" className="btn-ghost text-sm">← Admin</Link>
      </div>

      <section className="card-readable mb-8">
        <h2 className="font-semibold mb-4">Harvest funnel</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <FunnelStep label="HS discovered" value={f.highSchoolsDiscovered} />
          <span className="text-muted">→</span>
          <FunnelStep label="Calendar URL" value={f.highSchoolsCalendarUrl} highlight={f.highSchoolsCalendarUrl > 0} />
          <span className="text-muted">→</span>
          <FunnelStep label="Athletics URL" value={f.highSchoolsAthleticsUrl} />
          <span className="text-muted">→</span>
          <FunnelStep label="Staged events" value={f.stagedSchoolEvents} highlight />
          <span className="text-muted">→</span>
          <FunnelStep label="Approved public" value={approvedCount} highlight />
        </div>
        <p className="text-xs text-muted mt-4">
          Colleges: {f.collegesDiscovered} discovered · {f.collegesCalendarUrl} calendar · {f.collegesAthleticsUrl} athletics
        </p>
      </section>

      <section className="card-readable grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8 text-sm">
        <Stat label="HS calendar URLs" value={`${f.highSchoolsCalendarUrl} / ${f.highSchoolsDiscovered}`} highlight />
        <Stat label="HS athletics URLs" value={`${f.highSchoolsAthleticsUrl} / ${f.highSchoolsDiscovered}`} />
        <Stat label="Staged (pending)" value={String(f.stagedPendingReview)} />
        <Stat label="Approved / public" value={String(approvedCount)} highlight />
      </section>

      <section className="card-readable mb-8">
        <h2 className="font-semibold mb-3">Event lanes (staged)</h2>
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          {(health.targetLanes.length ? health.targetLanes : [
            "school_board", "football", "basketball", "band_concert", "homecoming",
            "senior_night", "graduation", "theater", "pto_fundraiser", "college_athletics", "college_public",
          ]).map((lane) => (
            <div key={lane} className="flex justify-between border-b border-ark-sage/20 py-1.5">
              <span className="text-muted">{lane.replace(/_/g, " ")}</span>
              <span className="font-medium">{health.lanes[lane] ?? 0}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card-readable mb-8 text-sm text-muted">
        <h2 className="font-semibold text-foreground mb-2">Operator commands</h2>
        <pre className="text-xs bg-ark-pine/5 p-3 rounded-lg overflow-x-auto">{`npm run schools:discover
npm run schools:attach-urls
npm run schools:harvest-calendars
npm run schools:approve-events -- --all-parsed`}</pre>
        <p className="mt-3 text-xs">
          Set <code className="text-xs">CANDIDATE_DASHBOARD_BETA_PASSWORD</code> in Netlify env before relying on protected candidate dashboards.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link to="/admin/data-health" className="btn-secondary text-sm">Data health →</Link>
        <Link to="/schools" className="btn-secondary text-sm">School directory →</Link>
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
