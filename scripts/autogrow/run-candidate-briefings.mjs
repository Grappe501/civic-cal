#!/usr/bin/env node
/** Pass 24 — generate per-campaign briefing JSON (rule-based; AI enriches via API). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendRun, updateHealth, readJson, ROOT } from "./lib/autogrow-io.mjs";

const OUT_DIR = path.join(ROOT, "data/autogrow/candidate-briefings");

function loadWorkspaces() {
  const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, "data/campaigns/initial-campaign-workspaces.json"), "utf8"));
  return (bundle.workspaces ?? []).filter((w) => w.is_active !== false);
}

function loadEvents() {
  const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "data/seed-events.json"), "utf8")).events ?? [];
  const demo = JSON.parse(fs.readFileSync(path.join(ROOT, "data/seed-events-public-demo.json"), "utf8")).events ?? [];
  return [...seed, ...demo];
}

function inScope(event, ws) {
  const counties = (ws.counties ?? []).map((c) => c.toLowerCase());
  if (ws.district_scope?.mode === "statewide") return true;
  return counties.includes(String(event.county ?? "").toLowerCase());
}

function scoreSimple(event) {
  let s = 50;
  if (event.featured) s += 15;
  if (/fish fry|spaghetti|fair|festival|homecoming|rotary|farm bureau/i.test(`${event.title} ${event.description ?? ""}`)) s += 20;
  return Math.min(100, s);
}

function buildBriefing(ws, events) {
  const scoped = events.filter((e) => inScope(e, ws));
  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const monthEnd = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const upcoming = scoped
    .filter((e) => e.startAt?.slice(0, 10) >= today)
    .map((e) => ({ ...e, _score: scoreSimple(e) }))
    .sort((a, b) => b._score - a._score);

  const todayEvents = upcoming.filter((e) => e.startAt?.slice(0, 10) === today).slice(0, 5);
  const weekEvents = upcoming.filter((e) => e.startAt?.slice(0, 10) <= weekEnd).slice(0, 12);
  const monthEvents = upcoming.filter((e) => e.startAt?.slice(0, 10) <= monthEnd).slice(0, 20);

  const countiesPresent = new Set(scoped.map((e) => e.county));
  const gapCounties = (ws.counties ?? []).filter((c) => !countiesPresent.has(c));

  return {
    generatedAt: new Date().toISOString(),
    campaignSlug: ws.slug,
    candidateName: ws.candidate_name,
    today: {
      urgent: todayEvents.length ? [`${todayEvents.length} event(s) today in scope`] : ["No mapped events today — check feed scan queue"],
      topEvents: todayEvents.map(mapRec),
    },
    thisWeek: {
      topEvents: weekEvents.slice(0, 8).map(mapRec),
      countiesWithNoPresence: gapCounties.slice(0, 5),
      volunteerNeeds: weekEvents.filter((e) => /volunteer|cleanup|fair/i.test(e.title)).slice(0, 3).map(mapRec),
    },
    thisMonth: {
      topEvents: monthEvents.slice(0, 10).map(mapRec),
      coverageGaps: gapCounties,
      recurringTraditions: monthEvents.filter((e) => /fair|festival|homecoming|fish fry/i.test(e.title)).slice(0, 5).map(mapRec),
    },
    guardrails: ["Advisory only", "Human approval for public actions", "No invented attendance"],
  };
}

function mapRec(e) {
  return {
    title: e.title,
    slug: e.slug,
    county: e.county,
    date: e.startAt?.slice(0, 10),
    score: e._score,
    recommendation: e._score >= 75 ? "should_attend" : e._score >= 60 ? "send_volunteers" : "monitor_only",
    sourceUrl: e.sourceUrl ?? null,
  };
}

function main() {
  const workspaces = loadWorkspaces();
  const events = loadEvents();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let count = 0;
  for (const ws of workspaces) {
    const briefing = buildBriefing(ws, events);
    fs.writeFileSync(path.join(OUT_DIR, `${ws.slug}.json`), JSON.stringify(briefing, null, 2));
    count++;
  }

  const summary = { candidateBriefingsGenerated: count };
  appendRun("weekly_campaign_briefings", summary);
  updateHealth({
    lastCandidateBriefings: new Date().toISOString(),
    candidateBriefingsGenerated: count,
    status: "idle",
  });
  console.log(`[autogrow:briefings] ${count} campaign briefings → data/autogrow/candidate-briefings/`);
}

main();
