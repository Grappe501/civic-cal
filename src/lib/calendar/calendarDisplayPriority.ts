/**
 * Compact calendar cell visibility — which events earn a visible slot before "+ more".
 * Not campaign scoring; not full-list sort. Use publicCalendarSort for chronological lists.
 */
import type { CivicEvent } from "../types";
import { isFairFestivalEvent } from "../events/festivalUtils";
import { comparePublicCalendarEvents } from "./publicCalendarSort";

export type CalendarDisplayContext = "month_cell" | "week_cell" | "day_cell" | "audit";

export type DisplayPriorityTier =
  | "democratic_party_meeting"
  | "fair"
  | "festival"
  | "major_civic"
  | "school_community"
  | "republican_party_meeting"
  | "other_party_civic"
  | "routine";

export type CalendarDisplayPinLabel = "Dem meeting" | "Fair" | "Festival" | null;

export interface CalendarDisplayPriorityResult {
  tier: DisplayPriorityTier;
  /** Lower = higher visibility (1 is best). */
  rank: number;
}

const TIER_RANK: Record<DisplayPriorityTier, number> = {
  democratic_party_meeting: 1,
  fair: 2,
  festival: 3,
  major_civic: 4,
  school_community: 5,
  republican_party_meeting: 6,
  other_party_civic: 7,
  routine: 8,
};

export function isDemocraticCountyPartyMeeting(event: CivicEvent): boolean {
  if (event.category !== "public_party_meeting") return false;
  const party = String(event.partyLabel ?? "").toLowerCase();
  if (party === "democratic") return true;
  return /democratic.*(county|central)\s+(committee|party)/i.test(event.title);
}

export function isRepublicanCountyPartyMeeting(event: CivicEvent): boolean {
  if (event.category !== "public_party_meeting") return false;
  const party = String(event.partyLabel ?? "").toLowerCase();
  if (party === "republican") return true;
  return /republican.*(county|central)\s+(committee|party)/i.test(event.title);
}

export function isCountyFairEvent(event: CivicEvent): boolean {
  if (event.harvestBatch?.includes("county_fair")) return true;
  if (event.recurringRegistryId?.includes("county-fair")) return true;
  if (/county fair|fairgrounds|livestock show/i.test(event.title)) return true;
  if (isFairFestivalEvent(event) && /fair\b/i.test(event.title) && !/festival/i.test(event.title)) return true;
  return false;
}

export function isFestivalOnlyEvent(event: CivicEvent): boolean {
  if (isCountyFairEvent(event)) return false;
  if (event.category === "food_truck_festival") return true;
  if (event.festivalCategory) return true;
  if (isFairFestivalEvent(event)) return true;
  return /festival|jubilee|celebration|watermelon|peach|tomato|strawberry|crawfish/i.test(event.title);
}

function isMajorCivicEvent(event: CivicEvent): boolean {
  if (event.featured || event.highCivicValue) return true;
  if (event.category === "civic_meeting" || event.category === "government_deadline") return true;
  if (event.isPublicGovernmentMeeting) return true;
  if (event.category === "volunteer") return true;
  if (event.category === "community" && (event.featured || event.highCivicValue)) return true;
  return false;
}

function isSchoolCommunityEvent(event: CivicEvent): boolean {
  if (event.category === "school") return true;
  if (event.category === "community" || event.category === "community_church" || event.category === "faith_meal") {
    return true;
  }
  if (event.category === "culture") return true;
  return false;
}

function isOtherPartyCivicMeeting(event: CivicEvent): boolean {
  if (event.category === "public_party_meeting") return true;
  if (event.category === "candidate_event") return true;
  return false;
}

export function getCalendarDisplayPriority(
  event: CivicEvent,
  _context: CalendarDisplayContext = "month_cell",
): CalendarDisplayPriorityResult {
  let tier: DisplayPriorityTier = "routine";

  if (isDemocraticCountyPartyMeeting(event)) tier = "democratic_party_meeting";
  else if (isCountyFairEvent(event)) tier = "fair";
  else if (isFestivalOnlyEvent(event)) tier = "festival";
  else if (isMajorCivicEvent(event)) tier = "major_civic";
  else if (isSchoolCommunityEvent(event)) tier = "school_community";
  else if (isRepublicanCountyPartyMeeting(event)) tier = "republican_party_meeting";
  else if (isOtherPartyCivicMeeting(event)) tier = "other_party_civic";

  return { tier, rank: TIER_RANK[tier] };
}

