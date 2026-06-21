import { deterministicPublicDiscoverySearch } from "./ai/publicDiscoverySearch";
import type { CivicEvent } from "./types";
import type { PersonalityMode, PublicDiscoveryAnswer } from "./discovery/types";

const fnBase = import.meta.env.VITE_FUNCTIONS_BASE ?? "/.netlify/functions";

export async function runPublicDiscoverySearch(
  query: string,
  events: CivicEvent[],
  mode: PersonalityMode,
): Promise<PublicDiscoveryAnswer> {
  try {
    const res = await fetch(`${fnBase}/public-discovery-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, mode, eventCount: events.length, sampleTitles: events.slice(0, 40).map((e) => e.title) }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.answer?.eventIds?.length) {
        return data.answer as PublicDiscoveryAnswer;
      }
    }
  } catch (_) {}
  return deterministicPublicDiscoverySearch(query, events, mode);
}
