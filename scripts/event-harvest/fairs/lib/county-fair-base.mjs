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

/** Pass 29C — high-yield counties searched first with full source stack */
export const PRIORITY_HIGH_YIELD_COUNTIES = [
  "Benton",
  "Boone",
  "Bradley",
  "Carroll",
  "Conway",
  "Faulkner",
  "Hempstead",
  "Hot Spring",
  "Johnson",
  "Pulaski",
  "Saline",
  "Sebastian",
  "Union",
  "Washington",
];

/** Known official county fair site patterns (public URLs only) */
export const OFFICIAL_FAIR_URLS = {
  Fulton: "https://www.fultoncountyfair.net/",
  Baxter: "https://www.baxtercountyfair.org/",
  Lonoke: "https://www.lonokecountyfair.com/",
  Columbia: "https://www.columbiacountyfair.com/",
  Yell: "https://yellcountyfair.com/",
  Pope: "https://popecountyfair.com/",
  Prairie: "https://www.prairiefaircountyar.com/",
  Union: "https://myunioncountyarfair.com/",
  Sebastian: "https://www.sebastiancountyfair.com/",
  Benton: "https://bentonar.fairwire.com/",
  Washington: "https://www.mywashcofair.com/",
  Saline: "https://salinecountyfairgrounds.com/",
  Cleburne: "https://www.cleburnecountyfair.com/",
  Boone: "https://www.boonecounty4h.org/fair",
  Garland: "https://garlandcountyfair.com/",
  Pulaski: "https://thepulaskicountyfair.net/home",
  Faulkner: "http://www.faulknercountyfair.net/",
  "Hot Spring": "https://www.hotspringcountyfair.com/",
  Johnson: "https://thejohnsoncountyfair.org/",
  Carroll: "https://www.carrollcountyfair.com/",
  Madison: "https://www.madisoncountyfair.net/",
  "Van Buren": "https://www.vanburencountyarkansasfairgrounds.com/",
  Newton: "https://www.newtoncountyfair.com/",
  Searcy: "https://www.searcycountyfair.com/",
  Conway: "https://www.conwaycountyfair.com/",
  Bradley: "https://www.bradleycountyfair.net/",
};

/** Extension / 4-H public pages (Pass 29C source tier 3) */
export const EXTENSION_FAIR_SOURCES = {
  Boone: [{ url: "https://www.boonecounty4h.org/fair", type: "extension_4h_page", label: "Boone County 4-H Fair" }],
  Carroll: [
    {
      url: "https://www.carrollcountyfair.com/fair-schedule",
      type: "extension_4h_page",
      label: "Carroll County 4-H & FFA Fair schedule",
    },
  ],
  Johnson: [{ url: "https://thejohnsoncountyfair.org/livestock/", type: "extension_4h_page", label: "Johnson County Fair livestock" }],
};

/** Public Facebook pages — fetch only when listed; no login wall assumed (Pass 29C tier 2) */
export const FACEBOOK_FAIR_SOURCES = {
  Johnson: [{ url: "https://www.facebook.com/jocofair", type: "facebook_page", label: "Johnson County Fair Facebook" }],
  Bradley: [{ url: "https://www.facebook.com/BradleyCountyFair", type: "facebook_page", label: "Bradley County Fair Facebook" }],
};

/** Tourism / CVB / chamber pages (Pass 29C tier 4) */
export const TOURISM_FAIR_SOURCES = {
  Columbia: [
    { url: "https://arksouth.org/events/columbia-county-fair-livestock-show/", type: "tourism_cvb_page", label: "Arkansas South Tourism" },
  ],
  Hempstead: [
    {
      url: "http://www.southwestarkansasdistrictlivestockshow.com/home.html",
      type: "tourism_cvb_page",
      label: "SW Arkansas District Fair (Hope)",
    },
  ],
  Pulaski: [{ url: "https://www.explorepinebluff.com/", type: "tourism_cvb_page", label: "Explore Pine Bluff / regional CVB" }],
};

/** Secondary public sources — Cofairs cached pages, FairEntry, fair managers (Pass 29C tier 6) */
export const SECONDARY_FAIR_SOURCES = {
  Columbia: [
    { url: "https://arksouth.org/events/columbia-county-fair-livestock-show/", type: "tourism_cvb_page", label: "Arkansas South Tourism" },
  ],
  Lonoke: [{ url: "https://cofairs.com/arkansas/lonoke-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Yell: [{ url: "https://cofairs.com/arkansas/yell-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Pope: [{ url: "https://cofairs.com/arkansas/pope-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Prairie: [{ url: "https://cofairs.com/arkansas/prairie-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Greene: [{ url: "https://cofairs.com/arkansas/greene-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Benton: [{ url: "https://cofairs.com/arkansas/benton-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Washington: [{ url: "https://cofairs.com/arkansas/washington-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Sebastian: [
    { url: "https://www.sebastiancountyfair.com/fair-info", type: "county_fair_page", label: "Sebastian County Fair info" },
    { url: "https://cofairs.com/arkansas/sebastian-county-fair", type: "fair_guide_page", label: "Cofairs guide" },
  ],
  Faulkner: [{ url: "https://cofairs.com/arkansas/faulkner-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Cleburne: [{ url: "https://cofairs.com/arkansas/cleburne-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Union: [{ url: "https://cofairs.com/arkansas/union-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Carroll: [{ url: "https://cofairs.com/arkansas/carroll-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Conway: [{ url: "https://cofairs.com/arkansas/conway-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Bradley: [{ url: "https://cofairs.com/arkansas/bradley-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Saline: [{ url: "https://cofairs.com/arkansas/saline-county-fair", type: "fair_guide_page", label: "Cofairs guide" }],
  Boone: [{ url: "https://cofairs.com/arkansas/northwest-arkansas-district-fair", type: "fair_guide_page", label: "NW AR District Fair guide" }],
};

export function extraSourcesForCounty(county) {
  const isPriority = PRIORITY_HIGH_YIELD_COUNTIES.includes(county);
  const facebook = isPriority ? FACEBOOK_FAIR_SOURCES[county] ?? [] : [];
  const extension = EXTENSION_FAIR_SOURCES[county] ?? [];
  const tourism = TOURISM_FAIR_SOURCES[county] ?? [];
  const secondary = SECONDARY_FAIR_SOURCES[county] ?? [];
  const seen = new Set();
  const merged = [];
  for (const src of [...facebook, ...extension, ...tourism, ...secondary]) {
    if (seen.has(src.url)) continue;
    seen.add(src.url);
    merged.push(src);
  }
  return merged;
}

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
    `${county} County Fair chamber tourism Arkansas 2026`,
    `${county} County Fair local news calendar 2026`,
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
