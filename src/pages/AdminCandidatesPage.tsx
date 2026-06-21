import { useMemo } from "react";
import { Link } from "react-router-dom";
import { candidateRegistrySummary, listCandidates } from "../lib/candidates/registry";

export function AdminCandidatesPage() {
  const candidates = useMemo(() => listCandidates(), []);
  const summary = useMemo(() => candidateRegistrySummary(), []);

  const byOffice = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of candidates) m.set(c.office, (m.get(c.office) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [candidates]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <div>
          <p className="text-kicker">Pass 26 — Candidate registry</p>
          <h1 className="page-header text-2xl">Public candidate filings</h1>
          <p className="text-muted text-sm mt-1">Source of truth: Arkansas SOS Candidate Search · neutral listing only</p>
        </div>
        <Link to="/admin" className="btn-ghost text-sm">← Admin</Link>
      </div>

      <section className="card-readable grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8 text-sm">
        <Stat label="Total" value={String(summary.total ?? candidates.length)} highlight />
        <Stat label="Democratic" value={String(summary.democratic ?? 0)} />
        <Stat label="Republican" value={String(summary.republican ?? 0)} />
        <Stat label="Nonpartisan" value={String(summary.nonpartisan ?? 0)} />
        <Stat label="With dashboard" value={String(summary.with_dashboard ?? 0)} highlight />
        <Stat label="Libertarian" value={String(summary.libertarian ?? 0)} />
        <Stat label="Independent" value={String(summary.independent ?? 0)} />
      </section>

      {Boolean((summary.sos_api_notes as string[] | undefined)?.length) && (
        <section className="card-readable mb-8 text-sm text-muted">
          <p className="font-semibold text-ark-pine mb-1">SOS API notes</p>
          <ul className="list-disc pl-5 space-y-1">
            {((summary.sos_api_notes as string[]) ?? []).map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card-readable mb-8">
        <h2 className="font-semibold mb-3">Top offices</h2>
        <ul className="text-sm space-y-1">
          {byOffice.map(([office, n]) => (
            <li key={office} className="flex justify-between border-b border-ark-sage/20 py-1">
              <span>{office}</span>
              <span className="text-muted">{n}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-readable overflow-x-auto">
        <h2 className="font-semibold mb-3">All candidates</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted border-b">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Office</th>
              <th className="py-2 pr-3">Party</th>
              <th className="py-2">Dashboard</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} className="border-b border-ark-sage/20">
                <td className="py-2 pr-3">
                  <Link to={`/candidate/${c.slug}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="py-2 pr-3 text-muted">{c.office}</td>
                <td className="py-2 pr-3">{c.party ?? "Nonpartisan"}</td>
                <td className="py-2">
                  {c.dashboard_slug || c.has_dashboard ? (
                    <Link to={`/campaigns/${c.dashboard_slug ?? c.slug}`} className="text-ark-rust text-xs">
                      workspace →
                    </Link>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
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
