/**
 * Base data for all 75 Arkansas county fair lane records.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const COUNTIES_PATH = path.join(ROOT, "data/arkansas-counties.json");

/** County seat / primary fair city when known from public fair guides */
export const COUNTY_FAIR_CITIES = {
  Arkansas: "DeWitt",
  Ashley: "Hamburg",
  Baxter: "Mountain Home",
  Benton: "Bentonville",
  Boone: "Harrison",
  Bradley: "Warren",
  Calhoun: "Hampton",
  Carroll: "Berryville",
  Chicot: "Eudora",
  Clark: "Arkadelphia",
  Clay: "Piggott",
  Cleburne: "Heber Springs",
  Cleveland: "Rison",
  Columbia: "Magnolia",
  Conway: "Morrilton",
  Craighead: "Jonesboro",
  Crawford: "Mulberry",
  Crittenden: "West Memphis",
  Cross: "Wynne",
  Dallas: "Fordyce",
  Desha: "McGehee",
  Drew: "Monticello",
  Faulkner: "Conway",
  Franklin: "Ozark",
  Fulton: "Salem",
  Garland: "Hot Springs",
  Grant: "Sheridan",
  Greene: "Paragould",
  Hempstead: "Hope",
  "Hot Spring": "Malvern",
  Howard: "Nashville",
  Independence: "Batesville",
  Izard: "Melbourne",
  Jackson: "Newport",
  Jefferson: "Pine Bluff",
  Johnson: "Clarksville",
  Lafayette: "Lewisville",
  Lawrence: "Imboden",
  Lee: "Marianna",
  Lincoln: "Star City",
  "Little River": "Ashdown",
  Logan: "Paris",
  Lonoke: "Lonoke",
  Madison: "Huntsville",
  Marion: "Summit",
  Miller: "Fouke",
  Mississippi: "Osceola",
  Monroe: "Clarendon",
  Montgomery: "Mount Ida",
  Nevada: "Prescott",
  Newton: "Jasper",
  Ouachita: "Camden",
  Perry: "Perryville",
  Phillips: "Helena-West Helena",
  Pike: "Glenwood",
  Poinsett: "Harrisburg",
  Polk: "Mena",
  Pope: "Russellville",
  Prairie: "Hazen",
  Pulaski: "North Little Rock",
  Randolph: "Pocahontas",
  "St. Francis": "Forrest City",
  Saline: "Benton",
  Scott: "Waldron",
  Searcy: "Marshall",
  Sebastian: "Greenwood",
  Sevier: "De Queen",
  Sharp: "Ash Flat",
  Stone: "Mountain View",
  Union: "El Dorado",
  "Van Buren": "Clinton",
  Washington: "Fayetteville",
  White: "Searcy",
  Woodruff: "McCrory",
  Yell: "Danville",
};

/** Known official county fair site patterns (public URLs only) */
export const OFFICIAL_FAIR_URLS = {
  Fulton: "https://www.fultoncountyfair.net/",
  Baxter: "https://www.baxtercountyfair.org/",
  Lonoke: "https://www.lonokecountyfair.com/",
  Columbia: "https://www.columbiacountyfair.com/",
  Yell: "https://yellcountyfair.com/",
  Pope: "https://popecountyfair.com/",
  Prairie: "https://www.prairiefaircountyar.com/",
  Union: "https://www.unioncountyfair.net/",
  Sebastian: "https://www.sebastiancountyfair.com/",
  Benton: "https://www.bentoncountyfair.net/",
  Washington: "https://www.washingtoncountyfair.com/",
  Saline: "https://www.salinecountyfair.com/",
  Cleburne: "https://www.cleburnecountyfair.com/",
  Boone: "https://www.districtfair.com/",
  Garland: "https://www.garlandcountyfair.com/",
  Pulaski: "https://www.pulaskicountyfair.com/",
};

