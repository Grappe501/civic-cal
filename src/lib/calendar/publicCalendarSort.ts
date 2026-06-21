/**
 * Public calendar sort — community-first, no party preference.
 * Campaign/admin views use campaignPriorityScore instead.
 */
import type { CivicEvent } from "../types";

/** Lower rank = higher on same day/time band (community anchors before party meetings). */
const PUBLIC_EVENT_TYPE_RANK: Record<string, number> = {
  civic_meeting: 10,
  government_deadline: 10,
  community: 20,
  faith_meal: 25,
  community_church: 25,
  volunteer: 30,
  food_truck_festival: 35,
  culture: 40,
  public_party_meeting: 50,
  candidate_event: 55,
};

function eventTypeRank(event: CivicEvent): number {
  if (event.category && PUBLIC_EVENT_TYPE_RANK[event.category] != null) {
    return PUBLIC_EVENT_TYPE_RANK[event.category];
  }
  if (/festival|fair|parade/i.test(event.title)) return 35;
  if (/fish fry|spaghetti|church/i.test(event.title)) return 25;
  return 45;
}

function communityImportance(event: CivicEvent): number {
  let score = 0;
  if (event.featured) score += 100;
  if (event.highCivicValue) score += 40;
  if (event.isFamilyFriendly) score += 5;
  if (event.isFree) score += 3;
  return score;
}

function startMs(event: CivicEvent): number {
  const t = new Date(event.startAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Compare two events for public calendar display (ascending = soonest first). */
export function comparePublicCalendarEvents(a: CivicEvent, b: CivicEvent): number {
  const ta = startMs(a);
  const tb = startMs(b);
  if (ta !== tb) return ta - tb;

  const imp = communityImportance(b) - communityImportance(a);
  if (imp !== 0) return imp;

  const typeDiff = eventTypeRank(a) - eventTypeRank(b);
  if (typeDiff !== 0) return typeDiff;

  return String(a.title ?? "").localeCompare(String(b.title ?? ""), undefined, { sensitivity: "base" });
}

export function sortPublicCalendarEvents(events: CivicEvent[]): CivicEvent[] {
  return [...events].sort(comparePublicCalendarEvents);
}

/** Featured / high-civic events for optional public highlights (not campaign scoring). */
export function selectPublicCalendarHighlights(events: CivicEvent[], limit = 5): CivicEvent[] {
  const pool = events.filter((e) => e.featured || e.highCivicValue);
  return sortPublicCalendarEvents(pool.length > 0 ? pool : events).slice(0, limit);
}
