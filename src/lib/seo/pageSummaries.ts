import type { CivicEvent } from "../types";
import type { CityIntelligenceDossier, CountyIntelligenceDossier } from "../local-intelligence/types";
import type { PublicOrganizationProfile } from "../organizations/publicOrganizationDirectory";

function foodEvents(events: CivicEvent[]): CivicEvent[] {
  return events.filter((e) =>
    /fish fry|spaghetti|bbq|dinner|cookoff|supper|meal/i.test(`${e.title} ${e.description ?? ""}`) ||
    e.category === "faith_meal",
  );
}

function festivalEvents(events: CivicEvent[]): CivicEvent[] {
  return events.filter((e) => /festival|fair|parade|rodeo/i.test(e.title));
}

export function buildCityPageSummary(city: CityIntelligenceDossier, events: CivicEvent[]): string {
  const upcoming = events.length;
  const traditions = city.recurringEvents?.slice(0, 3).join("; ") || "annual community traditions";
  const food = foodEvents(events).length;
  const festivals = festivalEvents(events).length;
  return [
    `${city.city}, ${city.county} County, Arkansas — community calendar and local events.`,
    upcoming > 0 ? `${upcoming} upcoming events indexed.` : "Events being added by local hosts.",
    city.demographicsSummary ? city.demographicsSummary.slice(0, 200) : null,
    food > 0 ? `${food} food gatherings (fish fries, church dinners, community meals).` : null,
    festivals > 0 ? `${festivals} festivals and fairs.` : null,
    `Recurring traditions: ${traditions}.`,
    `Organizations active: ${(city.civicInstitutions ?? []).slice(0, 4).join(", ") || "churches, schools, civic clubs"}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildCountyPageSummary(dossier: CountyIntelligenceDossier, events: CivicEvent[]): string {
  const upcoming = events.length;
  const traditions = dossier.recurringTraditions?.slice(0, 4).join("; ") || "county fairs, church dinners, school events";
  return [
    `${dossier.county} County, Arkansas — what's happening this month.`,
    upcoming > 0 ? `${upcoming} community events on the calendar.` : "Help build the county calendar — submit an event.",
    dossier.demographicsSummary?.slice(0, 220) ?? `${dossier.region} Arkansas — towns include ${(dossier.majorTowns ?? []).slice(0, 5).join(", ")}.`,
    `Annual traditions: ${traditions}.`,
    foodEvents(events).length > 0 ? `Fish fries and community meals listed.` : null,
    `Community anchors: churches, schools, Extension offices, VFDs, chambers, Rotary, Farm Bureau.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildOrganizationSummary(org: PublicOrganizationProfile, events: CivicEvent[]): string {
  return [
    `${org.name} — ${org.city ? `${org.city}, ` : ""}${org.county} County, Arkansas.`,
    org.description,
    events.length > 0 ? `${events.length} upcoming events on Arkansas Everywhere.` : "Submit events to appear on the community calendar.",
    org.recurringTraditions?.length ? `Traditions: ${org.recurringTraditions.slice(0, 4).join("; ")}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Plain-text blocks for AI crawlers / future guide pages */
export function aiGuidePrompts(city?: string, county?: string): string[] {
  const loc = city ? `${city}, Arkansas` : county ? `${county} County, Arkansas` : "Arkansas";
  return [
    `What is happening in ${loc} this weekend?`,
    `Fish fries and church dinners near ${loc}`,
    `Volunteer opportunities in ${loc}`,
    `Festivals and community events in ${loc}`,
    `School and sports events in ${loc}`,
  ];
}
