#!/usr/bin/env node
/**
 * Pass 26 — Discover Arkansas schools from ADE School Locator + college directory seed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseAdeSchoolLocatorHtml, slugifySchool } from "./lib/parse-ade-schools.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "data/schools/school-harvest-registry.json");
const COLLEGES = path.join(ROOT, "data/institutions/college-directory.json");
const ADE_URL = "https://adedata.arkansas.gov/LEA/Home/schools";

async function fetchAdeSchools() {
  const res = await fetch(ADE_URL, {
    headers: { "User-Agent": "ArkansasEverywhere-CivicBot/1.0 (+https://arkansaseverywhere.org)" },
  });
  if (!res.ok) throw new Error(`ADE fetch HTTP ${res.status}`);
  return parseAdeSchoolLocatorHtml(await res.text());
}

function mapSchool(s) {
  return {
    id: `ade-${s.lea_number ?? slugifySchool(s.school_name, s.city)}`,
    slug: slugifySchool(s.school_name, s.city),
    school_name: s.school_name,
    district: null,
    city: s.city,
    county: s.county,
    grades: s.grades_served,
    is_high_school: s.is_high_school,
    mascot: null,
    colors: null,
    principal: s.principal,
    superintendent: null,
    website: null,
    calendar_url: null,
    athletics_url: null,
    board_meeting_url: null,
    source_url: s.source_url,
    verification_status: "ade_directory",
    harvest_status: "discovered",
  };
}

function mapCollege(c) {
  return {
    id: c.id,
    slug: c.institution_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80),
    institution_name: c.institution_name,
    institution_type: c.institution_type,
    city: c.city,
    county: c.county,
    website: c.source_links?.[0]?.url ?? null,
    calendar_url: c.campus_calendar_url,
    athletics_url: null,
    enrollment: c.enrollment,
    source_url: "https://adedata.arkansas.gov/",
    verification_status: c.verified ? "verified" : "scaffold",
    harvest_status: "seed",
  };
}

async function main() {
  let schools = [];
  try {
    schools = await fetchAdeSchools();
    console.log(`[schools:discover] ADE parsed ${schools.length} schools`);
  } catch (e) {
    console.warn("[schools:discover] ADE fetch failed:", e.message);
    if (fs.existsSync(OUT)) {
      const prev = JSON.parse(fs.readFileSync(OUT, "utf8"));
      schools = prev.high_schools ?? [];
    }
  }

  const highSchools = schools.filter((s) => s.is_high_school).map(mapSchool);
  const allSchools = schools.map(mapSchool);

  const collegeBundle = JSON.parse(fs.readFileSync(COLLEGES, "utf8"));
  const colleges = (collegeBundle.colleges ?? []).map(mapCollege);
  const universities = colleges.filter((c) => c.institution_type === "university" || c.institution_type === "private_college");
  const communityColleges = colleges.filter((c) => c.institution_type === "community_college");

  const payload = {
    generatedAt: new Date().toISOString(),
    pass: "26",
    source: ADE_URL,
    summary: {
      totalSchoolsParsed: allSchools.length,
      highSchools: highSchools.length,
      colleges: colleges.length,
      universities: universities.length,
      communityColleges: communityColleges.length,
    },
    high_schools: highSchools,
    all_schools: allSchools,
    colleges,
    universities,
    community_colleges: communityColleges,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log(`[schools:discover] HS:${highSchools.length} · colleges:${colleges.length} → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
