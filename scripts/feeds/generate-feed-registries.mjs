#!/usr/bin/env node
/**
 * Pass 23A — generate county + city feed slot registries from institutions and discovered sources.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = path.join(ROOT, "data/feeds");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function normCounty(c) {
  return String(c).replace(/\s+County$/i, "").trim();
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isRealUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (url.includes("google.com/search")) return false;
  return /^https?:\/\//i.test(url.trim());
}

function attachmentStatus(url) {
  if (!url) return "missing";
  if (isRealUrl(url)) return "attached";
  return "search_only";
}

const slotTypes = readJson("data/feeds/feed-slot-types.json");
const counties = readJson("data/arkansas-counties.json").counties ?? [];
const cities = readJson("data/local-intelligence/top-city-dossiers.json").cities ?? [];
const discovered = readJson("data/ingestion/discovered-sources/top-200-city-sources.json").cities ?? [];
const extensions = readJson("data/institutions/community-anchors-directory.json").extension_offices ?? [];
const schools = readJson("data/institutions/school-directory.json").schools ?? [];
const colleges = readJson("data/institutions/college-directory.json").colleges ?? [];
const orgs = readJson("data/institutions/civic-organizations.json").organizations ?? [];

const SOURCE_MAP = {
  county_government: "county_official",
  county_extension: "extension",
  county_library: "library",
  county_fair: "festival",
  county_farm_bureau: "farm_bureau",
  county_chamber: "chamber",
  county_tourism: "tourism",
  county_schools: "school_district",
  county_colleges: "college",
  county_vfd: "vfd",
  city_calendar: "city_official",
  city_parks_rec: "parks_rec",
  city_library: "library",
  city_chamber: "chamber",
  city_downtown: "downtown",
  city_tourism: "tourism",
  city_community_center: "community_center",
};

function discoveredByCounty() {
  const map = new Map();
  for (const row of discovered) {
    const c = normCounty(row.county).toLowerCase();
    if (!map.has(c)) map.set(c, []);
    map.get(c).push(...(row.source_templates ?? []));
  }
  return map;
}

function discoveredByCity() {
  const map = new Map();
  for (const row of discovered) {
    map.set(row.city.toLowerCase(), row.source_templates ?? []);
  }
  return map;
}

function pickTemplate(templates, sourceType) {
  return templates.find((t) => t.source_type === sourceType) ?? null;
}

function countyUrlHints(county, slotId, templates) {
  const cSlug = slug(normCounty(county));
  const sourceType = SOURCE_MAP[slotId];
  const tpl = pickTemplate(templates, sourceType);
  if (tpl?.url_hint && isRealUrl(tpl.url_hint)) return { calendar_url: tpl.url_hint, contact_url: tpl.url_hint };

  switch (slotId) {
    case "county_government":
      return { calendar_url: `https://www.${cSlug}countyar.gov`, contact_url: `https://www.${cSlug}countyar.gov` };
    case "county_extension": {
      const ext = extensions.find((e) => normCounty(e.county).toLowerCase() === normCounty(county).toLowerCase());
      return { calendar_url: ext?.calendar_url ?? ext?.website ?? null, contact_url: ext?.website ?? null };
    }
    case "county_farm_bureau": {
      const fb = orgs.find(
        (o) =>
          normCounty(o.county).toLowerCase() === normCounty(county).toLowerCase() &&
          /farm bureau/i.test(String(o.org_name ?? o.name ?? "")),
      );
      return { calendar_url: fb?.website ?? fb?.calendar_url ?? null, contact_url: fb?.website ?? null };
    }
    case "county_schools": {
      const district = schools.find((s) => normCounty(s.county).toLowerCase() === normCounty(county).toLowerCase());
      return { calendar_url: district?.website ?? district?.calendar_feed?.url ?? null, contact_url: district?.website ?? null };
    }
    case "county_colleges": {
      const col = colleges.find((x) => normCounty(x.county).toLowerCase() === normCounty(county).toLowerCase());
      return { calendar_url: col?.website ?? col?.calendar_url ?? null, contact_url: col?.website ?? null };
    }
    case "county_vfd": {
      const vfd = orgs.find(
        (o) =>
          normCounty(o.county).toLowerCase() === normCounty(county).toLowerCase() &&
          /vfd|volunteer fire|fire department/i.test(String(o.org_name ?? o.name ?? o.org_type ?? "")),
      );
      return { calendar_url: vfd?.website ?? null, contact_url: vfd?.website ?? null };
    }
    default:
      return { calendar_url: tpl?.url_hint && isRealUrl(tpl.url_hint) ? tpl.url_hint : null, contact_url: tpl?.url_hint ?? null };
  }
}

function cityUrlHints(city, county, slotId, templates) {
  const citySlug = slug(city);
  const sourceType = SOURCE_MAP[slotId];
  const tpl = pickTemplate(templates, sourceType);
  if (tpl?.url_hint && isRealUrl(tpl.url_hint)) return { calendar_url: tpl.url_hint, contact_url: tpl.url_hint };

  if (slotId === "city_calendar") {
    return { calendar_url: `https://www.${citySlug}ar.gov`, contact_url: `https://www.${citySlug}ar.gov` };
  }
  return { calendar_url: null, contact_url: tpl?.url_hint ?? null };
}

const byCountyDisc = discoveredByCounty();
const byCityDisc = discoveredByCity();

const countyFeeds = [];
for (const county of counties) {
  const name = normCounty(typeof county === "string" ? county : county.name ?? county);
  const templates = byCountyDisc.get(name.toLowerCase()) ?? [];
  for (const slot of slotTypes.countySlots) {
    const urls = countyUrlHints(name, slot.id, templates);
    const calendarUrl = urls.calendar_url;
    countyFeeds.push({
      id: `${slug(name)}-${slot.id}`,
      scope: "county",
      county: name,
      slot_type: slot.id,
      label: `${name} County — ${slot.label}`,
      institution_name: `${name} County ${slot.label}`,
      calendar_url: isRealUrl(calendarUrl) ? calendarUrl : null,
      contact_url: urls.contact_url,
      attachment_status: attachmentStatus(calendarUrl),
      expected_yield: slot.expected_yield,
      source_type: slot.source_type,
      tier: slot.tier,
    });
  }
}

const cityFeeds = [];
for (const cityRow of cities) {
  const { city, county } = cityRow;
  const templates = byCityDisc.get(city.toLowerCase()) ?? [];
  for (const slot of slotTypes.citySlots) {
    const urls = cityUrlHints(city, county, slot.id, templates);
    const calendarUrl = urls.calendar_url;
    cityFeeds.push({
      id: `${slug(city)}-${slot.id}`,
      scope: "city",
      city,
      county: normCounty(county),
      slot_type: slot.id,
      label: `${city} — ${slot.label}`,
      institution_name: `${city} ${slot.label}`,
      calendar_url: isRealUrl(calendarUrl) ? calendarUrl : null,
      contact_url: urls.contact_url,
      attachment_status: attachmentStatus(calendarUrl),
      expected_yield: slot.expected_yield,
      source_type: slot.source_type,
      tier: slot.tier,
    });
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const generatedAt = new Date().toISOString();

fs.writeFileSync(
  path.join(OUT_DIR, "county-feed-registry.json"),
  JSON.stringify({ generatedAt, count: countyFeeds.length, feeds: countyFeeds }, null, 2),
);
fs.writeFileSync(
  path.join(OUT_DIR, "city-feed-registry.json"),
  JSON.stringify({ generatedAt, count: cityFeeds.length, feeds: cityFeeds }, null, 2),
);

console.log(`[feeds:generate] ${countyFeeds.length} county slots · ${cityFeeds.length} city slots`);
console.log(`[feeds:generate] → data/feeds/county-feed-registry.json`);
console.log(`[feeds:generate] → data/feeds/city-feed-registry.json`);
