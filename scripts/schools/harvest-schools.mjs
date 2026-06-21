#!/usr/bin/env node
/**
 * Pass 26 — Enrich school harvest registry with public URL hooks (foundation pass).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REGISTRY = path.join(ROOT, "data/schools/school-harvest-registry.json");
const SCHOOL_DIR = path.join(ROOT, "data/institutions/school-directory.json");

const COLLEGE_URLS = {
  "University of Arkansas": { website: "https://www.uark.edu/", athletics: "https://arkansasrazorbacks.com/", calendar: "https://calendar.uark.edu/" },
  "Arkansas State University": { website: "https://www.astate.edu/", athletics: "https://astateredwolves.com/" },
  "University of Central Arkansas": { website: "https://uca.edu/", athletics: "https://ucasports.com/" },
  "University of Arkansas at Little Rock": { website: "https://ualr.edu/", athletics: "https://lrtrojans.com/" },
  "Arkansas Tech University": { website: "https://www.atu.edu/", athletics: "https://arkansastechsports.com/" },
};

async function main() {
  if (!fs.existsSync(REGISTRY)) {
    console.error("Run npm run schools:discover first");
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  let harvested = 0;

  for (const c of registry.colleges ?? []) {
    const urls = COLLEGE_URLS[c.institution_name];
    if (urls) {
      c.website = urls.website;
      c.athletics_url = urls.athletics ?? c.athletics_url;
      c.calendar_url = urls.calendar ?? c.calendar_url;
      c.harvest_status = "urls_linked";
      c.last_harvest_at = new Date().toISOString();
      harvested++;
    }
  }

  registry.generatedAt = new Date().toISOString();
  registry.harvest_pass = "26-foundation";
  registry.summary = {
    ...registry.summary,
    collegesWithUrls: harvested,
  };

  fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 2));

  // Merge high schools into institution directory scaffold (append new only)
  if (fs.existsSync(SCHOOL_DIR)) {
    const dir = JSON.parse(fs.readFileSync(SCHOOL_DIR, "utf8"));
    const existingIds = new Set((dir.schools ?? []).map((s) => s.id));
    const toAdd = (registry.high_schools ?? [])
      .filter((s) => !existingIds.has(s.id))
      .slice(0, 500)
      .map((s) => ({
        id: s.id,
        school_name: s.school_name,
        city: s.city,
        county: s.county ?? "Unknown",
        district: s.district ?? "Verify district",
        school_type: "public",
        grades_served: s.grades,
        mascot: s.mascot,
        school_colors: s.colors,
        principal: s.principal,
        superintendent: s.superintendent,
        website: s.website,
        governance: { board_meeting_schedule: null, board_meeting_location: null, board_members: [], public_comment_info: null },
        activities: {},
        calendar_feed: {
          harvest_targets: ["School Board Meeting", "Athletic Event", "Graduation", "Band Competition"],
          calendar_url: s.calendar_url,
          athletics_url: s.athletics_url,
          board_meeting_url: s.board_meeting_url,
          last_harvest_at: s.last_harvest_at ?? null,
        },
        source_links: [{ label: "ADE School Locator", url: s.source_url, type: "official" }],
        verified: false,
        status: "ade_discovered",
      }));

    if (toAdd.length) {
      dir.schools = [...(dir.schools ?? []), ...toAdd];
      dir.count = dir.schools.length;
      dir.updatedAt = new Date().toISOString();
      fs.writeFileSync(SCHOOL_DIR, JSON.stringify(dir, null, 2));
      console.log(`[schools:harvest] appended ${toAdd.length} high schools to school-directory.json`);
    }
  }

  console.log(`[schools:harvest] college URLs linked: ${harvested}`);
}

main();
