import { useState } from "react";
import { Brain, ExternalLink } from "lucide-react";
import { askAiBrain } from "../../lib/api-ai-brain";
import type { AiBrainResponse } from "../../lib/api-ai-brain";
import { CAMPAIGN_EXAMPLE_PROMPTS } from "../../lib/ai-brain/brainRegistry";
import type { CampaignWorkspace } from "../../lib/campaigns/types";

interface Props {
  workspace: CampaignWorkspace;
  themeAccent: string;
}

export function CampaignBrainPanel({ workspace, themeAccent }: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiBrainResponse | null>(null);

  async function submit(text?: string) {
    const q = (text ?? question).trim();
    if (!q) return;
    setQuestion(q);
    setLoading(true);
    try {
      setResult(
        await askAiBrain({
          question: q,
          mode: "campaign",
          campaignSlug: workspace.slug,
          county: workspace.districtScope?.counties?.[0],
          city: workspace.districtScope?.cities?.[0],
        }),
      );
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card card-elevated mb-8 border-l-4" style={{ borderLeftColor: themeAccent }}>
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-5 w-5" style={{ color: themeAccent }} />
        <h2 className="font-display text-xl font-semibold">Campaign Brain</h2>
      </div>
      <p className="text-sm text-muted mb-4">
        Source-grounded guidance for {workspace.candidateName ?? workspace.campaignName}. Recommendations require your approval before action.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col sm:flex-row gap-2 mb-3"
      >
        <input
          type="text"
          className="input-readable flex-1"
          placeholder="What matters this week?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-primary shrink-0">
          {loading ? "…" : "Ask"}
        </button>
      </form>
      <div className="flex flex-wrap gap-2 mb-4">
        {CAMPAIGN_EXAMPLE_PROMPTS.slice(0, 4).map((ex) => (
          <button key={ex} type="button" className="chip chip-muted text-xs" onClick={() => submit(ex)}>
            {ex}
          </button>
        ))}
      </div>
      {result && (
        <div className="text-sm space-y-2 border-t border-border pt-3">
          <div className="flex flex-wrap gap-2">
            <span className="badge-info text-xs">Confidence: {result.confidence}</span>
            {result.needsHumanReview && <span className="badge-warning text-xs">Needs approval</span>}
          </div>
          <p className="whitespace-pre-wrap">{result.answer}</p>
          {result.toolCallsUsed.length > 0 && (
            <p className="text-xs text-muted">Tools: {result.toolCallsUsed.join(", ")}</p>
          )}
          {result.citedSources.slice(0, 3).map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="link-inline text-xs flex items-center gap-1">
              {s.label ?? s.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
