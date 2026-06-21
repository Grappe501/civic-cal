import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Play, RefreshCw } from "lucide-react";
import { loadAutogrowConfig, loadAutogrowHealth, loadAutogrowRuns } from "../lib/autogrow/autogrowHealth";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

export function AdminAutogrowPage() {
  const health = useMemo(() => loadAutogrowHealth(), []);
  const runs = useMemo(() => loadAutogrowRuns(), []);
  const config = useMemo(() => loadAutogrowConfig(), []);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function trigger(task: string) {
    setBusy(task);
    setMsg(null);
    try {
      const res = await fetch(`${fnBase}/autogrow-run?task=${encodeURIComponent(task)}`, { method: "POST" });
      const data = await res.json();
      setMsg(data.ok ? `Started ${task}` : data.error ?? "Failed");
    } catch (e) {
      setMsg(String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <div>
          <p className="text-kicker">Pass 24 — Autogrow Engine</p>
          <h1 className="page-header text-2xl">Scheduled growth &amp; scan health</h1>
          <p className="text-muted text-sm mt-1">{config.policy}</p>
        </div>
        <Link to="/admin" className="btn-ghost text-sm">← Admin</Link>
      </div>

      <section className="card-readable grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8 text-sm">
        <Stat label="Status" value={health.status} />
        <Stat label="Feeds scanned (last)" value={String(health.feedsScanned)} highlight />
        <Stat label="New candidates" value={String(health.newCandidatesFound)} />
        <Stat label="Approval queue" value={String(health.approvalQueueSize)} highlight />
        <Stat label="Failed sources" value={String(health.failedSources)} />
        <Stat label="Stale sources" value={String(health.staleSources)} />
        <Stat label="Briefings generated" value={String(health.candidateBriefingsGenerated)} />
        <Stat label="Duplicates skipped" value={String(health.duplicatesSkipped)} />
      </section>

      <section className="card-readable mb-8 text-sm">
        <h2 className="font-semibold mb-3">Schedule</h2>
        <ul className="space-y-2">
          {Object.entries(config.schedules).map(([k, v]) => (
            <li key={k} className="flex justify-between border-b border-ark-sage/20 py-2">
              <span>{v.label}</span>
              <code className="text-xs">{v.cron}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-readable mb-8 flex flex-wrap gap-2">
        <button type="button" className="btn-primary text-sm" disabled={!!busy} onClick={() => trigger("daily_feed_scan")}>
          <Play className="h-4 w-4" /> Run daily scan
        </button>
        <button type="button" className="btn-secondary text-sm" disabled={!!busy} onClick={() => trigger("weekly_feed_discovery")}>
          Run weekly discovery
        </button>
        <button type="button" className="btn-secondary text-sm" disabled={!!busy} onClick={() => trigger("weekly_campaign_briefings")}>
          Run candidate briefings
        </button>
        <button type="button" className="btn-secondary text-sm" disabled={!!busy} onClick={() => trigger("weekly_profile_refresh")}>
          Refresh stale profiles
        </button>
        {msg && <p className="text-sm text-muted w-full">{msg}</p>}
      </section>

      <section className="card-readable mb-8">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <RefreshCw className="h-4 w-4" /> Recent runs
        </h2>
        <ul className="text-sm space-y-2 max-h-64 overflow-y-auto">
          {(runs.runs ?? []).slice(0, 15).map((r) => (
            <li key={r.at + r.task} className="border-b border-ark-sage/20 pb-2">
              <span className="font-medium">{r.task}</span>
              <span className="text-caption ml-2">{r.at}</span>
            </li>
          ))}
          {!runs.runs?.length && <li className="text-muted">No runs logged yet — use npm run autogrow:daily locally or trigger above.</li>}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link to="/admin/feeds" className="btn-secondary text-sm">Feed coverage →</Link>
        <Link to="/admin/data-health" className="btn-secondary text-sm">Data health →</Link>
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