/** Secondary public sources — tourism, extension, chamber (Pass 29B search strategy) */
export const SECONDARY_FAIR_SOURCES = {
  Columbia: [
    { url: "https://arksouth.org/events/columbia-county-fair-livestock-show/", type: "tourism_cvb_page", label: "Arkansas South Tourism" },
  ],
  Lonoke: [{ url: "https://cofairs.com/arkansas/lonoke-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Yell: [{ url: "https://cofairs.com/arkansas/yell-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Pope: [{ url: "https://cofairs.com/arkansas/pope-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Prairie: [{ url: "https://cofairs.com/arkansas/prairie-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
};

export function fairSearchPatterns(county) {
  return [
    `${county} County Fair 2026 Arkansas`,
    `${county} County Fairgrounds 2026`,
    `${county} County Fair livestock show 2026`,
    `${county} County Fair schedule Arkansas`,
    `${county} County Fair Association Arkansas`,
    `${county} County Fair Facebook 2026`,
    `${county} County Fair 4-H Arkansas`,
    `${county} County Fair Extension Arkansas`,
  ];
}

export function countySlug(county) {
  return county
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "-");
}

export function cofairsSlugForCounty(county) {
  const variants = [
    `${countySlug(county)}-county-fair`,
    `${countySlug(county)}-county-fair-livestock-show`,
    `${countySlug(county)}-county-fair-rodeo`,
  ];
  if (county === "Cleburne") variants.unshift("cleburne-county-fair-livestock-show");
  if (county === "Marion") variants.unshift("marion-county-fair-livestock-show");
  if (county === "Pike") variants.unshift("pike-county-fair-rodeo");
  return variants;
}

export function loadCounties() {
  const bundle = JSON.parse(fs.readFileSync(COUNTIES_PATH, "utf8"));
  return bundle.counties ?? [];
}

export function buildCountyFairRecord(county) {
  const id = `${countySlug(county)}-county-fair`;
  return {
    id,
    fair_name: `${county} County Fair`,
    county,
    city: COUNTY_FAIR_CITIES[county] ?? null,
    venue: `${county} County Fairgrounds`,
    address: null,
    date_start: null,
    date_end: null,
    schedule_url: null,
    official_url: OFFICIAL_FAIR_URLS[county] ?? null,
    cofairs_url: `https://cofairs.com/arkansas/${countySlug(county)}-county-fair`,
    facebook_url: null,
    ticket_url: null,
    vendor_url: null,
    livestock_url: null,
    pageant_url: null,
    parade_url: null,
    carnival_url: null,
    rodeo_url: null,
    demolition_derby_url: null,
    parking_info: null,
    admission_info: null,
    source_confidence: "placeholder",
    information_last_refreshed: null,
    verification_status: "needs_date_confirmation",
    source_url: null,
    notes: null,
  };
}

export function buildAllCountyFairRecords() {
  return loadCounties().map(buildCountyFairRecord);
}

export const REGIONAL_FAIRS = [
  {
    id: "arkansas-state-fair",
    fair_name: "Arkansas State Fair",
    county: "Pulaski",
    city: "Little Rock",
    venue: "Arkansas State Fairgrounds",
    address: "2600 Howard Street, Little Rock, AR 72206",
    official_url: "https://www.arkansasstatefair.com/",
    cofairs_url: "https://cofairs.com/arkansas/arkansas-state-fair",
    category: "state_fair",
    source_type: "official_festival_website",
  },
  {
    id: "nea-district-fair",
    fair_name: "NEA District Fair",
    county: "Craighead",
    city: "Jonesboro",
    venue: "NEA District Fairgrounds",
    official_url: null,
    cofairs_url: "https://cofairs.com/arkansas/nea-district-fair",
    category: "regional_fair",
    source_type: "fair_guide_page",
  },
  {
    id: "northwest-arkansas-district-fair",
    fair_name: "Northwest Arkansas District Fair",
    county: "Boone",
    city: "Harrison",
    venue: "Northwest Arkansas District Fairgrounds",
    address: "1400 Fairgrounds Rd, Harrison, AR 72601",
    official_url: "https://www.districtfair.com/",
    cofairs_url: "https://cofairs.com/arkansas/northwest-arkansas-district-fair",
    category: "regional_fair",
    source_type: "official_festival_website",
  },
  {
    id: "three-county-fair",
    fair_name: "Three County Fair",
    county: "Woodruff",
    city: "McCrory",
    venue: "Three County Fairgrounds",
    official_url: null,
    cofairs_url: "https://cofairs.com/arkansas/three-county-fair",
    category: "regional_fair",
    source_type: "fair_guide_page",
  },
  {
    id: "north-franklin-county-fair",
    fair_name: "North Franklin County Fair",
    county: "Franklin",
    city: "Ozark",
    venue: "North Franklin County Fairgrounds",
    official_url: null,
    cofairs_url: "https://cofairs.com/arkansas/north-franklin-county-fair",
    category: "regional_fair",
    source_type: "fair_guide_page",
  },
  {
    id: "arkansas-oklahoma-state-fair",
    fair_name: "Arkansas Oklahoma State Fair",
    county: "Sebastian",
    city: "Fort Smith",
    venue: "Kay Rodgers Park",
    official_url: null,
    cofairs_url: "https://cofairs.com/arkansas/arkansas-oklahoma-state-fair",
    category: "regional_fair",
    source_type: "fair_guide_page",
  },
  {
    id: "south-logan-county-fair",
    fair_name: "South Logan County Fair",
    county: "Logan",
    city: "Booneville",
    venue: "South Logan County Fairgrounds",
    official_url: null,
    cofairs_url: "https://cofairs.com/arkansas/south-logan-county-fair",
    category: "regional_fair",
    source_type: "fair_guide_page",
  },
];
