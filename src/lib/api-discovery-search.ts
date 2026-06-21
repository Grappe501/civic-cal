import { deterministicPublicDiscoverySearch } from "./ai/publicDiscoverySearch";
import type { CivicEvent } from "./types";
import type { PersonalityMode, PublicDiscoveryAnswer } from "./discovery/types";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

function mapAiBrainToDiscovery(query: string, mode: PersonalityMode, brain: {
  answer: string;
  citedSources?: { url: string }[];
  confidence?: string;
  source?: string;
}): PublicDiscoveryAnswer {
  const citeNote = brain.citedSources?.length
    ? ` Based on ${brain.citedSources.length} indexed source(s). Confidence: ${brain.confidence ?? "medium"}.`
    : "";
  return {
    query,
    mode,
    source: brain.source === "openai" ? "openai" : "deterministic",
    headline: "Ask Arkansas Everywhere",
    summary: brain.answer + citeNote,
    eventIds: [],
    followUpPrompts: [
      "Festivals this month",
      "Volunteer opportunities near me",
      "County fairs with verified dates",
    ],
  };
}

export async function runPublicDiscoverySearch(
  query: string,
  events: CivicEvent[],
  mode: PersonalityMode,
): Promise<PublicDiscoveryAnswer> {
  try {
    const brainRes = await fetch(`${fnBase}/ai-brain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: query, mode: "public" }),
    });
    if (brainRes.ok) {
      const brain = await brainRes.json();
      if (brain.answer) return mapAiBrainToDiscovery(query, mode, brain);
    }
  } catch (_) {}

  try {
    const res = await fetch(`${fnBase}/public-discovery-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, mode, eventCount: events.length, sampleTitles: events.slice(0, 40).map((e) => e.title) }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.answer?.summary || data.answer?.headline) {
        return data.answer as PublicDiscoveryAnswer;
      }
    }
  } catch (_) {}
  return deterministicPublicDiscoverySearch(query, events, mode);
}
