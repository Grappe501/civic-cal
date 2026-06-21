import type { CivicEvent } from "../types";

const FESTIVAL_RE =
  /festival|fair\b|rodeo|parade|heritage|watermelon|peach|tomato|grape|crawdad|crawfish|gumbo|cook-?off|blues fest|music fest|folklife|scotsfest|toad suck|beanfest|picklefest/i;

/** Approved fair/festival harvest bundle events */
export function isFairFestivalHarvestEvent(event: CivicEvent): boolean {
  return event.id.startsWith("fest-harvest-") || Boolean(event.harvestBatch?.includes("fair_festival"));
}

/** Calendar badge — source-backed fairs, festivals, food & music events */
export function isFairFestivalEvent(event: CivicEvent): boolean {
  if (isFairFestivalHarvestEvent(event)) return true;
  if (event.festivalCategory) return true;
  if (event.category === "food_truck_festival") return true;
  if (event.intelligenceLayer === "community_identity" && FESTIVAL_RE.test(event.title)) return true;
  return FESTIVAL_RE.test(`${event.title} ${event.description ?? ""}`) && event.category === "community";
}
