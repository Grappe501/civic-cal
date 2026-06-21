import { isThisWeek, isWeekend, nextSaturday, addDays, startOfDay, endOfDay } from "date-fns";
import type { CivicEvent } from "../types";
import { getEventPresence } from "../campaigns/presenceLayer";
import { eventHasPublicVolunteerAsk } from "../campaigns/volunteerRecruitment";
import { scoreEventForCampaign } from "../campaigns/eventIntel";
import { chipById } from "./chips";
import { isRaceEvent, matchRaceCategory } from "./raceCategories";
import type { DiscoveryChipId, ExploreIntent, SafariPreferences, RaceCategoryId } from "./types";

function eventText(e: CivicEvent): string {
  return `${e.title} ${e.description ?? ""} ${e.category} ${e.hostOrganization ?? ""}`;
}

export function filterByChip(events: CivicEvent[], chipId: DiscoveryChipId): CivicEvent[] {
  const chip = chipById(chipId);
  if (!chip) return events;

  if (chipId === "family") {
    return events.filter((e) => e.isFamilyFriendly || /family|kids|children/i.test(eventText(e)));
  }
  if (chipId === "highest_attendance") {
    return [...events]
      .sort((a, b) => attendanceScore(b) - attendanceScore(a))
      .slice(0, 40);
  }
  if (chipId === "highest_rd") {
    return [...events]
      .sort((a, b) => (b.relationshipDensityScore ?? scoreEventForCampaign(b).relationshipDensityScore) - (a.relationshipDensityScore ?? scoreEventForCampaign(a).relationshipDensityScore))
      .slice(0, 40);
  }
  if (chipId === "candidate_presence") {
    return events.filter((e) => {
      const p = getEventPresence(e.id);
      return p.publicBadges.length > 0 || e.category === "candidate_event" || e.candidateRelevant;
    });
  }

  if (chipId === "young_arkansas") {
    return events.filter((e) =>
      /concert|music festival|food truck|open mic|college|intramural|esports|gaming|comic|anime|theater|youth|young/i.test(eventText(e)) ||
      e.category === "culture",
    );
  }

  if (chipId === "food_trail") {
    return events.filter((e) =>
      /fish fry|spaghetti|wild game|chili cook|bbq cook|pancake breakfast|catfish|crawfish|pie contest|church supper|community meal/i.test(eventText(e)) ||
      e.category === "faith_meal",
    );
  }

  if (chipId === "parades") {
    return events.filter((e) => /parade/i.test(eventText(e)));
  }

  if (chipId === "campaign_volunteer_opportunities") {
    return events.filter((e) => eventHasPublicVolunteerAsk(e.id));
  }

  if (chipId === "community_anchors") {
    return events.filter((e) =>
      /cooperative extension|extension office|4-h|homemaker|volunteer fire|vfd|master gardener|livestock show|farm bureau|pancake breakfast fundraiser/i.test(eventText(e)),
    );
  }

  return events.filter((e) => {
    if (chip.categories?.includes(e.category)) return true;
    if (chip.keywords?.test(eventText(e))) return true;
    return false;
  });
}

function attendanceScore(e: CivicEvent): number {
  const band = e.typicalAttendanceBand;
  const bandScore = band === "massive" ? 100 : band === "large" ? 80 : band === "medium" ? 55 : band === "small" ? 30 : 40;
  return bandScore + (e.featured ? 20 : 0) + (e.highCivicValue ? 15 : 0);
}

export function exploreByIntent(events: CivicEvent[], intent: ExploreIntent): CivicEvent[] {
  const now = new Date();
  const weekendStart = startOfDay(nextSaturday(now));
  const weekendEnd = endOfDay(addDays(weekendStart, 1));

  switch (intent) {
    case "near_me":
      // Without geolocation, surface this-weekend events statewide as "near Arkansas"
      return events.filter((e) => {
        const d = new Date(e.startAt);
        return d >= startOfDay(now) && d <= addDays(now, 14);
      }).slice(0, 30);

    case "busiest_weekend":
      return [...events]
        .filter((e) => {
          const d = new Date(e.startAt);
          return d >= weekendStart && d <= weekendEnd;
        })
        .sort((a, b) => attendanceScore(b) - attendanceScore(a))
        .slice(0, 25);

    case "hidden_gems":
      return events
        .filter((e) => !e.featured && (e.highCivicValue || e.isRecurring || (e.relationshipDensityScore ?? 0) >= 65))
        .slice(0, 25);

    case "worth_the_drive":
      return [...events]
        .filter((e) => e.featured || e.highCivicValue || attendanceScore(e) >= 70)
        .sort((a, b) => attendanceScore(b) - attendanceScore(a))
        .slice(0, 20);

    case "candidate_presence":
      return filterByChip(events, "candidate_presence");

    default:
      return events;
  }
}

export function filterSafari(events: CivicEvent[], prefs: SafariPreferences): CivicEvent[] {
  let list = [...events];
  const maxDays =
    prefs.driveTime === "15" ? 3 : prefs.driveTime === "30" ? 7 : prefs.driveTime === "60" ? 14 : prefs.driveTime === "120" ? 30 : 90;
  const horizon = addDays(new Date(), maxDays);
  list = list.filter((e) => new Date(e.startAt) <= horizon);

  if (prefs.interests.length === 0) return list.slice(0, 30);

  list = list.filter((e) => {
    const text = eventText(e);
    return prefs.interests.some((interest) => {
      switch (interest) {
        case "food": return /dinner|bbq|fish fry|meal|food/i.test(text);
        case "music": return e.category === "culture" || /music|concert/i.test(text);
        case "community": return e.category === "community" || /festival|fair|parade/i.test(text);
        case "politics": return e.category === "civic_meeting" || e.candidateRelevant || e.category === "candidate_event";
        case "sports": return e.category === "school" || /game|sport/i.test(text);
        case "running": return isRaceEvent(e.title, e.description);
        case "faith": return /church|faith|fish fry/i.test(text) || e.category === "faith_meal";
        case "kids": return e.isFamilyFriendly || /kids|family|youth/i.test(text);
        case "volunteer": return e.category === "volunteer";
        default: return false;
      }
    });
  });

  return list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()).slice(0, 24);
}

export function filterRaces(events: CivicEvent[], category?: RaceCategoryId): CivicEvent[] {
  let list = events.filter((e) => isRaceEvent(e.title, e.description));
  if (category) {
    list = list.filter((e) => matchRaceCategory(`${e.title} ${e.description ?? ""}`, category));
  }
  return list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

export function busiestTownsThisWeekend(events: CivicEvent[]): { city: string; county: string; count: number }[] {
  const weekendEvents = events.filter((e) => isWeekend(new Date(e.startAt)) && isThisWeek(new Date(e.startAt), { weekStartsOn: 0 }));
  const byCity = new Map<string, { city: string; county: string; count: number }>();
  for (const e of weekendEvents) {
    const city = e.city || "Unlisted";
    const key = `${city}|${e.county}`;
    const row = byCity.get(key) ?? { city, county: e.county, count: 0 };
    row.count += 1;
    byCity.set(key, row);
  }
  return [...byCity.values()].sort((a, b) => b.count - a.count).slice(0, 8);
}

export function eventsWithPublicPresence(events: CivicEvent[]): CivicEvent[] {
  return events.filter((e) => getEventPresence(e.id).publicBadges.length > 0);
}
