import type { CivicEvent } from "../types";
import type { PublicOrganizationProfile } from "../organizations/publicOrganizationDirectory";

const SITE = "https://arkansaseverywhere.org";
const SITE_NAME = "Arkansas Everywhere — Community Calendar";

export function eventJsonLd(event: CivicEvent, description?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: description ?? event.description ?? `${event.title} in ${event.city ?? event.county} County, Arkansas`,
    startDate: event.startAt,
    endDate: event.endAt ?? event.startAt,
    eventAttendanceMode: event.isOnlineOnly ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: event.isOnlineOnly
      ? { "@type": "VirtualLocation", url: event.websiteUrl ?? SITE }
      : {
          "@type": "Place",
          name: event.locationName ?? event.city ?? event.county,
          address: {
            "@type": "PostalAddress",
            addressLocality: event.city ?? undefined,
            addressRegion: "AR",
            addressCountry: "US",
            streetAddress: event.address ?? undefined,
          },
        },
    organizer: event.hostOrganization
      ? { "@type": "Organization", name: event.hostOrganization }
      : undefined,
    url: `${SITE}/event/${event.slug}`,
    isAccessibleForFree: event.isFree ?? undefined,
  };
}

export function cityPageJsonLd(city: string, county: string, summary: string, eventCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Events in ${city}, Arkansas`,
    description: summary,
    about: {
      "@type": "City",
      name: city,
      containedInPlace: { "@type": "AdministrativeArea", name: `${county} County, Arkansas` },
    },
    mainEntity: {
      "@type": "ItemList",
      name: `Upcoming events in ${city}`,
      numberOfItems: eventCount,
    },
    url: `${SITE}/${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE },
  };
}

export function countyPageJsonLd(county: string, summary: string, eventCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${county} County Arkansas Events`,
    description: summary,
    about: {
      "@type": "AdministrativeArea",
      name: `${county} County`,
      containedInPlace: { "@type": "State", name: "Arkansas" },
    },
    mainEntity: {
      "@type": "ItemList",
      name: `Events in ${county} County`,
      numberOfItems: eventCount,
    },
    url: `${SITE}/${county.toLowerCase().replace(/\s+/g, "-")}-county`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE },
  };
}

export function organizationJsonLd(org: PublicOrganizationProfile, eventCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name.replace(/\s*—\s*verify.*$/i, ""),
    url: org.website ?? `${SITE}/organization/${org.slug}`,
    description: org.description ?? `${org.name} — ${org.city ? `${org.city}, ` : ""}${org.county} County, Arkansas`,
    areaServed: { "@type": "AdministrativeArea", name: `${org.county} County, Arkansas` },
    knowsAbout: org.recurringTraditions,
    event: eventCount > 0 ? { "@type": "ItemList", numberOfItems: eventCount } : undefined,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["Arkansas Community Calendar", "Arkansas Events", "Arkansas Community Intelligence"],
    url: SITE,
    description: "Statewide Arkansas community calendar — festivals, church dinners, school events, races, and local gatherings in all 75 counties.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
