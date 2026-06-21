#!/usr/bin/env node
/**
 * Generates public/sitemap.xml from bundled registry data (no TS compile required).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const SITE = "https://arkansaseverywhere.org";

function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

function citySlug(city) {
  return slugify(city);
}

function countySlug(county) {
  return slugify(county.replace(/\s+County$/i, ""));
}

function traditionSlug(id) {
  return id.replace(/^rec-/, "");
}

function orgSlug(name, county) {
  return slugify(`${name}-${county}`);
}

const urls = new Set();

function add(path) {
  if (!path || path === "/") urls.add("/");
  else urls.add(path.startsWith("/") ? path : `/${path}`);
}

// Static routes
[
  "/",
  "/calendar",
  "/calendar/day",
  "/calendar/week",
  "/calendar/month",
  "/explore",
  "/map",
  "/submit",
  "/organizations",
  "/churches",
  "/schools",
  "/colleges",
  "/races",
  "/festivals",
  "/parades",
  "/volunteer-opportunities",
  "/dates",
  "/counties",
  "/this-week",
  "/help-build-the-calendar",
  "/student-service",
  "/campaigns",
].forEach(add);

// Events
for (const bundle of ["data/seed-events.json", "data/seed-events-public-demo.json"]) {
  try {
    const { events = [] } = readJson(bundle);
    for (const e of events) {
      if (e.slug) add(`/event/${e.slug}`);
    }
  } catch {
    /* optional bundle */
  }
}

// Approved ingestion bundles → event pages
for (const bundle of [
  "data/ingestion/political-party-meetings-approved-events.json",
  "data/ingestion/school-events-approved-events.json",
  "data/ingestion/fair-festival-approved-events.json",
  "data/ingestion/county-fair-approved-events.json",
  "data/ingestion/top250-city-festival-approved-events.json",
  "data/ingestion/historic-political-events-approved-events.json",
]) {
  try {
    const { events = [] } = readJson(bundle);
    for (const e of events) {
      if (e.slug) add(`/event/${e.slug}`);
    }
  } catch {
    /* optional bundle */
  }
}

// Pass 32 festival / city narrative profiles
try {
  const { narratives = [] } = readJson("data/narratives/community-narratives.json");
  for (const n of narratives) {
    if (n.entityType === "festival" && n.slug) add(`/festival/${n.slug}`);
  }
} catch {
  /* skip */
}

try {
  const { cities = [] } = readJson("data/local-intelligence/top-city-dossiers.json");
  for (const c of cities) {
    add(`/${citySlug(c.city)}`);
  }
} catch {
  /* skip */
}
try {
  const { counties = [] } = readJson("data/local-intelligence/county-dossiers.json");
  for (const c of counties) {
    add(`/${countySlug(c.county)}-county`);
  }
} catch {
  /* skip */
}

// Organizations / churches / schools / colleges
for (const file of [
  "data/institutions/church-directory.json",
  "data/institutions/school-directory.json",
  "data/institutions/college-directory.json",
  "data/institutions/civic-organizations.json",
  "data/institutions/community-anchors-directory.json",
]) {
  try {
    const data = readJson(file);
    const rows = data.organizations ?? data.institutions ?? data.churches ?? data.schools ?? data.colleges ?? data.entries ?? [];
    for (const row of rows) {
      const name = row.name ?? row.organization_name ?? row.title;
      const county = row.county ?? "arkansas";
      if (!name) continue;
      const slug = row.slug ?? orgSlug(name, county);
      add(`/organization/${slug}`);
      const type = row.host_type ?? row.hostType ?? row.type ?? "";
      if (/church/i.test(type) || file.includes("church")) add(`/church/${slug}`);
      if (/school/i.test(type) || file.includes("school")) add(`/school/${slug}`);
      if (/college|university/i.test(type) || file.includes("college")) add(`/college/${slug}`);
    }
  } catch {
    /* skip */
  }
}

// Traditions → festival / parade
try {
  const { traditions = [] } = readJson("data/ingestion/recurring-events-registry.json");
  for (const t of traditions) {
    const slug = traditionSlug(t.id);
    if (/parade/i.test(t.event_name)) add(`/parade/${slug}`);
    else add(`/festival/${slug}`);
  }
} catch {
  /* skip */
}

// State dates
try {
  const { dates = [] } = readJson("data/state-dates/statewide-calendar-dates.json");
  for (const d of dates) {
    if (d.id) add(`/date/${d.id}`);
  }
} catch {
  /* skip */
}

// Volunteer opportunities
try {
  const { opportunities = [] } = readJson("data/student-service/seed-opportunities.json");
  for (const o of opportunities) {
    if (o.id) add(`/volunteer/${o.id}`);
  }
} catch {
  /* skip */
}

// Candidates
try {
  const { workspaces = [] } = readJson("data/campaigns/initial-campaign-workspaces.json");
  for (const w of workspaces) {
    if (w.slug) add(`/candidate/${w.slug}`);
  }
} catch {
  /* skip */
}

const today = new Date().toISOString().slice(0, 10);
const body = [...urls]
  .sort()
  .map(
    (loc) => `  <url>
    <loc>${SITE}${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`,
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

const out = join(root, "public", "sitemap.xml");
writeFileSync(out, xml, "utf8");
console.log(`Wrote ${urls.size} URLs to public/sitemap.xml`);
