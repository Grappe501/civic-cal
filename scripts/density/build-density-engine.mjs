#!/usr/bin/env node
/**
 * Event Density Engine 1.0 — writes county-density-report.json from bundled data.
 * Run: npm run density:build
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = path.join(ROOT, "data/density");
const OUT_FILE = path.join(OUT_DIR, "county-density-report.json");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function normCounty(c) {
  return String(c).replace(/\s+County$/i, "").trim();
}

const ARKANSAS_COUNTIES = readJson("data/arkansas-counties.json").counties ?? [];

const seedEvents = [
  ...(readJson("data/seed-events.json").events ?? []),
  ...(readJson("data/seed-events-public-demo.json").events ?? []),
];

const churches = readJson("data/institutions/church-directory.json").churches ?? [];
const schools = readJson("data/institutions/school-directory.json").schools ?? [];
const colleges = readJson("data/institutions/college-directory.json").colleges ?? [];
const orgs = readJson("data/institutions/civic-organizations.json").organizations ?? [];
const anchors = readJson("data/institutions/community-anchors-directory.json");
const extensions = anchors.extension_offices ?? [];
const homemakers = anchors.homemaker_clubs ?? [];
const vfdsOrg = orgs.filter((o) => /vfd|fire/i.test(String(o.org_type ?? o.orgType ?? "")));
const traditions = readJson("data/ingestion/recurring-events-registry.json").traditions ?? [];
const volunteers = readJson("data/student-service/seed-opportunities.json").opportunities ?? [];
const discovered = readJson("data/ingestion/discovered-sources/top-200-city-sources.json").cities ?? [];
const cities250 = readJson("data/local-intelligence/top-city-dossiers.json").cities ?? [];

const CHURCH_PATTERNS = ["Fish Fry", "Spaghetti Dinner"];
const SCHOOL_PATTERNS = ["School Board Meeting", "Homecoming", "Football Game", "Basketball Game"];

function countInst(county) {
  const c = normCounty(county).toLowerCase();
  const filter = (rows, key = "county") => rows.filter((r) => String(r[key] ?? "").toLowerCase() === c);
  const ch = filter(churches).length;
  const sc = filter(schools).length;
  const co = filter(colleges).length;
  const org = filter(orgs).length;
  const ext = filter(extensions).length;
  const hom = filter(homemakers).length;
  return { churches: ch, schools: sc, colleges: co, organizations: org, extensionOffices: ext, homemakerClubs: hom, total: ch + sc + co + org + ext + hom };
}

function countEvents(county) {
  const c = normCounty(county).toLowerCase();
  const rows = seedEvents.filter((e) => String(e.county ?? "").toLowerCase() === c);
  const churchRe = /church|fish fry|spaghetti|bbq|vbs/i;
  const schoolRe = /school|football|basketball|homecoming/i;
  return {
    total: rows.length,
    churchTagged: rows.filter((e) => churchRe.test(`${e.title} ${e.description ?? ""}`)).length,
    schoolTagged: rows.filter((e) => schoolRe.test(`${e.title} ${e.description ?? ""}`)).length,
  };
}

function projected(county) {
  const c = normCounty(county).toLowerCase();
  let n = traditions.filter((t) => String(t.county ?? "").toLowerCase() === c).length;
  for (const ch of churches.filter((x) => String(x.county ?? "").toLowerCase() === c)) {
    n += (ch.annual_events?.length || 0) > 0 ? ch.annual_events.length : CHURCH_PATTERNS.length;
  }
  for (const sc of schools.filter((x) => String(x.county ?? "").toLowerCase() === c)) {
    n += SCHOOL_PATTERNS.length;
  }
  for (const col of colleges.filter((x) => String(x.county ?? "").toLowerCase() === c)) {
    n += 4;
  }
  for (const ext of extensions.filter((x) => String(x.county ?? "").toLowerCase() === c)) {
    n += Math.min(6, (ext.harvest_targets ?? []).length || 6);
  }
  n += homemakers.filter((x) => String(x.county ?? "").toLowerCase() === c).length;
  n += vfdsOrg.filter((x) => String(x.county ?? "").toLowerCase() === c).length * 3;
  return n;
}

function citiesInCounty(county) {
  const c = normCounty(county).toLowerCase();
  return cities250.filter((x) => String(x.county ?? "").toLowerCase() === c).length;
}

function sourceFeeds(county) {
  const c = normCounty(county).toLowerCase();
  return discovered.filter((x) => String(x.county ?? "").toLowerCase() === c && (x.source_templates?.length ?? 0) > 0).length;
}

function score(inst, ev, trad, vol, feeds, cities, proj) {
  if (inst.total === 0) return 0;
  const eventRatio = Math.min(1, ev.total / Math.max(12, inst.total * 0.4));
  const tradScore = Math.min(1, trad / 5);
  const feedScore = cities > 0 ? Math.min(1, feeds / cities) : 0;
  const projScore = Math.min(1, proj / 50);
  return Math.round(Math.min(100, eventRatio * 35 + tradScore * 15 + feedScore * 15 + projScore * 35));
}

const counties = ARKANSAS_COUNTIES.map((county) => {
  const inst = countInst(county);
  const ev = countEvents(county);
  const trad = traditions.filter((t) => normCounty(t.county ?? "").toLowerCase() === normCounty(county).toLowerCase()).length;
  const vol = volunteers.filter((v) => normCounty(v.county ?? "").toLowerCase() === normCounty(county).toLowerCase()).length;
  const feeds = sourceFeeds(county);
  const cities = citiesInCounty(county);
  const proj = projected(county);
  const coverageScore = score(inst, ev, trad, vol, feeds, cities, proj);
  const gaps = [];
  if (inst.churches >= 5 && ev.churchTagged < Math.ceil(inst.churches * 0.15)) {
    gaps.push({ kind: "church_events", severity: "critical", message: `${inst.churches} churches, ${ev.churchTagged} church events` });
  }
  if (inst.total >= 10 && ev.total < 10) {
    gaps.push({ kind: "overall_sparse", severity: "critical", message: `${inst.total} institutions, ${ev.total} events` });
  }
  return { county, institutions: inst, events: ev, recurringTraditions: trad, volunteerOpportunities: vol, sourceFeedsDiscovered: feeds, citiesInCounty: cities, projectedFutureEvents: proj, coverageScore, gaps };
}).sort((a, b) => a.coverageScore - b.coverageScore);

const totalProjected = counties.reduce((n, c) => n + c.projectedFutureEvents, 0);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  OUT_FILE,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalProjectedFutureEvents: totalProjected,
      goalProjectedEvents: 5000,
      goalMet: totalProjected >= 5000,
      counties,
      bottomCounties: counties.slice(0, 15),
    },
    null,
    2,
  ),
);

console.log(`[density:build] ${counties.length} counties · ${totalProjected} projected feeds · goal 5000 ${totalProjected >= 5000 ? "✓" : `(need ${5000 - totalProjected} more)`}`);
console.log(`[density:build] → ${OUT_FILE}`);