export function compareCalendarDisplayPriority(
  a: CivicEvent,
  b: CivicEvent,
  context: CalendarDisplayContext = "month_cell",
): number {
  const pa = getCalendarDisplayPriority(a, context);
  const pb = getCalendarDisplayPriority(b, context);
  if (pa.rank !== pb.rank) return pa.rank - pb.rank;
  return comparePublicCalendarEvents(a, b);
}

export function sortByCalendarDisplayPriority(
  events: CivicEvent[],
  context: CalendarDisplayContext = "month_cell",
): CivicEvent[] {
  return [...events].sort((a, b) => compareCalendarDisplayPriority(a, b, context));
}

/** Must-show tiers when crowding would hide them behind "+ more". */
const RESERVED_TIERS = new Set<DisplayPriorityTier>([
  "democratic_party_meeting",
  "fair",
  "festival",
]);

/**
 * Pick events for compact cells (month/week) before the "+ more" cutoff.
 * Reserves slots for Dem meetings, fairs, and festivals when present.
 */
export function selectVisibleCalendarEvents(
  events: CivicEvent[],
  limit = 3,
  context: CalendarDisplayContext = "month_cell",
): CivicEvent[] {
  if (events.length <= limit) return sortByCalendarDisplayPriority(events, context);

  const sorted = sortByCalendarDisplayPriority(events, context);
  const visible: CivicEvent[] = [];
  const seen = new Set<string>();

  function push(event: CivicEvent) {
    if (visible.length >= limit || seen.has(event.id)) return;
    seen.add(event.id);
    visible.push(event);
  }

  for (const event of sorted) {
    const { tier } = getCalendarDisplayPriority(event, context);
    if (RESERVED_TIERS.has(tier)) push(event);
  }

  for (const event of sorted) {
    push(event);
    if (visible.length >= limit) break;
  }

  return visible;
}

export function getCalendarDisplayPinLabel(event: CivicEvent): CalendarDisplayPinLabel {
  if (isDemocraticCountyPartyMeeting(event)) return "Dem meeting";
  if (isCountyFairEvent(event)) return "Fair";
  if (isFestivalOnlyEvent(event)) return "Festival";
  return null;
}

/** Legacy naive visibility — first N after chronological public sort (pre-fix behavior). */
export function selectNaiveVisibleCalendarEvents(events: CivicEvent[], limit = 3): CivicEvent[] {
  return [...events].sort(comparePublicCalendarEvents).slice(0, limit);
}

export interface CrowdedDayAuditRow {
  date: string;
  totalEvents: number;
  naiveVisibleTitles: string[];
  priorityVisibleTitles: string[];
  hiddenDemMeetings: string[];
  hiddenFairs: string[];
  hiddenFestivals: string[];
  hadVisibilityBug: boolean;
}

