/**
 * Expanded search query templates for Arkansas city harvest (Pass 8 + Church Event Engine).
 */
import { buildChurchEventQueries } from "./church-event-queries.mjs";
import { buildCommunityAnchorQueries } from "./community-anchor-queries.mjs";

export function buildExpandedCityQueries(cityRecord) {
  const { city, county } = cityRecord;
  const queries = [
    `${city} Arkansas events 2026`,
    `${city} AR calendar`,
    `${city} Arkansas chamber events`,
    `${city} Arkansas city council meeting schedule`,
    `${city} Arkansas school board meeting schedule`,
    `${city} Arkansas festival 2026`,
    `${city} Arkansas fair 2026`,
    `${city} Arkansas church dinner`,
    `${city} Arkansas fish fry`,
    `${city} Arkansas BBQ fundraiser`,
    `${city} Arkansas concert in the park`,
    `${city} Arkansas Third Thursday`,
    `${city} Arkansas First Friday`,
    `${city} Arkansas farmers market`,
    `${city} Arkansas homecoming`,
    `${city} Arkansas football schedule`,
    `${city} Arkansas high school basketball`,
    `${city} Arkansas band competition`,
  ];
  if (county) {
    queries.push(`${county} County Arkansas quorum court schedule`);
    queries.push(`${county} County Arkansas fair 2026`);
  }
  return [...queries, ...buildChurchEventQueries(cityRecord), ...buildCommunityAnchorQueries(cityRecord)];
}

export function discoverSourceTemplates(cityRecord) {
  const slug = cityRecord.city.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const countySlug = (cityRecord.county || "").toLowerCase().replace(/\s+/g, "");
  return [
    { source_type: "city_official", label: `${cityRecord.city} city calendar`, url_hint: `https://www.${slug}ar.gov`, trust: "medium" },
    { source_type: "county_official", label: `${cityRecord.county} County calendar`, url_hint: `https://www.${countySlug}countyar.gov`, trust: "medium" },
    { source_type: "chamber", label: `${cityRecord.city} chamber of commerce`, url_hint: `https://www.google.com/search?q=${encodeURIComponent(cityRecord.city + " Arkansas chamber events")}`, trust: "medium" },
    { source_type: "library", label: `${cityRecord.city} public library events`, url_hint: null, trust: "medium" },
    { source_type: "parks_rec", label: `${cityRecord.city} parks and recreation`, url_hint: null, trust: "medium" },
    { source_type: "school_district", label: `${cityRecord.city} school district calendar`, url_hint: null, trust: "medium" },
    { source_type: "church_community", label: `${cityRecord.city} church community meals`, url_hint: null, trust: "medium", institution_layer: "church_event_engine" },
    { source_type: "tourism", label: `${cityRecord.city} tourism / CVB events`, url_hint: null, trust: "medium", tier: 1 },
    { source_type: "extension", label: `${cityRecord.county} County Cooperative Extension`, url_hint: null, trust: "medium", tier: 2, institution_layer: "extension" },
    { source_type: "four_h", label: `${cityRecord.county} County 4-H events`, url_hint: null, trust: "medium", tier: 2 },
    { source_type: "farm_bureau", label: `${cityRecord.county} County Farm Bureau`, url_hint: null, trust: "medium", tier: 2 },
    { source_type: "vfd", label: `${cityRecord.city} volunteer fire department fundraisers`, url_hint: null, trust: "medium", tier: 2, institution_layer: "vfd" },
    { source_type: "rotary_civic", label: `${cityRecord.city} Rotary / Lions / Kiwanis`, url_hint: null, trust: "medium", tier: 3 },
    { source_type: "farmers_market", label: `${cityRecord.city} farmers market`, url_hint: null, trust: "medium", tier: 4 },
  ];
}
