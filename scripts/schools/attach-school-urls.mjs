#!/usr/bin/env node
/**
 * Pass 27 — Attach calendar / athletics / board URLs to school harvest registry.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractCityFromSchoolName, leaPrefixFromId, slugCity } from "./lib/extract-school-city.mjs";
import { writeSchoolHarvestHealth } from "./lib/school-harvest-health.mjs";
import { verifyBatch } from "../feeds/lib/url-verifier.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REGISTRY = path.join(ROOT, "data/schools/school-harvest-registry.json");
const KNOWN = path.join(ROOT, "data/schools/known-district-urls.json");
const SCHOOL_DIR = path.join(ROOT, "data/institutions/school-directory.json");
const FEED_DISCOVERY = path.join(ROOT, "data/feeds/feed-discovery-results.json");
const PATTERNS = path.join(ROOT, "data/feeds/feed-discovery-patterns.json");

const VERIFY_LIMIT = Number(process.env.SCHOOL_URL_VERIFY_LIMIT ?? 120);

const COLLEGE_URLS = {
  "University of Arkansas": {
    website: "https://www.uark.edu/",
    athletics: "https://arkansasrazorbacks.com/",
    calendar: "https://calendar.uark.edu/",
    ics: "http://calendars.uark.edu/calendar/1.ics",
    ics_urls: Array.from({ length: 8 }, (_, i) => `http://calendars.uark.edu/calendar/${i + 1}.ics`),
  },
  "Arkansas State University": { website: "https://www.astate.edu/", athletics: "https://astateredwolves.com/", calendar: "https://www.astate.edu/events" },
  "University of Central Arkansas": { website: "https://uca.edu/", athletics: "https://ucasports.com/", calendar: "https://uca.edu/events" },
  "University of Arkansas at Little Rock": { website: "https://ualr.edu/", athletics: "https://lrtrojans.com/", calendar: "https://ualr.edu/events" },
  "Arkansas Tech University": { website: "https://www.atu.edu/", athletics: "https://arkansastechsports.com/", calendar: "https://www.atu.edu/events" },
  "University of Arkansas at Pine Bluff": { website: "https://www.uapb.edu/", athletics: "https://uapblionsroar.com/", calendar: "https://www.uapb.edu/events" },
  "Henderson State University": { website: "https://www.hsu.edu/", athletics: "https://hsusports.com/", calendar: "https://www.hsu.edu/events" },
  "Southern Arkansas University": { website: "https://www.saumag.edu/", athletics: "https://saumag.edu/athletics", calendar: "https://www.saumag.edu/events" },
  "University of the Ozarks": { website: "https://www.ozarks.edu/", athletics: "https://www.uofoathletics.com/", calendar: "https://www.ozarks.edu/events" },
  "Harding University": { website: "https://www.harding.edu/", athletics: "https://hardingsports.com/", calendar: "https://www.harding.edu/events" },
  "John Brown University": { website: "https://www.jbu.edu/", athletics: "https://jbuathletics.com/", calendar: "https://www.jbu.edu/events" },
  "Ouachita Baptist University": { website: "https://www.obu.edu/", athletics: "https://obutigers.com/", calendar: "https://www.obu.edu/events" },
  "Hendrix College": { website: "https://www.hendrix.edu/", athletics: "https://www.hendrix.edu/athletics/", calendar: "https://www.hendrix.edu/events" },
  "Lyon College": { website: "https://www.lyon.edu/", athletics: "https://lyonscots.com/", calendar: "https://www.lyon.edu/events" },
  "Philander Smith College": { website: "https://www.philander.edu/", athletics: "https://www.philander.edu/athletics", calendar: "https://www.philander.edu/events" },
  "University of Arkansas at Monticello": { website: "https://www.uamont.edu/", athletics: "https://uamsports.com/", calendar: "https://www.uamont.edu/events" },
  "University of Arkansas at Fort Smith": { website: "https://www.uafs.edu/", athletics: "https://uafortsmithlions.com/", calendar: "https://www.uafs.edu/events" },
  "University of Arkansas for Medical Sciences": { website: "https://www.uams.edu/", athletics: null, calendar: "https://www.uams.edu/events" },
};

function normCity(c) {
  return String(c ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildCityUrlMap() {
  const map = new Map();

  const known = JSON.parse(fs.readFileSync(KNOWN, "utf8")).districts ?? [];
  for (const d of known) {
    map.set(normCity(d.city), d);
  }

  const scaffolds = JSON.parse(fs.readFileSync(SCHOOL_DIR, "utf8")).schools?.filter((s) => s.status === "scaffold") ?? [];
  for (const s of scaffolds) {
    const key = normCity(s.city);
    if (!key || map.has(key)) continue;
    const slug = slugCity(s.city);
    map.set(key, {
      city: s.city,
      county: s.county,
      website: null,
      calendar_url: null,
      athletics_url: null,
      board_meeting_url: null,
      pattern_slug: slug,
    });
  }

  if (fs.existsSync(FEED_DISCOVERY)) {
    const slots = JSON.parse(fs.readFileSync(FEED_DISCOVERY, "utf8")).slot_discoveries ?? [];
    for (const row of slots) {
      if (row.source_type !== "school_district" || !row.calendar_url) continue;
      const countyKey = normCity(row.county);
      if (!countyKey) continue;
      const url = row.calendar_url;
      if (/fultonschools|clarkschools\.org|franklinschools|millerschools|loganschools|polkschools|prairieschools|randolphschools|stoneschools/i.test(url)) continue;
      if (!map.has(countyKey)) {
        map.set(countyKey, { city: row.county, county: row.county, website: url, calendar_url: url, athletics_url: `${url.replace(/\/$/, "")}/athletics`, pattern_slug: slugCity(row.county) });
      }
    }
  }

  return map;
}

function urlCandidates(citySlug) {
  if (!citySlug) return [];
  const patterns = JSON.parse(fs.readFileSync(PATTERNS, "utf8")).institutionPatterns?.school ?? [];
  const urls = patterns.map((p) => p.replace("{citySlug}", citySlug).replace("{countySlug}", citySlug));
  urls.push(
    `https://www.${citySlug}schools.org`,
    `https://www.${citySlug}schools.net`,
    `https://www.${citySlug}k12.ar.us`,
    `https://www.${citySlug}sd.org`,
  );
  return [...new Set(urls.filter((u) => u.startsWith("http")))];
}

function normalizeDistrictUrl(url) {
  if (!url || typeof url !== "string") return url;
  return url.replace(/\/events\/?$/i, "").replace(/\/athletics\/?$/i, "");
}

function attachUrlsToSchool(school, cityMap, verifiedUrls) {
  const extracted = extractCityFromSchoolName(school.school_name);
  const key = normCity(extracted);
  let district = cityMap.get(key);

  if (!district && extracted) {
    for (const [k, v] of cityMap) {
      if (k.startsWith(key) || key.startsWith(k)) {
        district = v;
        break;
      }
    }
  }

  if (district?.website || district?.calendar_url) {
    school.city = school.city ?? district.city;
    school.county = school.county ?? district.county;
    school.district = school.district ?? `${district.city} School District`;
    school.website = school.website ?? district.website ?? district.calendar_url;
    school.calendar_url = school.calendar_url ?? district.calendar_url ?? district.website;
    school.athletics_url =
      school.athletics_url ?? district.athletics_url ?? (school.website ? `${String(school.website).replace(/\/$/, "")}/athletics` : null);
    school.board_meeting_url =
      school.board_meeting_url ?? district.board_meeting_url ?? (school.website ? `${String(school.website).replace(/\/$/, "")}/school-board` : null);
    school.url_attachment_method = district.website ? "known_district" : "county_feed_discovery";
    school.harvest_status = school.calendar_url ? "urls_linked" : school.harvest_status;
    return;
  }

  const slug = district?.pattern_slug ?? slugCity(extracted);
  const candidates = urlCandidates(slug);
  const hit = candidates.find((u) => verifiedUrls.get(u)?.ok);
  if (hit) {
    school.city = school.city ?? extracted;
    school.website = hit;
    school.calendar_url = hit;
    school.athletics_url = `${hit.replace(/\/$/, "")}/athletics`;
    school.board_meeting_url = `${hit.replace(/\/$/, "")}/school-board`;
    school.url_attachment_method = "pattern_verified";
    school.harvest_status = "urls_linked";
  }
}

function propagateLeaUrls(schools) {
  const byLea = new Map();
  for (const s of schools) {
    const lea = leaPrefixFromId(s.id);
    if (!lea) continue;
    if (!byLea.has(lea)) byLea.set(lea, []);
    byLea.get(lea).push(s);
  }
  for (const group of byLea.values()) {
    const donor = group.find((s) => s.calendar_url);
    if (!donor) continue;
    for (const s of group) {
      if (s.calendar_url) continue;
      s.calendar_url = donor.calendar_url;
      s.athletics_url = donor.athletics_url;
      s.website = donor.website;
      s.board_meeting_url = donor.board_meeting_url;
      s.city = s.city ?? donor.city;
      s.county = s.county ?? donor.county;
      s.url_attachment_method = "lea_group_propagation";
      s.harvest_status = "urls_linked";
    }
  }
}

function syncSchoolDirectory(registry) {
  if (!fs.existsSync(SCHOOL_DIR)) return;
  const dir = JSON.parse(fs.readFileSync(SCHOOL_DIR, "utf8"));
  const byId = new Map((dir.schools ?? []).map((s) => [s.id, s]));
  for (const hs of registry.high_schools ?? []) {
    const row = byId.get(hs.id);
    if (!row) continue;
    row.city = hs.city ?? row.city;
    row.county = hs.county ?? row.county;
    row.district = hs.district ?? row.district;
    row.website = hs.website ?? row.website;
    row.calendar_feed = row.calendar_feed ?? {};
    row.calendar_feed.calendar_url = hs.calendar_url ?? row.calendar_feed.calendar_url;
    row.calendar_feed.athletics_url = hs.athletics_url ?? row.calendar_feed.athletics_url;
    row.calendar_feed.board_meeting_url = hs.board_meeting_url ?? row.calendar_feed.board_meeting_url;
    row.calendar_feed.last_harvest_at = hs.last_harvest_at ?? row.calendar_feed.last_harvest_at;
  }
  fs.writeFileSync(SCHOOL_DIR, JSON.stringify(dir, null, 2));
}

async function main() {
  if (!fs.existsSync(REGISTRY)) {
    console.error("Run npm run schools:discover first");
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  const cityMap = buildCityUrlMap();

  const toVerify = new Set();
  for (const [, d] of cityMap) {
    if (d.pattern_slug) urlCandidates(d.pattern_slug).slice(0, 4).forEach((u) => toVerify.add(u));
  }
  const verifyList = [...toVerify].slice(0, VERIFY_LIMIT);
  console.log(`[schools:attach-urls] Verifying up to ${verifyList.length} district URL candidates…`);
  const verifiedUrls = await verifyBatch(verifyList, { concurrency: 6 });

  for (const hs of registry.high_schools ?? []) {
    if (hs.calendar_url) hs.calendar_url = normalizeDistrictUrl(hs.calendar_url) || hs.website;
    if (hs.website) hs.website = normalizeDistrictUrl(hs.website);
    attachUrlsToSchool(hs, cityMap, verifiedUrls);
  }
  propagateLeaUrls(registry.high_schools ?? []);

  let collegesLinked = 0;
  for (const c of registry.colleges ?? []) {
    const urls = COLLEGE_URLS[c.institution_name];
    if (urls) {
      c.website = urls.website;
      c.athletics_url = urls.athletics ?? c.athletics_url;
      c.calendar_url = urls.calendar ?? c.calendar_url;
      c.ics_url = urls.ics ?? c.ics_url;
      c.ics_urls = urls.ics_urls ?? (urls.ics ? [urls.ics] : c.ics_urls);
      c.harvest_status = "urls_linked";
      c.url_attachment_method = "known_college";
      collegesLinked++;
    }
  }

  registry.generatedAt = new Date().toISOString();
  registry.harvest_pass = "27-url-attach";
  registry.summary = {
    ...registry.summary,
    highSchoolsCalendarUrl: (registry.high_schools ?? []).filter((s) => s.calendar_url).length,
    highSchoolsAthleticsUrl: (registry.high_schools ?? []).filter((s) => s.athletics_url).length,
    collegesWithUrls: collegesLinked,
    collegesCalendarUrl: (registry.colleges ?? []).filter((c) => c.calendar_url).length,
    collegesAthleticsUrl: (registry.colleges ?? []).filter((c) => c.athletics_url).length,
  };

  fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2));
  syncSchoolDirectory(registry);

  const health = writeSchoolHarvestHealth(registry);
  console.log(
    `[schools:attach-urls] HS calendar:${health.funnel.highSchoolsCalendarUrl}/${health.funnel.highSchoolsDiscovered} · athletics:${health.funnel.highSchoolsAthleticsUrl} · colleges:${health.funnel.collegesCalendarUrl}/${health.funnel.collegesDiscovered}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
