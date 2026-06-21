#!/usr/bin/env node
/**
 * Community Institutions Layer 1.0
 * Scaffolds church/school/college/org directories for 250 priority cities.
 * County rollups consume these — do not guess attendance; size_category null until verified.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOP_CITIES = path.join(ROOT, "data/local-intelligence/top-city-dossiers.json");
const OUT = path.join(ROOT, "data/institutions");

const CHURCH_EVENT_PATTERNS = [
  "Fish Fry", "Spaghetti Dinner", "Wild Game Dinner", "BBQ Fundraiser", "Pancake Breakfast",
  "Church Picnic", "Homecoming", "Fall Festival", "VBS", "Vacation Bible School",
  "Trunk or Treat", "Community Thanksgiving Meal", "Community Christmas Meal",
];

const SCHOOL_HARVEST_TARGETS = [
  "School Board Meeting", "Homecoming", "Senior Night", "Graduation",
  "Band Competition", "Athletic Event", "School Play", "Fundraiser",
];

const COLLEGE_HARVEST_TARGETS = ["Sports", "Concert", "Guest Speaker", "Graduation", "Community Event"];

const AR_COLLEGES = [
  { institution_name: "University of Arkansas", city: "Fayetteville", county: "Washington", institution_type: "university", enrollment: 32000 },
  { institution_name: "Arkansas State University", city: "Jonesboro", county: "Craighead", institution_type: "university", enrollment: 14000 },
  { institution_name: "University of Central Arkansas", city: "Conway", county: "Faulkner", institution_type: "university", enrollment: 10000 },
  { institution_name: "University of Arkansas at Little Rock", city: "Little Rock", county: "Pulaski", institution_type: "university", enrollment: 9000 },
  { institution_name: "Henderson State University", city: "Arkadelphia", county: "Clark", institution_type: "university", enrollment: 3500 },
  { institution_name: "Southern Arkansas University", city: "Magnolia", county: "Columbia", institution_type: "university", enrollment: 4500 },
  { institution_name: "Arkansas Tech University", city: "Russellville", county: "Pope", institution_type: "university", enrollment: 10000 },
  { institution_name: "University of Arkansas at Pine Bluff", city: "Pine Bluff", county: "Jefferson", institution_type: "university", enrollment: 2500 },
  { institution_name: "University of Arkansas at Monticello", city: "Monticello", county: "Drew", institution_type: "university", enrollment: 3500 },
  { institution_name: "University of the Ozarks", city: "Clarksville", county: "Johnson", institution_type: "private_college", enrollment: 900 },
  { institution_name: "Harding University", city: "Searcy", county: "White", institution_type: "private_college", enrollment: 4500 },
  { institution_name: "John Brown University", city: "Siloam Springs", county: "Benton", institution_type: "private_college", enrollment: 2500 },
  { institution_name: "Lyon College", city: "Batesville", county: "Independence", institution_type: "private_college", enrollment: 700 },
  { institution_name: "Ouachita Baptist University", city: "Arkadelphia", county: "Clark", institution_type: "private_college", enrollment: 1500 },
  { institution_name: "National Park College", city: "Hot Springs", county: "Garland", institution_type: "community_college", enrollment: 3000 },
  { institution_name: "NorthWest Arkansas Community College", city: "Bentonville", county: "Benton", institution_type: "community_college", enrollment: 8000 },
  { institution_name: "Pulaski Technical College", city: "North Little Rock", county: "Pulaski", institution_type: "community_college", enrollment: 6000 },
  { institution_name: "Phillips Community College", city: "Helena-West Helena", county: "Phillips", institution_type: "community_college", enrollment: 1500 },
];

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

fs.mkdirSync(OUT, { recursive: true });

const topBundle = JSON.parse(fs.readFileSync(TOP_CITIES, "utf8"));
const cities = topBundle.cities ?? [];

const churches = [];
const schools = [];
const organizations = [];

for (const c of cities) {
  const citySlug = slug(c.city);
  const county = c.county;

  churches.push({
    id: `church-${citySlug}-community-scaffold`,
    church_name: `${c.city} community church — verify name`,
    city: c.city,
    county,
    denomination: null,
    address: null,
    website: null,
    leadership_public: null,
    service_times: null,
    youth_programs: null,
    school_attached: null,
    food_pantry: null,
    community_meals: null,
    annual_events: [],
    vbs: null,
    trunk_or_treat: null,
    fish_fry: null,
    spaghetti_dinner: null,
    size_category: null,
    source_links: [],
    last_verified: null,
    verified: false,
    status: "scaffold",
  });

  if (c.priority_rank <= 50) {
    churches.push({
      id: `church-${citySlug}-second-scaffold`,
      church_name: `${c.city} — additional congregation (verify)`,
      city: c.city,
      county,
      denomination: null,
      size_category: null,
      source_links: [],
      verified: false,
      status: "scaffold",
    });
  }

  schools.push({
    id: `school-${citySlug}-district-scaffold`,
    school_name: `${c.city} public schools — verify campus`,
    city: c.city,
    county,
    district: `${c.city} School District — verify`,
    school_type: "public",
    grades_served: null,
    enrollment: null,
    mascot: null,
    school_colors: null,
    principal: null,
    superintendent: null,
    address: null,
    website: null,
    governance: {
      board_meeting_schedule: null,
      board_members: [],
      board_meeting_location: null,
      public_comment_info: null,
    },
    activities: {
      football: null, basketball: null, baseball: null, softball: null,
      soccer: null, track: null, band: null, choir: null, ffa: null, four_h: null, academic_teams: null,
    },
    calendar_feed: { harvest_targets: SCHOOL_HARVEST_TARGETS, last_harvest_at: null },
    source_links: [],
    last_verified: null,
    verified: false,
    status: "scaffold",
  });

  organizations.push(
    { id: `org-${citySlug}-library`, name: `${county} County / ${c.city} library — verify`, org_type: "library", city: c.city, county, verified: false },
    { id: `org-${citySlug}-chamber`, name: `${c.city} Chamber of Commerce — verify`, org_type: "chamber", city: c.city, county, verified: false },
    { id: `org-${citySlug}-vfd`, name: `${c.city} VFD — verify`, org_type: "vfd", city: c.city, county, verified: false },
  );

  if (c.priority_rank <= 30) {
    organizations.push(
      { id: `org-${citySlug}-rotary`, name: `${c.city} Rotary — verify chapter`, org_type: "rotary", city: c.city, county, verified: false },
      { id: `org-${citySlug}-farm-bureau`, name: `${county} Farm Bureau — verify`, org_type: "farm_bureau", city: c.city, county, verified: false },
    );
  }
}

const countySet = new Set(cities.map((c) => c.county));
for (const county of countySet) {
  organizations.push({
    id: `org-${slug(county)}-county-hospital-scaffold`,
    name: `${county} County hospital / clinic — verify`,
    org_type: "hospital",
    city: cities.find((c) => c.county === county)?.city ?? county,
    county,
    verified: false,
  });
}

const colleges = AR_COLLEGES.map((col) => ({
  id: `college-${slug(col.institution_name)}`,
  ...col,
  student_demographics: null,
  athletics: ["Football", "Basketball", "Baseball", "Softball", "Track", "Band"],
  major_programs: [],
  campus_calendar_url: null,
  public_events_notes: "Campus calendar — harvest as event source",
  calendar_feed: { harvest_targets: COLLEGE_HARVEST_TARGETS, last_harvest_at: null },
  source_links: [{ label: "Institution website (verify)", url: "https://www.arkansas.gov/education", type: "hook" }],
  last_verified: null,
  verified: false,
  status: "scaffold",
}));

fs.writeFileSync(path.join(OUT, "church-directory.json"), JSON.stringify({
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  policy: "Do not guess attendance. size_category only when publicly verified.",
  count: churches.length,
  churches,
}, null, 2));

fs.writeFileSync(path.join(OUT, "school-directory.json"), JSON.stringify({
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  count: schools.length,
  schools,
}, null, 2));

fs.writeFileSync(path.join(OUT, "college-directory.json"), JSON.stringify({
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  count: colleges.length,
  colleges,
}, null, 2));

fs.writeFileSync(path.join(OUT, "civic-organizations.json"), JSON.stringify({
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  count: organizations.length,
  organizations,
}, null, 2));

fs.writeFileSync(path.join(OUT, "church-event-harvest-patterns.json"), JSON.stringify({
  version: 1,
  patterns: CHURCH_EVENT_PATTERNS,
  queryTemplate: "{city} Arkansas {pattern} church",
  notes: "Church Event Engine — highest community-attendance events in Arkansas",
}, null, 2));

console.log(`[generate-institutions] ${churches.length} churches, ${schools.length} schools, ${colleges.length} colleges, ${organizations.length} orgs`);
