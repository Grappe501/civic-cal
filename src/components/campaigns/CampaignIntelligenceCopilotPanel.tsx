import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, ChevronRight } from "lucide-react";
import type { CampaignWorkspace } from "../../lib/campaigns/types";
import type { CampaignEventPlan } from "../../lib/campaigns/types";
import type { CivicEvent } from "../../lib/types";
import type { CampaignOwnedEvent } from "../../lib/campaigns/campaignEventTypes";
import {
  buildCampaignCopilotBrief,
  buildAskAiWhyPayload,
  type CopilotEventCard,
} from "../../lib/ai/campaignIntelligenceCopilot";
import { RECOMMENDATION_LABELS } from "../../lib/intelligence/campaignPriorityScore";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

interface Props {
  workspace: CampaignWorkspace;
  events: CivicEvent[];
  plans: Record<string, CampaignEventPlan>;
  campaignEvents: CampaignOwnedEvent[];
  themeAccent: string;
}

type Horizon = "today" | "week" | "month";

export function CampaignIntelligenceCopilotPanel({ workspace, events, plans, campaignEvents, themeAccent }: Props) {
  const [horizon, setHorizon] = useState<Horizon>("week");
  const [aiExplain, setAiExplain] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const brief = useMemo(
    () => buildCampaignCopilotBrief(horizon, workspace, events, plans, campaignEvents),
    [horizon, workspace, events, plans, campaignEvents],
  );

  async function askWhy(card: CopilotEventCard) {
    setAiLoading(true);
    setAiExplain(null);
    try {
      const res = await fetch(`${fnBase}/campaign-copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "explain_recommendation", ...buildAskAiWhyPayload(card) }),
      });
      const data = await res.json();
      setAiExplain(data.result?.explanation ?? data.result?.summary ?? JSON.stringify(data.result, null, 2));
    } catch {
      setAiExplain(
        `${card.suggestedRole}: ${card.whyItMatters}. ${card.priority.warnings.join(" ") || "Verify locally before committing."}`,
      );
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <section className="card card-elevated mb-8 border-l-4" style={{ borderLeftColor: themeAccent }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" style={{ color: themeAccent }} />
          <h2 className="font-display text-xl font-semibold">Campaign intelligence copilot</h2>
        </div>
        <div className="flex gap-2">
          {(["today", "week", "month"] as Horizon[]).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHorizon(h)}
              className={horizon === h ? "chip chip-active" : "chip chip-muted text-xs capitalize"}
            >
              {h === "week" ? "This week" : h === "month" ? "This month" : "Today"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted mb-3">{brief.headline}</p>

      {brief.urgent.length > 0 && (
        <ul className="text-sm space-y-1 mb-4 text-amber-950 bg-amber-50 rounded-lg px-3 py-2">
          {brief.urgent.map((u) => (
            <li key={u}>· {u}</li>
          ))}
        </ul>
      )}

      <div className="space-y-3">
        {brief.topEvents.length === 0 && <p className="text-sm text-muted">No scored events in this horizon — check feed scan / calendar data.</p>}
        {brief.topEvents.map((card) => (
          <div key={card.event.id} className="border border-ark-sage/25 rounded-lg p-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <Link to={`/event/${card.event.slug}`} className="font-semibold text-ark-rust hover:underline">
                {card.event.title}
              </Link>
              <span className="chip chip-score text-[10px]">{card.priority.score}</span>
            </div>
            <p className="text-caption mt-1">
              {card.event.county} County · {RECOMMENDATION_LABELS[card.priority.recommendation]} · Confidence: {card.priority.confidence}
            </p>
            <p className="text-muted mt-1">{card.whyItMatters}</p>
            {card.conflictWarning && <p className="text-xs text-amber-800 mt-1">Conflict: {card.conflictWarning}</p>}
            {card.volunteerNotes && <p className="text-xs mt-1">Volunteers: {card.volunteerNotes}</p>}
            {card.sourceUrl && (
              <a href={card.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-ark-rust hover:underline mt-1 inline-block">
                Source
              </a>
            )}
            <button type="button" className="btn-ghost text-xs mt-2 py-1" disabled={aiLoading} onClick={() => askWhy(card)}>
              Ask AI why <ChevronRight className="inline h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {brief.gaps.length > 0 && (
        <div className="mt-4 pt-3 border-t text-sm">
          <p className="font-semibold text-muted text-xs uppercase">Coverage gaps</p>
          <ul className="mt-1 space-y-1">
            {brief.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      {aiExplain && (
        <div className="mt-4 p-3 bg-ark-wheat/50 rounded-lg text-sm">
          <p className="text-xs font-bold uppercase text-muted mb-1">AI explanation (advisory)</p>
          {aiExplain}
        </div>
      )}
    </section>
  );
}
