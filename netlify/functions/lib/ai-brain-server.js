/**
 * AI Brain server-side tool execution and answer synthesis.
 * Reads data/ai-brain indexes + bundled seed at runtime.
 */
const fs = require("node:fs");
const path = require("node:path");
const { loadBundledSeedEvents } = require("./bundledSeed.cjs");

const DATA = path.join(__dirname, "..", "..", "..", "data");

function readJson(rel) {
  const p = path.join(DATA, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

let _cache = null;
function loadBrainData() {
  if (_cache) return _cache;
  _cache = {
    events: loadBundledSeedEvents(),
    eventIndex: readJson("ai-brain/event-index.json") ?? { events: [] },
    placeIndex: readJson("ai-brain/place-index.json") ?? { counties: [], cities: [], thinCounties: [] },
    orgIndex: readJson("ai-brain/org-index.json") ?? { organizations: [] },
    feedIndex: readJson("ai-brain/feed-index.json") ?? { counties: [], thinCounties: [], metrics: {} },
    candidateIndex: readJson("ai-brain/candidate-index.json") ?? { candidates: [] },
    coverageIndex: readJson("ai-brain/coverage-index.json") ?? {},
    sourceIndex: readJson("ai-brain/source-index.json") ?? { sources: [] },
    researchTasks: readJson("ai-brain/research-tasks.json") ?? { tasks: [] },
    fairRegistry: readJson("fairs/arkansas-county-fair-registry.json") ?? { fairs: [] },
    stagedBundles: [
      readJson("ingestion/staged-event-candidates.json"),
      readJson("ingestion/political-party-meetings-staged.json"),
      readJson("ingestion/school-events-staged.json"),
      readJson("ingestion/fair-festival-staged.json"),
      readJson("ingestion/county-fair-staged.json"),
    ],
  };
  return _cache;
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+county$/i, "")
    .trim();
}

function matchText(hay, needle) {
  if (!needle) return true;
  return norm(hay).includes(norm(needle));
}

function toolResult(data, opts = {}) {
  return {
    data,
    sources: opts.sources ?? [],
    confidence: opts.confidence ?? "medium",
    missing: opts.missing ?? [],
    freshness: opts.freshness ?? readJson("ai-brain/event-index.json")?.generatedAt ?? null,
  };
}

function searchEvents({ query, county, city, limit = 20 }) {
  const { events } = loadBrainData();
  let rows = events;
  if (county) rows = rows.filter((e) => norm(e.county) === norm(county));
  if (city) rows = rows.filter((e) => matchText(e.city, city));
  if (query) {
    rows = rows.filter(
      (e) =>
        matchText(e.title, query) ||
        matchText(e.description, query) ||
        matchText(e.category, query),
    );
  }
  rows = rows.slice(0, limit);
  return toolResult(
    { count: rows.length, events: rows.map((e) => ({ slug: e.slug, title: e.title, county: e.county, city: e.city, startAt: e.startAt })) },
    {
      sources: [...new Set(rows.map((e) => e.sourceUrl ?? e.source_url).filter(Boolean))].slice(0, 10),
      confidence: rows.length ? "high" : "low",
      missing: rows.length ? [] : ["No matching events in bundled seed index."],
    },
  );
}

function searchOrganizations({ query, county, limit = 20 }) {
  const { orgIndex } = loadBrainData();
  let rows = orgIndex.organizations ?? [];
  if (county) rows = rows.filter((o) => norm(o.county) === norm(county));
  if (query) rows = rows.filter((o) => matchText(o.name, query) || matchText(o.category, query));
  rows = rows.slice(0, limit);
  return toolResult(
    { count: rows.length, organizations: rows },
    { confidence: rows.length ? "medium" : "low", missing: rows.length ? [] : ["No organizations matched."] },
  );
}

function searchCities({ query, county, limit = 30 }) {
  const { placeIndex } = loadBrainData();
  let rows = placeIndex.cities ?? [];
  if (county) rows = rows.filter((c) => norm(c.county) === norm(county));
  if (query) rows = rows.filter((c) => matchText(c.city, query));
  rows = rows.slice(0, limit);
  return toolResult({ count: rows.length, cities: rows }, { confidence: "high" });
}

function searchCounties({ query, thinOnly = false, limit = 75 }) {
  const { placeIndex } = loadBrainData();
  let rows = placeIndex.counties ?? [];
  if (thinOnly) rows = rows.filter((c) => c.thin);
  if (query) rows = rows.filter((c) => matchText(c.county, query));
  rows = rows.slice(0, limit);
  return toolResult(
    { count: rows.length, counties: rows, thinCounties: placeIndex.thinCounties ?? [] },
    { confidence: "high", freshness: placeIndex.generatedAt },
  );
}

function searchCandidates({ query, limit = 20 }) {
  const { candidateIndex } = loadBrainData();
  let rows = candidateIndex.candidates ?? [];
  if (query) rows = rows.filter((c) => matchText(c.name, query) || matchText(c.office, query) || matchText(c.slug, query));
  rows = rows.slice(0, limit);
  return toolResult({ count: rows.length, candidates: rows }, { confidence: "high" });
}

function searchFeeds({ query, county, thinOnly = false, limit = 30 }) {
  const { feedIndex } = loadBrainData();
  let rows = feedIndex.counties ?? [];
  if (county) rows = rows.filter((c) => norm(c.county) === norm(county));
  if (thinOnly) rows = rows.filter((c) => c.thin);
  if (query) rows = rows.filter((c) => matchText(c.county, query));
  rows = rows.slice(0, limit);
  return toolResult(
    { count: rows.length, counties: rows, metrics: feedIndex.metrics },
    { confidence: "high", freshness: feedIndex.generatedAt },
  );
}

function searchStagedCandidates({ query, limit = 30 }) {
  const { stagedBundles } = loadBrainData();
  const all = [];
  for (const bundle of stagedBundles) {
    const list = bundle?.candidates ?? bundle?.events ?? [];
    for (const c of list) all.push(c);
  }
  let rows = all;
  if (query) {
    rows = rows.filter(
      (c) =>
        matchText(c.title, query) ||
        matchText(c.name, query) ||
        matchText(c.county, query) ||
        matchText(c.city, query),
    );
  }
  rows = rows.slice(0, limit);
  return toolResult(
    { count: rows.length, staged: rows.map((c) => ({ title: c.title ?? c.name, county: c.county, city: c.city, status: c.status ?? "staged" })) },
    { confidence: "medium", missing: ["Staged items require human approval before publishing."] },
  );
}

function searchCoverageGaps({ county }) {
  const { placeIndex, feedIndex, coverageIndex } = loadBrainData();
  const countyNorm = county ? norm(county) : null;
  const thinEvents = (placeIndex.counties ?? []).filter((c) => c.thin && (!countyNorm || norm(c.county) === countyNorm));
  const thinFeeds = (feedIndex.counties ?? []).filter((c) => c.thin && (!countyNorm || norm(c.county) === countyNorm));
  return toolResult(
    {
      thinEventCounties: thinEvents,
      thinFeedCounties: thinFeeds,
      eventsNeedingSource: coverageIndex.eventsNeedingSource ?? 0,
    },
    { confidence: "high", freshness: coverageIndex.generatedAt },
  );
}

function getEventDossier({ slug, title }) {
  const { events } = loadBrainData();
  const event = events.find((e) => e.slug === slug || matchText(e.title, title));
  if (!event) {
    return toolResult(null, { confidence: "low", missing: ["Event not found in bundled seed."] });
  }
  return toolResult(
    {
      slug: event.slug,
      title: event.title,
      county: event.county,
      city: event.city,
      description: event.description,
      startAt: event.startAt,
      endAt: event.endAt,
      category: event.category,
      sourceUrl: event.sourceUrl ?? event.source_url,
      verificationStatus: event.verificationStatus ?? event.verification_status,
    },
    {
      sources: [event.sourceUrl ?? event.source_url].filter(Boolean),
      confidence: event.sourceUrl || event.source_url ? "high" : "low",
      missing: event.sourceUrl || event.source_url ? [] : ["No source URL on record."],
    },
  );
}

function getCountyDossier({ county }) {
  const { placeIndex, feedIndex, events } = loadBrainData();
  const cNorm = norm(county);
  const place = (placeIndex.counties ?? []).find((c) => norm(c.county) === cNorm);
  const feed = (feedIndex.counties ?? []).find((c) => norm(c.county) === cNorm);
  const countyEvents = events.filter((e) => norm(e.county) === cNorm).slice(0, 15);
  return toolResult(
    {
      county: place?.county ?? county,
      eventCount: place?.eventCount ?? countyEvents.length,
      thin: place?.thin ?? countyEvents.length < 3,
      feedCoverage: feed ?? null,
      sampleEvents: countyEvents.map((e) => ({ slug: e.slug, title: e.title })),
    },
    {
      sources: countyEvents.map((e) => e.sourceUrl ?? e.source_url).filter(Boolean).slice(0, 5),
      confidence: place ? "high" : "medium",
      missing: place?.thin ? [`${county} is thin on indexed public events.`] : [],
      freshness: placeIndex.generatedAt,
    },
  );
}

function getCityDossier({ city, county }) {
  const { placeIndex, events } = loadBrainData();
  const cityNorm = norm(city);
  const row = (placeIndex.cities ?? []).find(
    (c) => norm(c.city) === cityNorm && (!county || norm(c.county) === norm(county)),
  );
  const cityEvents = events
    .filter((e) => norm(e.city) === cityNorm && (!county || norm(e.county) === norm(county)))
    .slice(0, 15);
  return toolResult(
    {
      city: row?.city ?? city,
      county: row?.county ?? county,
      eventCount: row?.eventCount ?? cityEvents.length,
      sampleEvents: cityEvents.map((e) => ({ slug: e.slug, title: e.title })),
    },
    { confidence: cityEvents.length ? "high" : "low", missing: cityEvents.length ? [] : ["No indexed events for this city."] },
  );
}

function getCandidateBrief({ slug }) {
  const { candidateIndex } = loadBrainData();
  const c = (candidateIndex.candidates ?? []).find((x) => x.slug === slug);
  if (!c) return toolResult(null, { confidence: "low", missing: ["Candidate workspace not found."] });
  return toolResult(c, { confidence: "high" });
}

function recommendHarvestTargets({ limit = 10 }) {
  const { placeIndex, feedIndex, researchTasks } = loadBrainData();
  const targets = [];
  for (const county of (placeIndex.thinCounties ?? []).slice(0, limit)) {
    targets.push({ county, reason: "thin_event_coverage", priority: "high" });
  }
  for (const county of (feedIndex.thinCounties ?? []).slice(0, limit)) {
    if (!targets.find((t) => t.county === county)) {
      targets.push({ county, reason: "thin_feed_attachment", priority: "medium" });
    }
  }
  const fairTasks = (researchTasks.tasks ?? []).filter((t) => t.task_type === "county_fair_dates").slice(0, 5);
  return toolResult(
    { targets: targets.slice(0, limit), fairResearchTasks: fairTasks },
    { confidence: "high", missing: ["Harvest recommendations require human approval before publish."] },
  );
}

function explainEventPriority({ slug }) {
  const dossier = getEventDossier({ slug });
  if (!dossier.data) return dossier;
  const layer = dossier.data.category ?? "community";
  return toolResult(
    {
      slug: dossier.data.slug,
      title: dossier.data.title,
      factors: [
        `Category/layer: ${layer}`,
        dossier.data.county ? `County presence: ${dossier.data.county}` : "Statewide or online",
        dossier.sources.length ? "Has source URL on record" : "Missing source — lower confidence",
      ],
      note: "Priority scoring uses relationship density and campaign scope in dashboard; this is index-level context only.",
    },
    dossier,
  );
}

function summarizeCalendarRange({ startDate, endDate, county }) {
  const { events } = loadBrainData();
  const start = startDate ? new Date(startDate).getTime() : Date.now();
  const end = endDate ? new Date(endDate).getTime() : start + 7 * 86400000;
  let rows = events.filter((e) => {
    const t = new Date(e.startAt ?? e.start_at ?? 0).getTime();
    return t >= start && t <= end;
  });
  if (county) rows = rows.filter((e) => norm(e.county) === norm(county));
  return toolResult(
    { count: rows.length, events: rows.slice(0, 25).map((e) => ({ slug: e.slug, title: e.title, startAt: e.startAt })) },
    { confidence: "high", sources: rows.map((e) => e.sourceUrl ?? e.source_url).filter(Boolean).slice(0, 5) },
  );
}

function findMissingSources({ limit = 20 }) {
  const { events, coverageIndex } = loadBrainData();
  const missing = events.filter((e) => !(e.sourceUrl ?? e.source_url)).slice(0, limit);
  return toolResult(
    {
      totalMissing: coverageIndex.eventsNeedingSource ?? missing.length,
      events: missing.map((e) => ({ slug: e.slug, title: e.title, county: e.county })),
    },
    { confidence: "high", missing: ["Events without sources need human verification before trust claims."] },
  );
}

function generateResearchTasks({ limit = 15 }) {
  const { researchTasks } = loadBrainData();
  const open = (researchTasks.tasks ?? []).filter((t) => t.status === "open").slice(0, limit);
  return toolResult(
    { openCount: researchTasks.openCount ?? open.length, tasks: open },
    {
      confidence: "high",
      missing: ["Research tasks are suggestions — humans approve before harvest runs publish."],
      freshness: researchTasks.generatedAt,
    },
  );
}

function findMissingCountyFairs({ county }) {
  const { fairRegistry } = loadBrainData();
  let fairs = (fairRegistry.fairs ?? []).filter((f) => !f.is_state_fair && !f.is_regional_fair);
  if (county) fairs = fairs.filter((f) => norm(f.county) === norm(county));

  const rows = fairs.map((f) => ({
    county: f.county,
    fair_name: f.fair_name,
    fair_found: true,
    date_verified: f.verification_status === "verified_dated",
    verification_status: f.verification_status,
    date_start: f.date_start,
    date_end: f.date_end,
    source_url: f.source_url ?? f.cofairs_url ?? null,
    research_query: `${f.fair_name} ${f.county} County Arkansas 2026 fair dates`,
    approval_status: f.verification_status === "verified_dated" ? "approved_for_calendar" : "needs_human_review",
  }));

  const missingDates = rows.filter((r) => !r.date_verified);
  return toolResult(
    {
      totalCounties: rows.length,
      verifiedCount: rows.filter((r) => r.date_verified).length,
      missingDatesCount: missingDates.length,
      fairs: rows,
      stateFair: (fairRegistry.fairs ?? []).find((f) => f.is_state_fair) ?? null,
    },
    {
      confidence: "high",
      freshness: fairRegistry.generatedAt,
      sources: rows.map((r) => r.source_url).filter(Boolean).slice(0, 10),
      missing: missingDates.length ? [`${missingDates.length} county fairs lack verified 2026 dates.`] : [],
    },
  );
}

const TOOLS = {
  searchEvents,
  searchOrganizations,
  searchCities,
  searchCounties,
  searchCandidates,
  searchFeeds,
  searchStagedCandidates,
  searchCoverageGaps,
  getEventDossier,
  getCountyDossier,
  getCityDossier,
  getCandidateBrief,
  recommendHarvestTargets,
  explainEventPriority,
  summarizeCalendarRange,
  findMissingSources,
  generateResearchTasks,
  findMissingCountyFairs,
};

const PUBLIC_TOOLS = new Set([
  "searchEvents",
  "searchOrganizations",
  "searchCities",
  "searchCounties",
  "getEventDossier",
  "getCityDossier",
  "getCountyDossier",
  "summarizeCalendarRange",
]);

const ADMIN_TOOLS = new Set(Object.keys(TOOLS));

const CAMPAIGN_TOOLS = new Set([
  ...PUBLIC_TOOLS,
  "searchCandidates",
  "searchCoverageGaps",
  "recommendHarvestTargets",
  "explainEventPriority",
  "generateResearchTasks",
  "findMissingCountyFairs",
]);

function allowedTools(mode) {
  if (mode === "public") return PUBLIC_TOOLS;
  if (mode === "campaign") return CAMPAIGN_TOOLS;
  return ADMIN_TOOLS;
}

function routeTools(question, mode, ctx = {}) {
  const q = norm(question);
  const picks = [];
  const { county, city, campaignSlug } = ctx;

  if (/county fair|fair date|missing fair|cofairs/.test(q)) picks.push({ name: "findMissingCountyFairs", args: { county } });
  if (/harvest|grow fastest|attach next|thin|coverage gap|white county|feed/.test(q)) {
    picks.push({ name: "searchCoverageGaps", args: { county } });
    picks.push({ name: "recommendHarvestTargets", args: {} });
    if (/feed/.test(q)) picks.push({ name: "searchFeeds", args: { county, thinOnly: true } });
  }
  if (/source confirm|missing source|needs confirmation/.test(q)) picks.push({ name: "findMissingSources", args: {} });
  if (/research task|human review|approval/.test(q)) picks.push({ name: "generateResearchTasks", args: {} });
  if (/candidate|brief|campaign/.test(q) && mode !== "public" && campaignSlug) {
    picks.push({ name: "getCandidateBrief", args: { slug: campaignSlug } });
  }
  if (/organization|church|school|institution/.test(q)) picks.push({ name: "searchOrganizations", args: { query: question, county } });
  if (/this week|weekend|today|calendar|festival|volunteer|race|fair|food truck/.test(q)) {
    picks.push({ name: "searchEvents", args: { query: question, county, city } });
    picks.push({ name: "summarizeCalendarRange", args: { county } });
  }
  if (/county/.test(q) && !picks.some((p) => p.name === "getCountyDossier")) {
    const countyMatch = question.match(/([A-Za-z\s]+)\s+County/i);
    const c = county ?? (countyMatch ? countyMatch[1].trim() : null);
    if (c) picks.push({ name: "getCountyDossier", args: { county: c } });
  }
  if (/city|town/.test(q) && city) picks.push({ name: "getCityDossier", args: { city, county } });
  if (/staged|pending approval/.test(q) && mode === "admin") picks.push({ name: "searchStagedCandidates", args: { query: question } });

  if (picks.length === 0) {
    picks.push({ name: "searchEvents", args: { query: question, county, city } });
    if (mode === "admin") picks.push({ name: "recommendHarvestTargets", args: {} });
  }

  const allowed = allowedTools(mode);
  return picks.filter((p) => allowed.has(p.name)).slice(0, 5);
}

function executeTool(name, args) {
  const fn = TOOLS[name];
  if (!fn) return { error: `Unknown tool: ${name}` };
  try {
    return { name, ...fn(args ?? {}) };
  } catch (err) {
    return { name, error: err.message };
  }
}

function synthesizeDeterministicAnswer(question, mode, toolCalls) {
  const parts = [];
  const allSources = new Set();
  const missing = new Set();
  let confidence = "medium";
  const actions = [];
  let needsHumanReview = false;

  for (const call of toolCalls) {
    if (call.error) continue;
    for (const s of call.sources ?? []) allSources.add(s);
    for (const m of call.missing ?? []) missing.add(m);
    if (call.confidence === "low") confidence = "low";
    if (call.name === "findMissingCountyFairs" && call.data?.missingDatesCount > 0) {
      needsHumanReview = true;
      actions.push({ type: "verify_county_fair_dates", count: call.data.missingDatesCount });
    }
    if (call.name === "recommendHarvestTargets" && call.data?.targets?.length) {
      actions.push({ type: "harvest_pass", counties: call.data.targets.slice(0, 5).map((t) => t.county) });
    }
    if (call.name === "generateResearchTasks") needsHumanReview = true;
  }

  parts.push(`**Based on** Arkansas Everywhere bundled indexes and source registries (not live web scraping).`);

  for (const call of toolCalls) {
    if (call.error || !call.data) continue;
    if (call.name === "getCountyDossier") {
      const d = call.data;
      parts.push(
        `${d.county} County: ${d.eventCount} indexed events${d.thin ? " — **thin coverage**" : ""}.` +
          (d.feedCoverage ? ` Feed attachment: ${d.feedCoverage.coveragePercent}% (${d.feedCoverage.feedsAttached}/${d.feedCoverage.feedSlotsExpected}).` : ""),
      );
    } else if (call.name === "findMissingCountyFairs") {
      parts.push(
        `County fairs: ${call.data.verifiedCount}/${call.data.totalCounties} counties have verified 2026 dates; ${call.data.missingDatesCount} still need confirmation.`,
      );
    } else if (call.name === "recommendHarvestTargets") {
      const list = (call.data.targets ?? []).slice(0, 5).map((t) => `${t.county} (${t.reason})`).join("; ");
      if (list) parts.push(`Recommended harvest focus: ${list}.`);
    } else if (call.name === "searchEvents") {
      if (call.data.count) parts.push(`Found ${call.data.count} matching events in the index.`);
      else parts.push("No matching public events in the current index.");
    } else if (call.name === "searchFeeds") {
      const thin = (call.data.counties ?? []).filter((c) => c.thin).slice(0, 5).map((c) => c.county).join(", ");
      if (thin) parts.push(`Thin feed counties include: ${thin}.`);
    } else if (call.name === "findMissingSources") {
      parts.push(`${call.data.totalMissing} events lack source URLs and need confirmation.`);
    } else if (call.name === "generateResearchTasks") {
      parts.push(`${call.data.openCount} open research tasks await human review.`);
    } else if (call.name === "summarizeCalendarRange" && call.data.count) {
      parts.push(`Calendar window: ${call.data.count} events indexed.`);
    }
  }

  if (mode === "public") {
    parts.push("Showing public-safe discovery only — no campaign intelligence.");
  } else {
    parts.push("AI advises and prepares; humans approve publishing, verification, and campaign actions.");
  }

  if (missing.size) parts.push(`**What's missing:** ${[...missing].join(" ")}`);
  if (allSources.size) parts.push(`**Sources:** ${[...allSources].slice(0, 8).join(" · ")}`);

  return {
    answer: parts.join("\n\n"),
    citedSources: [...allSources].slice(0, 15).map((url) => ({ url, label: url })),
    recommendedActions: actions,
    confidence,
    toolCallsUsed: toolCalls.map((c) => c.name),
    needsHumanReview,
    dataFreshness: toolCalls.find((c) => c.freshness)?.freshness ?? null,
  };
}

async function synthesizeOpenAiAnswer(question, mode, toolCalls) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return synthesizeDeterministicAnswer(question, mode, toolCalls);

  const model = process.env.OPENAI_EVENT_INTELLIGENCE_MODEL || "gpt-4o-mini";
  const system = `You are the Arkansas Everywhere AI Brain. Answer ONLY from provided tool results. Never invent events, dates, or URLs.
Include: Based on..., source URLs when present, confidence, and what's missing.
Mode: ${mode}. Public mode: no campaign strategy. Admin/campaign: note items needing human approval.
Return JSON: { answer (markdown string), confidence (high|medium|low), needsHumanReview (boolean) }`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify({ question, mode, toolResults: toolCalls }) },
        ],
        temperature: 0.3,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    const det = synthesizeDeterministicAnswer(question, mode, toolCalls);
    return {
      ...det,
      answer: parsed.answer ?? det.answer,
      confidence: parsed.confidence ?? det.confidence,
      needsHumanReview: parsed.needsHumanReview ?? det.needsHumanReview,
      source: "openai",
    };
  } catch (_) {
    return { ...synthesizeDeterministicAnswer(question, mode, toolCalls), source: "deterministic_fallback" };
  }
}

async function runAiBrain({ question, mode = "admin", campaignSlug, county, city }) {
  const routes = routeTools(question, mode, { county, city, campaignSlug });
  const toolCalls = routes.map((r) => executeTool(r.name, r.args));
  const result = await synthesizeOpenAiAnswer(question, mode, toolCalls);
  return {
    question,
    mode,
    ...result,
  };
}

module.exports = {
  TOOLS,
  allowedTools,
  routeTools,
  executeTool,
  runAiBrain,
  synthesizeDeterministicAnswer,
};
