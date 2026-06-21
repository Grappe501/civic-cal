import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { runProfileHealth } from "../../lib/profiles/profileHealth";
import { profilePath } from "../../lib/profiles/profileLinks";
import {
  attachSourceUrl,
  listRefreshTasks,
  markRefreshed,
  sendToResearch,
  updateRefreshTask,
  enqueueProfileRefresh,
} from "../../lib/profiles/profileRefreshStore";
import { staleLabel } from "../../lib/freshness/staleData";

export function AdminProfileRefreshPanel() {
  const health = useMemo(() => runProfileHealth(), []);
  const [tasks, setTasks] = useState(listRefreshTasks);
  const [sourceDraft, setSourceDraft] = useState<Record<string, string>>({});

  function refreshTasks() {
    setTasks(listRefreshTasks());
  }

  function queueStale() {
    for (const p of health.staleProfiles.slice(0, 10)) {
      enqueueProfileRefresh(p, staleLabel(p.freshness));
    }
    refreshTasks();
  }

  return (
    <div className="space-y-6">
      <section className="card-readable grid gap-3 sm:grid-cols-2 text-sm">
        <Stat label="Total profiles" value={String(health.totalProfiles)} />
        <Stat label="Stale profiles" value={String(health.staleCount)} highlight={health.staleCount > 0} />
        <Stat label="Low confidence" value={String(health.lowConfidenceCount)} />
        <Stat label="Missing sources" value={String(health.missingSourceCount)} />
        <Stat label="Refresh needed" value={String(health.refreshNeededCount)} />
        <Stat label="Open tasks" value={String(tasks.filter((t) => t.status === "open").length)} />
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary text-sm" onClick={queueStale}>
          Queue top stale profiles
        </button>
        <Link to="/admin/data-health" className="btn-ghost text-sm">
          Data health →
        </Link>
      </div>

      <section className="card-readable">
        <h2 className="font-semibold">Stale pages</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {health.staleProfiles.slice(0, 15).map((p) => (
            <li key={`${p.entityType}:${p.slug}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-ark-sage/20 pb-2">
              <div>
                <Link to={profilePath(p.entityType, p.slug)} className="font-medium text-ark-rust hover:underline">
                  {p.title}
                </Link>
                <p className="text-xs text-muted">{p.entityType} · {staleLabel(p.freshness)}</p>
              </div>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => {
                  enqueueProfileRefresh(p, staleLabel(p.freshness));
                  refreshTasks();
                }}
              >
                Request update
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-readable">
        <h2 className="font-semibold">Low confidence / missing sources</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {[...health.lowConfidenceProfiles, ...health.missingSourceProfiles]
            .slice(0, 12)
            .map((p) => (
              <li key={`lc-${p.entityType}:${p.slug}`}>
                <Link to={profilePath(p.entityType, p.slug)} className="text-ark-rust hover:underline">
                  {p.title}
                </Link>
                <span className="text-xs text-muted ml-2">{p.freshness.sourceConfidence} · {p.freshness.sourceCount} sources</span>
              </li>
            ))}
        </ul>
      </section>

      <section className="card-readable">
        <h2 className="font-semibold">Refresh task list</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted mt-2">No tasks queued.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {tasks.map((t) => (
              <li key={t.id} className="border border-ark-sage/30 rounded-lg p-3 text-sm">
                <p className="font-medium">{t.title}</p>
                <p className="text-xs text-muted">{t.entityType} · {t.reason} · {t.status}</p>
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  <button type="button" className="btn-primary text-xs" onClick={() => { markRefreshed(t.id); refreshTasks(); }}>
                    Mark refreshed
                  </button>
                  <button type="button" className="btn-secondary text-xs" onClick={() => { sendToResearch(t.id); refreshTasks(); }}>
                    Research queue
                  </button>
                  <input
                    className="input-readable text-xs flex-1 min-w-[180px]"
                    placeholder="Source URL"
                    value={sourceDraft[t.id] ?? t.sourceUrl ?? ""}
                    onChange={(e) => setSourceDraft((d) => ({ ...d, [t.id]: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => {
                      attachSourceUrl(t.id, sourceDraft[t.id] ?? "");
                      updateRefreshTask(t.id, { notes: "Source attached" });
                      refreshTasks();
                    }}
                  >
                    Attach source
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-lg bg-amber-50 border border-amber-200 px-3 py-2" : ""}>
      <p className="text-xs uppercase font-bold text-muted">{label}</p>
      <p className="text-lg font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