export function auditCrowdedCalendarDays(
  events: CivicEvent[],
  limit = 3,
): CrowdedDayAuditRow[] {
  const byDate = new Map<string, CivicEvent[]>();

  for (const event of events) {
    const key = event.startAt?.slice(0, 10);
    if (!key) continue;
    const list = byDate.get(key) ?? [];
    list.push(event);
    byDate.set(key, list);
  }

  const rows: CrowdedDayAuditRow[] = [];

  for (const [date, dayEvents] of byDate) {
    if (dayEvents.length <= limit) continue;

    const naive = selectNaiveVisibleCalendarEvents(dayEvents, limit);
    const priority = selectVisibleCalendarEvents(dayEvents, limit, "audit");
    const priorityIds = new Set(priority.map((e) => e.id));
    const naiveIds = new Set(naive.map((e) => e.id));

    const hiddenDem = dayEvents.filter(
      (e) => isDemocraticCountyPartyMeeting(e) && !priorityIds.has(e.id),
    );
    const hiddenFair = dayEvents.filter((e) => isCountyFairEvent(e) && !priorityIds.has(e.id));
    const hiddenFest = dayEvents.filter(
      (e) => isFestivalOnlyEvent(e) && !priorityIds.has(e.id),
    );

    const naiveHiddenReserved = dayEvents.filter((e) => {
      const { tier } = getCalendarDisplayPriority(e, "audit");
      return RESERVED_TIERS.has(tier) && !naiveIds.has(e.id);
    });

    const hadBug = naiveHiddenReserved.length > 0;

    rows.push({
      date,
      totalEvents: dayEvents.length,
      naiveVisibleTitles: naive.map((e) => e.title),
      priorityVisibleTitles: priority.map((e) => e.title),
      hiddenDemMeetings: hiddenDem.map((e) => e.title),
      hiddenFairs: hiddenFair.map((e) => e.title),
      hiddenFestivals: hiddenFest.filter((e) => !priorityIds.has(e.id)).map((e) => e.title),
      hadVisibilityBug: hadBug,
    });
  }

  return rows.sort(
    (a, b) =>
      Number(b.hadVisibilityBug) - Number(a.hadVisibilityBug) || a.date.localeCompare(b.date),
  );
}

/** QA fixture — crowded day with GOP, Dem, fair, festival, and filler events. */
export function buildCalendarDisplayPriorityQaFixtures(): CivicEvent[] {
  const day = "2026-07-15T";
  const base = {
    county: "Pulaski",
    city: "Little Rock",
    status: "approved" as const,
    category: "community" as const,
  };

  return [
    {
      ...base,
      id: "qa-gop",
      slug: "qa-gop-meeting",
      title: "Pulaski County Republican Committee Meeting",
      category: "public_party_meeting",
      partyLabel: "Republican",
      startAt: `${day}18:00:00.000Z`,
    },
    {
      ...base,
      id: "qa-dem",
      slug: "qa-dem-meeting",
      title: "Pulaski County Democratic Central Committee",
      category: "public_party_meeting",
      partyLabel: "Democratic",
      startAt: `${day}19:00:00.000Z`,
    },
    {
      ...base,
      id: "qa-fair",
      slug: "qa-county-fair",
      title: "Pulaski County Fair",
      harvestBatch: "county_fair",
      startAt: `${day}10:00:00.000Z`,
      allDay: true,
    },
    {
      ...base,
      id: "qa-festival",
      slug: "qa-watermelon-festival",
      title: "Hope Watermelon Festival",
      festivalCategory: "watermelon",
      startAt: `${day}11:00:00.000Z`,
    },
    {
      ...base,
      id: "qa-book-club",
      slug: "qa-book-club",
      title: "Library book club",
      startAt: `${day}14:00:00.000Z`,
    },
    {
      ...base,
      id: "qa-yoga",
      slug: "qa-yoga",
      title: "Community yoga",
      startAt: `${day}15:00:00.000Z`,
    },
    {
      ...base,
      id: "qa-cleanup",
      slug: "qa-cleanup",
      title: "Neighborhood cleanup",
      startAt: `${day}16:00:00.000Z`,
    },
  ];
}

export function runCalendarDisplayPrioritySelfTest(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const fixtures = buildCalendarDisplayPriorityQaFixtures();
  const visible = selectVisibleCalendarEvents(fixtures, 3, "audit");

  if (visible.length !== 3) errors.push(`Expected 3 visible, got ${visible.length}`);
  if (visible[0]?.id !== "qa-dem") errors.push(`Slot 1 should be Dem meeting, got ${visible[0]?.title}`);
  if (visible[1]?.id !== "qa-fair") errors.push(`Slot 2 should be fair, got ${visible[1]?.title}`);
  if (visible[2]?.id !== "qa-festival") errors.push(`Slot 3 should be festival, got ${visible[2]?.title}`);

  const hiddenIds = new Set(fixtures.filter((e) => !visible.some((v) => v.id === e.id)).map((e) => e.id));
  if (!hiddenIds.has("qa-gop")) errors.push("Republican meeting should be behind + more");

  return { ok: errors.length === 0, errors };
}
