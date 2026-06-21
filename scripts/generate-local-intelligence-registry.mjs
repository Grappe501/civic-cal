#!/usr/bin/env node
/**
 * County-first local intelligence registry.
 * Cities (up to 250) feed county dossiers — county is the primary object.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOP200 = path.join(ROOT, "data/arkansas/top-200-priority-cities.json");
const COUNTIES = path.join(ROOT, "data/arkansas-counties.json");
const OUT_DIR = path.join(ROOT, "data/local-intelligence");

const POP_BAND = { large: 85000, medium: 25000, small: 8000, tiny: 3500 };
const MAX_CITIES = 250;

/** Ranks 201–250 — expansion feeder cities (verify / enrich via harvest) */
const EXPANSION_CITIES = [
  { city: "Alma", county: "Crawford", region: "West", priority_rank: 201 },
  { city: "Ashdown", county: "Little River", region: "Southwest", priority_rank: 202 },
  { city: "Atkins", county: "Pope", region: "River Valley", priority_rank: 203 },
  { city: "Augusta", county: "Woodruff", region: "Delta", priority_rank: 204 },
  { city: "Barling", county: "Sebastian", region: "West", priority_rank: 205 },
  { city: "Batesville", county: "Independence", region: "North Central", priority_rank: 206 },
  { city: "Beebe", county: "White", region: "Central", priority_rank: 207 },
  { city: "Berryville", county: "Carroll", region: "Northwest", priority_rank: 208 },
  { city: "Booneville", county: "Logan", region: "West", priority_rank: 209 },
  { city: "Brinkley", county: "Monroe", region: "Delta", priority_rank: 210 },
  { city: "Camden", county: "Ouachita", region: "South", priority_rank: 211 },
  { city: "Carlisle", county: "Lonoke", region: "Central", priority_rank: 212 },
  { city: "Charleston", county: "Franklin", region: "West", priority_rank: 213 },
  { city: "Clarksville", county: "Johnson", region: "River Valley", priority_rank: 214 },
  { city: "Corning", county: "Clay", region: "Northeast", priority_rank: 215 },
  { city: "Dermott", county: "Chicot", region: "Delta", priority_rank: 216 },
  { city: "De Queen", county: "Sevier", region: "Southwest", priority_rank: 217 },
  { city: "Dumas", county: "Desha", region: "Delta", priority_rank: 218 },
  { city: "Earle", county: "Crittenden", region: "Delta", priority_rank: 219 },
  { city: "Eudora", county: "Chicot", region: "Delta", priority_rank: 220 },
  { city: "Fordyce", county: "Dallas", region: "South", priority_rank: 221 },
  { city: "Gentry", county: "Benton", region: "Northwest", priority_rank: 222 },
  { city: "Gosnell", county: "Mississippi", region: "Northeast", priority_rank: 223 },
  { city: "Gravette", county: "Benton", region: "Northwest", priority_rank: 224 },
  { city: "Greenwood", county: "Sebastian", region: "West", priority_rank: 225 },
  { city: "Gurdon", county: "Clark", region: "Southwest", priority_rank: 226 },
  { city: "Hamburg", county: "Ashley", region: "Southeast", priority_rank: 227 },
  { city: "Harrisburg", county: "Poinsett", region: "Northeast", priority_rank: 228 },
  { city: "Hazen", county: "Prairie", region: "Delta", priority_rank: 229 },
  { city: "Heber Springs", county: "Cleburne", region: "North Central", priority_rank: 230 },
  { city: "Helena-West Helena", county: "Phillips", region: "Delta", priority_rank: 231 },
  { city: "Hope", county: "Hempstead", region: "Southwest", priority_rank: 232 },
  { city: "Huntsville", county: "Madison", region: "Northwest", priority_rank: 233 },
  { city: "Lake Village", county: "Chicot", region: "Delta", priority_rank: 234 },
  { city: "Lincoln", county: "Washington", region: "Northwest", priority_rank: 235 },
  { city: "Magnolia", county: "Columbia", region: "South", priority_rank: 236 },
  { city: "Malvern", county: "Hot Spring", region: "Central", priority_rank: 237 },
  { city: "Marianna", county: "Lee", region: "Delta", priority_rank: 238 },
  { city: "Marked Tree", county: "Poinsett", region: "Delta", priority_rank: 239 },
  { city: "Mena", county: "Polk", region: "West", priority_rank: 240 },
  { city: "Monticello", county: "Drew", region: "Southeast", priority_rank: 241 },
  { city: "Morrilton", county: "Conway", region: "River Valley", priority_rank: 242 },
  { city: "Mountain Home", county: "Baxter", region: "North Central", priority_rank: 243 },
  { city: "Nashville", county: "Howard", region: "Southwest", priority_rank: 244 },
  { city: "Newport", county: "Jackson", region: "Northeast", priority_rank: 245 },
  { city: "Osceola", county: "Mississippi", region: "Northeast", priority_rank: 246 },
  { city: "Paris", county: "Logan", region: "West", priority_rank: 247 },
  { city: "Pea Ridge", county: "Benton", region: "Northwest", priority_rank: 248 },
  { city: "Piggott", county: "Clay", region: "Northeast", priority_rank: 249 },
  { city: "Pocahontas", county: "Randolph", region: "Northeast", priority_rank: 250 },
];

