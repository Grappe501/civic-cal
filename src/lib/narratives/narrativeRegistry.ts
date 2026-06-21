import bundle from "../../../data/narratives/community-narratives.json";
import type { CivicEvent } from "../types";
import type { ProfileEntityType } from "../profiles/profileTypes";
import { traditionSlug } from "../profiles/profileLinks";
import type { CommunityNarrative } from "./narrativeTypes";

type NarrativeBundle = { narratives?: CommunityNarrative[] };

const narratives = (bundle as NarrativeBundle).narratives ?? [];

function key(entityType: string, slug: string) {
  return `${entityType}:${slug}`;
}

const byKey = new Map(narratives.map((n) => [key(n.entityType, n.slug), n]));

export function getCommunityNarrative(entityType: ProfileEntityType | "event", slug: string): CommunityNarrative | null {
  return byKey.get(key(entityType, slug)) ?? null;
}

export function getNarrativeForEvent(event: CivicEvent): CommunityNarrative | null {
  const direct = getCommunityNarrative("event", event.slug);
  if (direct) return direct;

  const text = `${event.title} ${event.description ?? ""}`.toLowerCase();
  if (/festival|fair|daze|fest\b|watermelon|tomato|peach/.test(text)) {
    const festSlug = traditionSlug(event.slug.replace(/-\d{4}-\d{2}-\d{2}.*$/i, ""));
    const byFest = getCommunityNarrative("festival", festSlug);
    if (byFest) return byFest;
    for (const n of narratives) {
      if (n.entityType === "festival" && event.title.toLowerCase().includes(n.title.toLowerCase().slice(0, 12))) {
        return n;
      }
    }
  }
  return null;
}

export function listCommunityNarratives(entityType?: ProfileEntityType | "event"): CommunityNarrative[] {
  return entityType ? narratives.filter((n) => n.entityType === entityType) : [...narratives];
}

export function narrativeCoverageStats() {
  const byType: Record<string, number> = {};
  for (const n of narratives) {
    byType[n.entityType] = (byType[n.entityType] ?? 0) + 1;
  }
  return { total: narratives.length, byType };
}
