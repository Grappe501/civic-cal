#!/usr/bin/env node
/**
 * Community Anchor Intelligence — extension offices + homemaker clubs per county.
 * Run: npm run generate:community-anchors
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COUNTIES = path.join(ROOT, "data/local-intelligence/county-dossiers.json");
const OUT = path.join(ROOT, "data/institutions/community-anchors-directory.json");

const EXTENSION_HARVEST = [
  "4-H meeting", "Livestock show", "Food preservation class", "Gardening workshop",
  "Poultry workshop", "Farm management event", "Youth leadership program",
  "Master Gardener event", "Family consumer science event",
];

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const bundle = JSON.parse(fs.readFileSync(COUNTIES, "utf8"));
const counties = (bundle.counties ?? []).map((c) => c.county);

const extensionOffices = counties.map((county) => ({
  id: `ext-${slug(county)}-cooperative`,
  county,
  office_name: `${county} County Cooperative Extension Office — verify`,
  address: null,
  website: "https://www.uaex.uada.edu/counties/",
  calendar_url: null,
  newsletter_url: null,
  agriculture_agents: [],
  family_consumer_agents: [],
  four_h_agents: [],
  harvest_targets: EXTENSION_HARVEST,
  verified: false,
  status: "scaffold",
}));

const homemakerClubs = [];
for (const county of counties) {
  homemakerClubs.push(
    {
      id: `eh-${slug(county)}-county-association`,
      club_name: `${county} County Extension Homemakers — verify association`,
      county,
      city: null,
      meeting_location: null,
      meeting_schedule: null,
      county_association: `${county} County EHC`,
      public_events_notes: "Craft fairs, food events, holiday fundraisers — harvest when public",
      verified: false,
      status: "scaffold",
    },
    {
      id: `eh-${slug(county)}-community-club`,
      club_name: `${county} County EH community club — verify name`,
      county,
      city: null,
      meeting_location: null,
      meeting_schedule: null,
      county_association: `${county} County EHC`,
      public_events_notes: null,
      verified: false,
      status: "scaffold",
    },
  );
}

const payload = {
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  policy: "Public staff directories and contact info only — verify before marking verified",
  extension_offices: extensionOffices,
  homemaker_clubs: homemakerClubs,
  counts: {
    extension_offices: extensionOffices.length,
    homemaker_clubs: homemakerClubs.length,
  },
};

fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.log(`[generate-community-anchors] ${extensionOffices.length} extension offices, ${homemakerClubs.length} homemaker clubs`);