const REGION_EMPLOYMENT = {
  Central: "State government, healthcare, logistics, education",
  Northwest: "Retail, poultry, university, construction",
  Delta: "Agriculture, manufacturing, healthcare",
  Northeast: "Agriculture, food processing, education",
  West: "Manufacturing, military-adjacent, healthcare",
  Southwest: "Timber, poultry, small manufacturing",
  South: "Timber, oil/gas legacy, healthcare",
  "North Central": "Tourism, retirement, small manufacturing",
  "River Valley": "Manufacturing, agriculture, Fort Smith metro spillover",
  North: "Tourism, retirement, agriculture",
  Southeast: "Agriculture, paper/ timber, healthcare",
};

const COUNTY_SEATS = {
  Pulaski: "Little Rock", Benton: "Bentonville", Washington: "Fayetteville", Sebastian: "Fort Smith",
  Saline: "Benton", Faulkner: "Conway", Craighead: "Jonesboro", Garland: "Hot Springs",
  Jefferson: "Pine Bluff", White: "Searcy", Pope: "Russellville", Lonoke: "Lonoke",
  White: "Searcy", Independence: "Batesville", Carroll: "Berryville", Johnson: "Clarksville",
};

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function buildCityRecord(c) {
  const pop = POP_BAND[c.population_band] || POP_BAND.tiny;
  const baseline = Math.round(pop * 0.42);
  const target = Math.round(baseline * 1.08);
  return {
    city: c.city,
    county: c.county,
    region: c.region,
    priority_rank: c.priority_rank,
    population: pop,
    demographics_summary: `${c.region} Arkansas community — aggregate ACS/Census hook pending full import`,
    age_profile: c.population_band === "large" ? "Mixed urban/suburban age spread" : "Small-town aging + school-age cohort",
    income_profile: "Median household income — Census ACS 5-year (placeholder)",
    employment_profile: REGION_EMPLOYMENT[c.region] || "Local services, agriculture, healthcare",
    education_profile: "Public schools + community college access varies by hub size",
    major_employers: ["Local healthcare", "School district", "Municipal government"],
    civic_institutions: ["Chamber of commerce", "County extension office", "Public library"],
    churches: ["Community churches — local verification needed"],
    schools: ["Public school district — verify boundary"],
    recurring_events: ["County fair", "Community church dinners", "City council meetings"],
    local_media: ["Local newspaper / radio — verify outlet list"],
    political_notes: null,
    sos_baseline_votes: baseline,
    sos_target_votes: target,
    persuasion_gap: Math.round(target * 0.04),
    turnout_gap: Math.round(baseline * 0.06),
    opportunity_notes: `Priority rank ${c.priority_rank} — feeds ${c.county} County rollup`,
    confidence_score: 25,
    source_links: [
      { label: "Census QuickFacts (hook)", url: "https://www.census.gov/quickfacts/fact/table/US/PST045224", type: "census_hook" },
      { label: "BLS QCEW (hook)", url: "https://www.bls.gov/cew/", type: "bls_hook" },
    ],
  };
}

