#!/usr/bin/env node
/** Generate local intelligence registry JSON from top-200 cities + AR counties */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOP200 = path.join(ROOT, "data/arkansas/top-200-priority-cities.json");
const COUNTIES = path.join(ROOT, "data/arkansas-counties.json");
const OUT_DIR = path.join(ROOT, "data/local-intelligence");

const POP_BAND = { large: 85000, medium: 25000, small: 8000 };

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
};

fs.mkdirSync(OUT_DIR, { recursive: true });

const top200 = JSON.parse(fs.readFileSync(TOP200, "utf8"));
const cities = top200.cities.slice(0, 100).map((c) => {
  const pop = POP_BAND[c.population_band] || 5000;
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
    opportunity_notes: `Priority rank ${c.priority_rank} — relationship-density events drive local trust`,
    confidence_score: 25,
    source_links: [
      { label: "Census QuickFacts (hook)", url: "https://www.census.gov/quickfacts/fact/table/US/PST045224", type: "census_hook" },
      { label: "BLS QCEW (hook)", url: "https://www.bls.gov/cew/", type: "bls_hook" },
    ],
  };
});

fs.writeFileSync(
  path.join(OUT_DIR, "top-city-dossiers.json"),
  JSON.stringify({ version: 1, generatedAt: new Date().toISOString().slice(0, 10), count: cities.length, maxExpand: 250, cities }, null, 2),
);

const countyList = JSON.parse(fs.readFileSync(COUNTIES, "utf8")).counties;
const counties = countyList.map((county, i) => {
  const pop = 12000 + (75 - i) * 800;
  const baseline = Math.round(pop * 0.4);
  return {
    county,
    region: i < 15 ? "Northwest" : i < 30 ? "Central" : i < 45 ? "Delta" : "South",
    county_seat: COUNTY_SEATS[county] || null,
    population: pop,
    demographics_summary: "County-level aggregate — Census ACS hook pending",
    employment_profile: "Agriculture, healthcare, retail, local government",
    economic_drivers: ["Healthcare", "Agriculture", "Small business"],
    major_towns: cities.filter((c) => c.county === county).slice(0, 5).map((c) => c.city),
    civic_calendar_sources: [`${county} County quorum court`, "Chamber calendars — verify"],
    recurring_traditions: ["County fair", "Community church dinners"],
    prior_sos_baseline: baseline,
    target_votes: Math.round(baseline * 1.07),
    win_path_notes: null,
    confidence_score: 20,
    source_links: [{ label: "Census county QuickFacts hook", url: "https://www.census.gov/data.html", type: "census_hook" }],
  };
});

fs.writeFileSync(
  path.join(OUT_DIR, "county-dossiers.json"),
  JSON.stringify({ version: 1, generatedAt: new Date().toISOString().slice(0, 10), count: counties.length, counties }, null, 2),
);

const sosTargets = {
  version: 1,
  office: "Secretary of State",
  notes: "Placeholder statewide math — campaign workspaces override via campaign_vote_targets",
  targets: [
    { geographyType: "statewide", geographyName: "Arkansas", baselineVotes: 580000, targetVotes: 620000, notes: "Statewide SOS baseline placeholder" },
    ...counties.slice(0, 20).map((c) => ({
      geographyType: "county",
      geographyName: c.county,
      baselineVotes: c.prior_sos_baseline,
      targetVotes: c.target_votes,
    })),
    ...cities.slice(0, 15).map((c) => ({
      geographyType: "city",
      geographyName: c.city,
      county: c.county,
      baselineVotes: c.sos_baseline_votes,
      targetVotes: c.sos_target_votes,
    })),
  ],
};

fs.writeFileSync(path.join(OUT_DIR, "sos-election-targets.json"), JSON.stringify(sosTargets, null, 2));
console.log(`[generate-local-intelligence] ${cities.length} cities, ${counties.length} counties`);
