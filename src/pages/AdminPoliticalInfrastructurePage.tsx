import { useMemo } from "react";
import { Link } from "react-router-dom";
import { runPoliticalInfrastructureAudit } from "../lib/political-infrastructure/coverageEngine";
import { runPartyMeetingHealth } from "../lib/party-meetings/partyMeetingHealth";
import approvedBundle from "../../data/ingestion/political-party-meetings-approved-events.json";

export function AdminPoliticalInfrastructurePage() {
  const audit = useMemo(() => runPoliticalInfrastructureAudit(), []);
  const partyHealth = useMemo(() => runPartyMeetingHealth(), []);
  const approvedCount = (approvedBundle as { events?: unknown[] }).events?.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <div>
          <p className="text-kicker">Pass 25 — Civic Political Infrastructure</p>
          <h1 className="page-header text-2xl">Political infrastructure coverage</h1>
          <p className="text-muted text-sm mt-1">Neutral county party committees — not ideology, not persuasion.</p>
        </div>
        <Link to="/admin" className="btn-ghost text-sm">← Admin</Link>
      </div>

      <section className="card-readable grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8 text-sm">
        <Stat label="Avg political coverage" value={`${audit.avgPoliticalCoverage}%`} highlight />
        <Stat label="D county pages" value={String(audit.democraticPagesDiscovered)} />
        <Stat label="D with schedule" value={String(audit.democraticWithSchedule)} />
        <Stat label="R with schedule" value={String(audit.republicanWithSchedule)} />
        <Stat label="Staged meetings" value={String(partyHealth.stagedMeetings)} />
        <Stat label="Approved / public" value={String(approvedCount)} highlight />
        <Stat label="Libertarian indexed" value={String(audit.libertarianIndexed)} />
        <Stat label="Recurrence review" value={String(partyHealth.recurrenceNeedsReview)} />
      </section>

      <section className="card-readable mb-8 overflow-x-auto">
        <h2 className="font-semibold mb-3">County sample (lowest coverage first)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted border-b">
              <th className="py-2 pr-3">County</th>
              <th className="py-2 pr-3">Democratic</th>
              <th className="py-2 pr-3">Republican</th>
              <th className="py-2 pr-3">Libertarian</th>
              <th className="py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {[...audit.rows].sort((a, b) => a.coveragePercent - b.coveragePercent).slice(0, 20).map((r) => (
              <tr key={r.county} className="border-b border-ark-sage/20">
                <td className="py-2 pr-3 font-medium">
                  <Link to={`/organization/${r.county.toLowerCase().replace(/\s+/g, "-")}-county-democrats`} className="hover:underline">
                    {r.county}
                  </Link>
                </td>
                <td className="py-2 pr-3 text-muted">{r.democratic}</td>
                <td className="py-2 pr-3 text-muted">{r.republican}</td>
                <td className="py-2 pr-3 text-muted">{r.libertarian}</td>
                <td className="py-2">{r.coveragePercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link to="/admin/data-health" className="btn-secondary text-sm">Data health →</Link>
        <Link to="/admin" className="btn-secondary text-sm">Approve series in Event Intelligence →</Link>
      </div>
    </div>
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