function rollupCountyFromCities(countyName, countyMeta, citiesInCounty) {
  const popFromCities = citiesInCounty.reduce((s, c) => s + (c.population || 0), 0);
  const ruralBuffer = Math.round(popFromCities * 0.35);
  const population = popFromCities + ruralBuffer;
  const baseline = citiesInCounty.reduce((s, c) => s + (c.sos_baseline_votes || 0), 0) || Math.round(population * 0.4);
  const target = citiesInCounty.reduce((s, c) => s + (c.sos_target_votes || 0), 0) || Math.round(baseline * 1.07);
  const persuasion = citiesInCounty.reduce((s, c) => s + (c.persuasion_gap || 0), 0);
  const turnout = citiesInCounty.reduce((s, c) => s + (c.turnout_gap || 0), 0);

  const union = (key) => unique(citiesInCounty.flatMap((c) => c[key] || []));

  return {
    county: countyName,
    rollup_version: 2,
    region: countyMeta.region,
    county_seat: countyMeta.seat,
    population,
    demographics_summary: `County rollup from ${citiesInCounty.length} priority cities — Census ACS county import pending`,
    employment_profile: REGION_EMPLOYMENT[countyMeta.region] || "Agriculture, healthcare, retail, local government",
    economic_drivers: unique(["Healthcare", "Agriculture", "Small business", ...(citiesInCounty[0]?.employment_profile?.split(",") || [])]),
    major_towns: citiesInCounty.slice(0, 8).map((c) => c.city),
    feeder_cities: citiesInCounty.map((c) => c.city),
    civic_calendar_sources: [`${countyName} County quorum court`, "Chamber calendars — verify", ...union("civic_institutions").slice(0, 3)],
    recurring_traditions: unique(["County fair", "Community church dinners", ...union("recurring_events")]).slice(0, 12),
    prior_sos_baseline: baseline,
    target_votes: target,
    win_path_notes: citiesInCounty.length ? `Win path runs through ${citiesInCounty.slice(0, 3).map((c) => c.city).join(", ")}` : null,
    confidence_score: Math.min(40, 15 + citiesInCounty.length * 2),
    demographics: {
      population,
      growth_trend: "County growth trend — Census ACS pending",
      age_distribution: "Weighted from feeder cities — ACS pending",
      income: "County median income — ACS pending",
      education: "Education attainment — ACS pending",
      housing: "Housing stock / tenure — ACS pending",
      race_ethnicity: "Race/ethnicity — ACS pending",
      employment: REGION_EMPLOYMENT[countyMeta.region] || "Mixed local economy",
      industry: "Top industries — BLS QCEW pending",
      migration: "Net migration — Census pending",
    },
    political: {
      sos_turnout: "SOS turnout history — pending import",
      historical_turnout: "Prior cycle turnout — pending",
      primary_turnout: "Primary turnout — pending",
      general_turnout: "General turnout — pending",
      baseline_votes: baseline,
      vote_targets: target,
      persuasion_targets: persuasion,
      turnout_targets: turnout,
      vote_deficit: target - baseline,
      projected_vote_gain: null,
    },
    institutions: {
      churches: union("churches").slice(0, 15),
      schools: union("schools").slice(0, 12),
      libraries: [`${countyName} County library system — verify`],
      colleges: citiesInCounty.some((c) => c.population >= 25000) ? ["Community college access — verify"] : [],
      volunteer_fire_departments: [`${countyName} County VFD districts — verify`],
      rotary: [`${countyName} County Rotary — verify chapter`],
      lions: [`${countyName} Lions Club — verify`],
      kiwanis: [`${countyName} Kiwanis — verify`],
      farm_bureau: [`${countyName} Farm Bureau — verify`],
      ffa: [`${countyName} FFA chapters — verify`],
      four_h: [`${countyName} 4-H — verify`],
      chambers: union("civic_institutions").filter((x) => /chamber/i.test(x)).slice(0, 5),
    },
    media: {
      newspapers: union("local_media").slice(0, 6),
      radio: [`${countyName} County radio — verify`],
      facebook_pages: [],
      community_groups: [],
      newsletters: [],
      podcasts: [],
    },
    source_links: [{ label: "Census county QuickFacts hook", url: "https://www.census.gov/data.html", type: "census_hook" }],
  };
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const top200 = JSON.parse(fs.readFileSync(TOP200, "utf8"));
const seedCities = [...top200.cities, ...EXPANSION_CITIES].slice(0, MAX_CITIES);
const cities = seedCities.map(buildCityRecord);

fs.writeFileSync(
  path.join(OUT_DIR, "top-city-dossiers.json"),
  JSON.stringify({
    version: 2,
    model: "county_primary_city_feeders",
    generatedAt: new Date().toISOString().slice(0, 10),
    count: cities.length,
    maxExpand: 250,
    cities,
  }, null, 2),
);

const countyList = JSON.parse(fs.readFileSync(COUNTIES, "utf8")).counties;
const counties = countyList.map((county, i) => {
  const citiesInCounty = cities.filter((c) => c.county === county);
  const region = citiesInCounty[0]?.region || (i < 15 ? "Northwest" : i < 30 ? "Central" : i < 45 ? "Delta" : "South");
  return rollupCountyFromCities(county, { region, seat: COUNTY_SEATS[county] || null }, citiesInCounty);
});

fs.writeFileSync(
  path.join(OUT_DIR, "county-dossiers.json"),
  JSON.stringify({
    version: 2,
    model: "county_primary",
    generatedAt: new Date().toISOString().slice(0, 10),
    count: counties.length,
    counties,
  }, null, 2),
);

const sosTargets = {
  version: 2,
  office: "Secretary of State",
  notes: "County-primary rollup — cities feed county baselines; workspaces override via campaign_vote_targets",
  targets: [
    { geographyType: "statewide", geographyName: "Arkansas", baselineVotes: 580000, targetVotes: 620000, notes: "Statewide SOS baseline placeholder" },
    ...counties.map((c) => ({
      geographyType: "county",
      geographyName: c.county,
      baselineVotes: c.prior_sos_baseline,
      targetVotes: c.target_votes,
    })),
    ...cities.slice(0, 30).map((c) => ({
      geographyType: "city",
      geographyName: c.city,
      county: c.county,
      baselineVotes: c.sos_baseline_votes,
      targetVotes: c.sos_target_votes,
    })),
  ],
};

fs.writeFileSync(path.join(OUT_DIR, "sos-election-targets.json"), JSON.stringify(sosTargets, null, 2));
console.log(`[generate-local-intelligence] ${cities.length} city feeders → ${counties.length} county rollups (v2)`);
