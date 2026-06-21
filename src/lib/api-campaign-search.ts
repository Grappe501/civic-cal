import type { StrategicSearchAnswer } from "./ai/campaignSearchPlanner";
import type { CampaignWorkspace } from "./campaigns/types";
import type { CivicEvent } from "./types";
import { deterministicStrategicSearch } from "./ai/campaignSearchPlanner";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

export async function runCampaignStrategicSearch(
  workspace: CampaignWorkspace,
  queryText: string,
  events: CivicEvent[],
  gapSummary?: string[],
): Promise<StrategicSearchAnswer> {
  const context = {
    workspace,
    events,
    gapSummary,
  };

  try {
    const res = await fetch(`${fnBase}/campaign-ai-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceSlug: workspace.slug, queryText, context }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.answer as StrategicSearchAnswer;
    }
  } catch (_) {}

  return deterministicStrategicSearch(queryText, context);
}
