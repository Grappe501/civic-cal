/**
 * Pass 32 — Local identity search patterns for festival density harvest.
 */

export const FESTIVAL_IDENTITY_SUFFIXES = [
  "festival",
  "summerfest",
  "fall festival",
  "spring festival",
  "Christmas parade",
  "Founders Day",
  "homecoming",
  "heritage day",
  "jubilee",
  "rodeo",
  "fairgrounds events",
  "downtown events",
  "chamber events",
  "food truck Friday",
  "concert in the park",
  "farmers market",
  "watermelon festival",
  "tomato festival",
  "peach festival",
  "crawfish festival",
  "chili cookoff",
  "BBQ cookoff",
  "music festival",
  "art walk",
  "Third Thursday",
  "First Friday",
  "movies in the park",
  "craft market",
  "flea market",
];

export const FESTIVAL_SEARCH_PATTERNS = [
  (city) => `${city} Arkansas festival 2026`,
  (city) => `${city} AR summer festival`,
  (city) => `${city} Arkansas food truck festival`,
  (city) => `${city} Arkansas music festival`,
  (city) => `${city} Arkansas parade 2026`,
  (city) => `${city} Arkansas fall festival`,
  (city) => `${city} Arkansas spring festival`,
  (city) => `${city} Arkansas Christmas parade`,
  (city) => `${city} Arkansas farmers market`,
  (city) => `${city} Arkansas parks recreation events`,
  (city) => `${city} Arkansas city calendar`,
  (city) => `${city} Arkansas chamber events`,
  ...FESTIVAL_IDENTITY_SUFFIXES.map((suffix) => (city) => `${city} Arkansas ${suffix}`),
];

export function buildCitySearchQueries(city) {
  return FESTIVAL_SEARCH_PATTERNS.map((fn) => fn(city));
}

export function buildCountyFestivalQueries(county) {
  return [
    `${county} County Arkansas fair 2026`,
    `${county} County Arkansas festival`,
    `${county} County Arkansas rodeo`,
    `${county} County Arkansas fairgrounds events`,
  ];
}
