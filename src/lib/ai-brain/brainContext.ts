import eventIndex from "../../../data/ai-brain/event-index.json";
import placeIndex from "../../../data/ai-brain/place-index.json";
import feedIndex from "../../../data/ai-brain/feed-index.json";
import coverageIndex from "../../../data/ai-brain/coverage-index.json";
import researchTasks from "../../../data/ai-brain/research-tasks.json";
import type { AiBrainMode } from "./brainRegistry";

export type AiBrainRequest = {
  question: string;
  mode: AiBrainMode;
  campaignSlug?: string;
  county?: string;
  city?: string;
};

export type AiBrainCitation = { url: string; label?: string };

export type AiBrainAction = {
  type: string;
  count?: number;
  counties?: string[];
};

export type AiBrainResponse = {
  question: string;
  mode: AiBrainMode;
  answer: string;
  citedSources: AiBrainCitation[];
  recommendedActions: AiBrainAction[];
  confidence: "high" | "medium" | "low";
  toolCallsUsed: string[];
  needsHumanReview: boolean;
  dataFreshness?: string | null;
  source?: string;
};

export type BrainIndexSnapshot = {
  eventCount: number;
  countyCount: number;
  thinCounties: string[];
  thinFeedCounties: string[];
  openResearchTasks: number;
  eventsNeedingSource: number;
  indexGeneratedAt: string | null;
};

export function getBrainIndexSnapshot(): BrainIndexSnapshot {
  const place = placeIndex as { thinCounties?: string[]; countyCount?: number; generatedAt?: string };
  const feed = feedIndex as { thinCounties?: string[]; generatedAt?: string };
  const coverage = coverageIndex as { eventsNeedingSource?: number };
  const research = researchTasks as { openCount?: number; generatedAt?: string };
  const events = eventIndex as { count?: number; generatedAt?: string };

  return {
    eventCount: events.count ?? 0,
    countyCount: place.countyCount ?? 75,
    thinCounties: place.thinCounties ?? [],
    thinFeedCounties: feed.thinCounties ?? [],
    openResearchTasks: research.openCount ?? 0,
    eventsNeedingSource: coverage.eventsNeedingSource ?? 0,
    indexGeneratedAt: events.generatedAt ?? place.generatedAt ?? null,
  };
}

export function buildBrainContext(req: AiBrainRequest): Record<string, unknown> {
  const snapshot = getBrainIndexSnapshot();
  return {
    question: req.question,
    mode: req.mode,
    campaignSlug: req.campaignSlug ?? null,
    county: req.county ?? null,
    city: req.city ?? null,
    snapshot,
    governance: "AI advises; humans approve publishing and verification.",
  };
}
