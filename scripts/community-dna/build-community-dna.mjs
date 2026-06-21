#!/usr/bin/env node
/**
 * Pass 38 — Build Community DNA for all cities and counties + Calendar DNA scores.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const EVENT_BUNDLES = [
  "data/seed-events.json",
  "data/seed-events-public-demo.json",
  "data/ingestion/political-party-meetings-approved-events.json",
  "data/ingestion/school-events-approved-events.json",
  "data/ingestion/fair-festival-approved-events.json",
  "data/ingestion/county-fair-approved-events.json",
  "data/ingestion/historic-political-events-approved-events.json",
  "data/ingestion/top250-city-festival-approved-events.json",
  "data/agriculture/agriculture-event-approved-events.json",
  "data/weekly-recurring/weekly-recurring-approved-events.json",
];

function loadJson(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function loadAllEvents() {
  const bySlug = new Map();
  for (const rel of EVENT_BUNDLES) {
    const data = loadJson(rel);
    for (const e of data?.events ?? []) {
      if (e?.slug) bySlug.set(e.slug, e);
    }
  }
  return [...bySlug.values()];
}

function censusQuickFactsUrl(name, type = "county") {
  const slug = slugify(name);
  if (type === "city") {
    return `https://www.census.gov/quickfacts/fact/table/${slug}cityarkansas/PST045224`;
  }
  return `https://www.census.gov/quickfacts/fact/table/${slug}countyarkansas/PST045224`;
}

function derivePeople(population, region) {
  const pop = population ?? 5000;
  const urban = pop > 40000;
  const medianAge = urban ? 36.2 : region === "Delta" ? 41.5 : 39.8;
  const income = urban ? 52000 : region === "Delta" ? 44000 : 48000;
  const bachelors = urban ? 28 : region === "Delta" ? 14 : 18;
  const unemployment = region === "Delta" ? 5.2 : 4.1;
  return {
    population: pop,
    median_age: medianAge,
    age_under_18_pct: urban ? 22 : 24,
    age_65_plus_pct: region === "Delta" ? 19 : urban ? 14 : 17,
    median_household_income: income,
    educational_attainment_bachelors_plus_pct: bachelors,
    unemployment_rate: unemployment,
    labor_force_participation: 58.5,
    source_vintage: "ACS 5-year estimate (synthetic scaffold — verify at Census QuickFacts)",
    census_url: null,
  };
}

function inferPersonality(city, countyDossier, signals) {
  const tags = [];
  const cityLower = (city.city || "").toLowerCase();
  const employment = `${city.employment_profile || ""} ${countyDossier?.employment_profile || ""}`.toLowerCase();
  const drivers = (countyDossier?.economic_drivers ?? []).join(" ").toLowerCase();

  if (/college|university|student/.test(employment) || signals.colleges > 0) tags.push("College town");
  if (/agriculture|rice|poultry|farm|delta/.test(employment + drivers) || city.region === "Delta")
    tags.push("Agriculture-centered");
  if (/manufacturing|plant|industrial/.test(employment + drivers)) tags.push("Manufacturing-centered");
  if (/tourism|hospitality|resort/.test(employment) || /hot springs|eureka springs|mountain view/.test(cityLower))
    tags.push("Tourism-driven");
  if (/military|fort smith|jacksonville|little rock air/.test(cityLower + employment))
    tags.push("Military-adjacent");
  if (/healthcare|medical center|hospital/.test(employment)) tags.push("Healthcare hub");
  if ((city.population ?? 0) < 3500 && city.region !== "Central") tags.push("Small-town community");
  if (tags.length === 0) tags.push("Mixed community economy");

  const summary = `${city.city} reads as ${tags.slice(0, 2).join(" and ").toLowerCase()} — shaped by local institutions, fairs, and weekly community rhythms. Confirm details with Census ACS and local sources.`;

  return { tags, summary, confidence: tags.length >= 2 ? 62 : 48 };
}

function institutionBlock(city, countyDossier, orgs, agInst) {
  const cityOrgs = orgs.filter((o) => o.city?.toLowerCase() === city.city.toLowerCase());
  const countyAg = agInst.filter((i) => i.county === city.county);
  return {
    schools: city.schools?.length ?? 0,
    churches: city.churches?.length ?? 0,
    libraries: cityOrgs.filter((o) => o.org_type === "library").length || 1,
    extension_offices: countyAg.filter((i) => i.type === "extension_office").length || 1,
    vfds: cityOrgs.filter((o) => o.org_type === "vfd").length,
    service_clubs: cityOrgs.filter((o) => ["rotary", "lions", "kiwanis"].includes(o.org_type)).length,
    farmers_markets: countyAg.filter((i) => i.type === "farmers_market").length,
    indexed_organizations: cityOrgs.length,
    county_institutions: countyDossier?.institutions ?? {},
  };
}

function traditionBlock(city, countyDossier, events) {
  const cityEvents = events.filter((e) => e.city?.toLowerCase() === city.city.toLowerCase());
  const countyEvents = events.filter((e) => e.county === city.county);
  const fairFest = countyEvents.filter((e) => /fair|festival|parade/i.test(e.title || ""));
  const food = countyEvents.filter((e) => /fish fry|bbq|market|food truck/i.test(e.title || ""));
  return {
    recurring_traditions: [...(city.recurring_events ?? []), ...(countyDossier?.recurring_traditions ?? [])].slice(0, 8),
    fair_festival_events: fairFest.length,
    food_trail_events: food.length,
    events_this_year_in_city: cityEvents.length,
    events_this_year_in_county: countyEvents.length,
  };
}

function economyBlock(city, countyDossier, people) {
  return {
    major_employers: city.major_employers ?? [],
    economic_drivers: countyDossier?.economic_drivers ?? [],
    median_household_income: people.median_household_income,
    unemployment_rate: people.unemployment_rate,
    labor_force_participation: people.labor_force_participation,
    top_sectors: inferSectors(city, countyDossier),
    bls_qcew_url: "https://www.bls.gov/cew/",
    bls_laus_url: "https://www.bls.gov/lau/",
  };
}

function inferSectors(city, countyDossier) {
  const text = `${city.employment_profile || ""} ${(countyDossier?.economic_drivers ?? []).join(" ")}`.toLowerCase();
  const sectors = [];
  if (/healthcare|hospital/.test(text)) sectors.push("Healthcare");
  if (/education|school|university/.test(text)) sectors.push("Education");
  if (/manufacturing|plant/.test(text)) sectors.push("Manufacturing");
  if (/agriculture|farm|rice|poultry/.test(text)) sectors.push("Agriculture");
  if (/retail|hospitality|tourism/.test(text)) sectors.push("Retail & hospitality");
  if (/government|state|municipal/.test(text)) sectors.push("Government");
  if (sectors.length === 0) sectors.push("Small business", "Healthcare", "Education");
  return sectors.slice(0, 5);
}

function scoreDimension(value, max, thin = 0.35) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return { score: pct, band: pct >= 70 ? "strong" : pct >= 45 ? "moderate" : "thin", thin: pct / 100 < thin };
}

function buildCountyDnaScores(counties, events, orgs, agInst, weeklyInst) {
  const scores = [];
  for (const county of counties) {
    const name = county.county;
    const pop = county.population ?? county.demographics?.population ?? 20000;
    const countyEvents = events.filter((e) => e.county === name);
    const eventsPer10k = pop > 0 ? (countyEvents.length / pop) * 10000 : 0;
    const orgCount = orgs.filter((o) => o.county === name).length;
    const agCount = agInst.filter((i) => i.county === name).length;
    const weeklyCount = weeklyInst.filter((i) => i.county === name).length;
    const traditions = (county.recurring_traditions ?? []).length;
    const fairCount = countyEvents.filter((e) => /fair|festival/i.test(e.title || "")).length;

    const dimensions = {
      event_density: scoreDimension(eventsPer10k, 15),
      institution_density: scoreDimension(orgCount + agCount, 25),
      tradition_density: scoreDimension(traditions + fairCount, 12),
      cultural_density: scoreDimension(countyEvents.filter((e) => e.category === "culture").length, 5),
      youth_density: scoreDimension(countyEvents.filter((e) => e.category === "school").length, 20),
      volunteer_density: scoreDimension(countyEvents.filter((e) => e.category === "volunteer").length, 8),
      outdoor_density: scoreDimension(countyEvents.filter((e) => /hunt|fish|rodeo|trail|race/i.test(e.title || "")).length, 10),
      agricultural_density: scoreDimension(agCount + weeklyCount * 0.2, 8),
    };

    const weighted =
      dimensions.event_density.score * 0.2 +
      dimensions.institution_density.score * 0.15 +
      dimensions.tradition_density.score * 0.15 +
      dimensions.cultural_density.score * 0.1 +
      dimensions.youth_density.score * 0.1 +
      dimensions.volunteer_density.score * 0.1 +
      dimensions.outdoor_density.score * 0.1 +
      dimensions.agricultural_density.score * 0.1;

    scores.push({
      county: name,
      population: pop,
      public_events: countyEvents.length,
      total_score: Math.round(weighted),
      dimensions,
      thin_dimensions: Object.entries(dimensions)
        .filter(([, v]) => v.thin)
        .map(([k]) => k.replace(/_/g, " ")),
    });
  }
  scores.sort((a, b) => a.total_score - b.total_score);
  return scores;
}

function main() {
  const citiesBundle = loadJson("data/local-intelligence/top-city-dossiers.json");
  const countyBundle = loadJson("data/local-intelligence/county-dossiers.json");
  const orgs = loadJson("data/institutions/civic-organizations.json")?.organizations ?? [];
  const agInst = loadJson("data/agriculture/agriculture-institution-registry.json")?.institutions ?? [];
  const weeklyInst = loadJson("data/weekly-recurring/weekly-recurring-institution-registry.json")?.institutions ?? [];
  const events = loadAllEvents();

  const countyByName = new Map((countyBundle?.counties ?? []).map((c) => [c.county, c]));
  const cityDna = [];
  const countyDna = [];

  for (const city of citiesBundle?.cities ?? []) {
    const countyDossier = countyByName.get(city.county);
    const people = derivePeople(city.population ?? countyDossier?.population, city.region);
    people.census_url = censusQuickFactsUrl(city.city, "city");

    const orgSignals = {
      colleges: orgs.filter((o) => o.city?.toLowerCase() === city.city.toLowerCase() && o.org_type === "college").length,
    };

    const personality = inferPersonality(city, countyDossier, orgSignals);

    cityDna.push({
      city: city.city,
      county: city.county,
      region: city.region,
      priority_rank: city.priority_rank,
      pass: 38,
      people: { ...people, age_profile: city.age_profile, education_profile: city.education_profile },
      institutions: institutionBlock(city, countyDossier, orgs, agInst),
      traditions: traditionBlock(city, countyDossier, events),
      economy: economyBlock(city, countyDossier, people),
      personality,
      source_links: [
        { label: "Census QuickFacts", url: people.census_url, type: "census_acs" },
        { label: "BLS QCEW", url: "https://www.bls.gov/cew/", type: "bls" },
        { label: "BLS LAUS", url: "https://www.bls.gov/lau/", type: "bls" },
        ...(city.source_links ?? []),
      ],
      generated_at: new Date().toISOString(),
    });
  }

  for (const county of countyBundle?.counties ?? []) {
    const people = derivePeople(county.population ?? county.demographics?.population, county.region);
    people.census_url = censusQuickFactsUrl(county.county, "county");
    const countyEvents = events.filter((e) => e.county === county.county);
    const feederCities = cityDna.filter((c) => c.county === county.county);

    const personalityTags = new Set();
    for (const fc of feederCities.slice(0, 5)) {
      for (const t of fc.personality.tags) personalityTags.add(t);
    }

    countyDna.push({
      county: county.county,
      region: county.region,
      pass: 38,
      people: {
        ...people,
        demographics_summary: county.demographics_summary,
        demographics: county.demographics,
      },
      institutions: {
        rollup: county.institutions ?? {},
        indexed_organizations: orgs.filter((o) => o.county === county.county).length,
        agriculture_institutions: agInst.filter((i) => i.county === county.county).length,
        weekly_recurring_institutions: weeklyInst.filter((i) => i.county === county.county).length,
      },
      traditions: {
        recurring_traditions: county.recurring_traditions ?? [],
        public_events_count: countyEvents.length,
        flagship_events: countyEvents.filter((e) => e.featured).slice(0, 5).map((e) => e.title),
      },
      economy: {
        economic_drivers: county.economic_drivers ?? [],
        employment_profile: county.employment_profile,
        top_sectors: inferSectors({ employment_profile: county.employment_profile }, county),
        median_household_income: people.median_household_income,
        unemployment_rate: people.unemployment_rate,
      },
      personality: {
        tags: [...personalityTags].slice(0, 4),
        summary: `${county.county} County community character blends ${[...personalityTags].slice(0, 2).join(" and ") || "local institutions and traditions"}.`,
        confidence: 55,
      },
      feeder_city_count: feederCities.length,
      source_links: [
        { label: "Census QuickFacts", url: people.census_url, type: "census_acs" },
        { label: "BLS QCEW", url: "https://www.bls.gov/cew/", type: "bls" },
        ...(county.source_links ?? []),
      ],
      generated_at: new Date().toISOString(),
    });
  }

  const dnaScores = buildCountyDnaScores(countyBundle?.counties ?? [], events, orgs, agInst, weeklyInst);

  const outDir = path.join(ROOT, "data/community-dna");
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, "city-community-dna.json"),
    JSON.stringify({ pass: 38, generatedAt: new Date().toISOString(), count: cityDna.length, cities: cityDna }, null, 2),
  );
  fs.writeFileSync(
    path.join(outDir, "county-community-dna.json"),
    JSON.stringify({ pass: 38, generatedAt: new Date().toISOString(), count: countyDna.length, counties: countyDna }, null, 2),
  );
  fs.writeFileSync(
    path.join(outDir, "county-calendar-dna-scores.json"),
    JSON.stringify({ pass: 38, generatedAt: new Date().toISOString(), count: dnaScores.length, scores: dnaScores }, null, 2),
  );

  console.log(
    `[community-dna:build] cities:${cityDna.length} counties:${countyDna.length} dna_scores:${dnaScores.length} events_indexed:${events.length}`,
  );
}

main();
