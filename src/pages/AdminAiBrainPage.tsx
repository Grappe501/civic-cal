import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, ExternalLink, Sparkles } from "lucide-react";
import { askAiBrain, getBrainIndexSnapshot } from "../lib/api-ai-brain";
import type { AiBrainResponse } from "../lib/api-ai-brain";
import { ADMIN_EXAMPLE_PROMPTS } from "../lib/ai-brain/brainRegistry";
import { listToolNames } from "../lib/ai-brain/toolRegistry";

export function AdminAiBrainPage() {
  const snapshot = useMemo(() => getBrainIndexSnapshot(), []);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiBrainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(text?: string) {
    const q = (text ?? question).trim();
    if (!q) return;
    setQuestion(q);
    setLoading(true);
    setError(null);
    try {
      setResult(await askAiBrain({ question: q, mode: "admin" }));
    } catch (e) {
      setError(String(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <div>
          <p className="text-kicker">Pass 29 — AI Brain Tooling Layer</p>
          <h1 className="page-header text-2xl">Admin AI console</h1>
          <p className="text-muted text-sm mt-1">
            Structured tools, indexes, and source-grounded answers. AI advises — humans approve publishing and harvest.
          </p>
        </div>
        <Link to="/admin" className="btn-ghost text-sm">
          ← Admin
        </Link>
      </div>

      <section className="card-readable grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8 text-sm">
        <div>
          <p className="text-muted">Indexed events</p>
          <p className="text-xl font-semibold">{snapshot.eventCount}</p>
        </div>
        <div>
          <p className="text-muted">Thin counties</p>
          <p className="text-xl font-semibold">{snapshot.thinCounties.length}</p>
        </div>
        <div>
          <p className="text-muted">Open research tasks</p>
          <p className="text-xl font-semibold">{snapshot.openResearchTasks}</p>
        </div>
        <div>
          <p className="text-muted">Index freshness</p>
          <p className="text-xs font-mono">{snapshot.indexGeneratedAt?.slice(0, 10) ?? "—"}</p>
        </div>
      </section>

      <section className="card-readable mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <Brain className="h-4 w-4" />
            Ask the system
          </label>
          <textarea
            className="input-readable w-full min-h-[88px]"
            placeholder="What should we harvest next to grow fastest?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button type="submit" disabled={loading} className="btn-primary mt-3">
            {loading ? "Thinking…" : "Run AI Brain"}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {ADMIN_EXAMPLE_PROMPTS.map((ex) => (
            <button key={ex} type="button" className="chip chip-muted text-xs" onClick={() => submit(ex)}>
              {ex}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
      </section>

      {result && (
        <section className="card-readable mb-8 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`badge-${result.confidence === "high" ? "success" : result.confidence === "low" ? "warning" : "info"}`}>
              Confidence: {result.confidence}
            </span>
            {result.needsHumanReview && <span className="badge-warning">Needs human review</span>}
            {result.dataFreshness && (
              <span className="text-xs text-muted">Data: {result.dataFreshness.slice(0, 10)}</span>
            )}
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">{result.answer}</div>
          {result.toolCallsUsed.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Tool calls</p>
              <div className="flex flex-wrap gap-2">
                {result.toolCallsUsed.map((t) => (
                  <code key={t} className="text-xs bg-surface-muted px-2 py-1 rounded">
                    {t}
                  </code>
                ))}
              </div>
            </div>
          )}
          {result.citedSources.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Cited sources</p>
              <ul className="text-sm space-y-1">
                {result.citedSources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="link-inline inline-flex items-center gap-1">
                      {s.label ?? s.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.recommendedActions.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Recommended actions (approval required)</p>
              <pre className="text-xs bg-surface-muted p-3 rounded overflow-auto">
                {JSON.stringify(result.recommendedActions, null, 2)}
              </pre>
            </div>
          )}
        </section>
      )}

      <section className="card-readable">
        <h2 className="font-display text-lg font-semibold mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Available tools ({listToolNames().length})
        </h2>
        <p className="text-sm text-muted mb-3">
          Rebuild indexes: <code className="text-xs">npm run ai:build-indexes</code> · Research tasks:{" "}
          <code className="text-xs">npm run ai:research-tasks</code>
        </p>
        <ul className="text-sm grid sm:grid-cols-2 gap-2">
          {listToolNames().map((name) => (
            <li key={name}>
              <code className="text-xs">{name}</code>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
