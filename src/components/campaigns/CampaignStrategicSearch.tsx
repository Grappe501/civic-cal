import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { runCampaignStrategicSearch } from "../../lib/api-campaign-search";
import type { StrategicSearchAnswer } from "../../lib/ai/campaignSearchPlanner";
import type { CampaignWorkspace } from "../../lib/campaigns/types";
import type { CivicEvent } from "../../lib/types";
import { Link } from "react-router-dom";

const PLACEHOLDERS = [
  "Where should Kelly be this weekend?",
  "Find high-RD church events in northeast Arkansas",
  "What are my calendar gaps next week?",
  "Show events inside my district with 100+ expected people",
  "Find volunteer deployment opportunities",
  "Which events are worth the trip outside my district?",
];

interface Props {
  workspace: CampaignWorkspace;
  events: CivicEvent[];
  gapSummary?: string[];
  themePrimary?: string;
}

export function CampaignStrategicSearch({ workspace, events, gapSummary, themePrimary }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<StrategicSearchAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const placeholder = PLACEHOLDERS[workspace.slug.length % PLACEHOLDERS.length];

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await runCampaignStrategicSearch(workspace, query.trim(), events, gapSummary);
      setAnswer(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card card-elevated">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5" style={{ color: themePrimary }} />
        <h3 className="font-display font-semibold" style={{ color: themePrimary }}>
          AI strategic search
        </h3>
      </div>
      <p className="text-xs text-muted mb-3">
        Ask where to go, what you&apos;re missing, and how to deploy — advisory only, never auto-publishes.
      </p>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          className="input flex-1 text-sm"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-primary text-sm py-2 px-4 shrink-0">
          <Search className="h-4 w-4" />
          {loading ? "…" : "Search"}
        </button>
      </form>
      {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
      {answer && (
        <div className="mt-4 space-y-3 text-sm border-t border-ark-pine/10 pt-4">
          <p className="text-muted">{answer.summary}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted">Source: {answer.source}</p>
          {answer.recommendedEvents.length > 0 && (
            <div>
              <p className="font-semibold text-ark-pine mb-1">Recommended events</p>
              <ul className="space-y-2">
                {answer.recommendedEvents.slice(0, 5).map((ev) => {
                  const match = events.find((e) => e.id === ev.eventId);
                  const href = match ? `/event/${match.slug}` : "#";
                  return (
                  <li key={ev.eventId} className="rounded-lg bg-ark-wheat/50 px-3 py-2">
                    <Link to={href} className="font-medium text-ark-pine hover:text-ark-rust">
                      {ev.title}
                    </Link>
                    <p className="text-xs text-muted mt-0.5">{ev.whyItMatters}</p>
                    <p className="text-[10px] text-ark-sage mt-1">Role: {ev.suggestedRole}</p>
                  </li>
                  );
                })}
              </ul>
            </div>
          )}
          {answer.calendarGaps.length > 0 && (
            <div>
              <p className="font-semibold text-ark-pine">Calendar gaps</p>
              <ul className="text-xs text-muted list-disc pl-4 mt-1">
                {answer.calendarGaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          )}
          {answer.nextActions.length > 0 && (
            <div>
              <p className="font-semibold text-ark-pine">Next actions</p>
              <ul className="text-xs text-muted list-disc pl-4 mt-1">
                {answer.nextActions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
