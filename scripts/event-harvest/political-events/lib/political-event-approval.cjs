/**
 * Pass 30 — Approve source-backed historic political calendar events.
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..", "..", "..");
const STAGED = path.join(ROOT, "data/ingestion/historic-political-events-staged.json");
const APPROVED = path.join(ROOT, "data/ingestion/historic-political-events-approved-events.json");
const REGISTRY = path.join(ROOT, "data/political-events/historic-political-event-registry.json");

const TRUSTED_SOURCE_TYPES = new Set([
  "official_party_website",
  "county_party_website",
  "official_event_page",
]);

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function loadJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function saveJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function registryEntryFor(id) {
  const reg = loadJson(REGISTRY, { events: [] });
  return (reg.events ?? []).find((e) => e.id === id) ?? null;
}

function candidateToEvent(c) {
  const reg = c.political_event_id ? registryEntryFor(c.political_event_id) : null;
  let startAt = new Date().toISOString();
  if (c.event_date) {
    const d = new Date(`${c.event_date}T18:00:00-05:00`);
    if (!Number.isNaN(d.getTime())) startAt = d.toISOString();
  }
  let endAt = null;
  if (c.end_date && c.end_date !== c.event_date) {
    const d = new Date(`${c.end_date}T22:00:00-05:00`);
    if (!Number.isNaN(d.getTime())) endAt = d.toISOString();
  }

  const historyDossier = reg
    ? {
        firstYearHeld: reg.first_year_held ?? c.first_year_held ?? null,
        honors: reg.honors ?? c.honors ?? null,
        typicalAudience: reg.typical_audience ?? null,
        historicSignificance: reg.historic_significance ?? null,
        notableSpeakers: reg.notable_speakers ?? c.notable_speakers ?? [],
        recurringPattern: reg.recurring_pattern ?? c.recurring_pattern ?? null,
        hostOrganization: reg.host_organization ?? c.source_name,
        ticketUrl: reg.ticket_url ?? c.ticket_url ?? null,
        sourceLinks: [
          { label: "Official source", url: c.source_url, trust: "high" },
          ...(reg.official_url && reg.official_url !== c.source_url
            ? [{ label: "Host organization", url: reg.official_url, trust: "high" }]
            : []),
        ],
        lastRefreshed: new Date().toISOString(),
        confidenceScore: c.confidence_score ?? reg.confidence_score ?? 80,
        historyAvailable: Boolean(reg.history_available ?? c.history_available),
      }
    : null;

  return {
    id: `political-hist-${c.id}`,
    slug: slugify(`${c.title}-${c.event_date}-${c.city || c.county}-political`),
    title: c.title,
    description: c.description,
    startAt,
    endAt,
    allDay: false,
    timezone: "America/Chicago",
    city: c.city,
    county: c.county || "Unknown",
    address: c.address ?? null,
    locationName: c.venue_name ?? null,
    category: "candidate_event",
    hostOrganization: c.source_name,
    status: "approved",
    source: c.source_url,
    websiteUrl: c.official_url || c.source_url,
    highCivicValue: true,
    candidateRelevant: true,
    isRecurring: Boolean(c.is_recurring_annual),
    intelligenceLayer: "relationship",
    relationshipDensityScore: c.relationship_density_score ?? 92,
    typicalAttendanceBand: c.typical_attendance_band ?? "medium",
    harvestBatch: c.harvest_batch,
    festivalCategory: c.harvest_category || "historic_political",
    politicalEventRegistryId: c.political_event_id ?? null,
    historyDossier,
  };
}

function isValidForApproval(c) {
  if (!c.title || !c.event_date || !(c.city || c.county) || !c.source_url) return false;
  if (!TRUSTED_SOURCE_TYPES.has(c.source_type)) return false;
  if (c.verification_status !== "verified_dated") return false;
  if ((c.confidence_score ?? 0) < 60) return false;
  const year = Number(String(c.event_date).slice(0, 4));
  if (year !== 2026) return false;
  return true;
}

function approveHistoricPoliticalEvents(options = {}) {
  const { minConfidence = 60 } = options;
  const staged = loadJson(STAGED, { candidates: [], dated_events: [] });
  const approved = loadJson(APPROVED, { events: [] });
  const approvedSlugs = new Set(approved.events.map((e) => e.slug));

  const poolSource = [...(staged.dated_events ?? []), ...(staged.candidates ?? [])];
  const pool = poolSource.filter(
    (c) =>
      c.review_status !== "approved" &&
      c.review_status !== "rejected" &&
      (c.confidence_score ?? 0) >= minConfidence &&
      isValidForApproval(c),
  );

  let added = 0;
  for (const c of pool) {
    c.review_status = "approved";
    c.verification_status = "approved";
    const ev = candidateToEvent(c);
    if (!approvedSlugs.has(ev.slug)) {
      approved.events.push(ev);
      approvedSlugs.add(ev.slug);
      added++;
    }
  }

  approved.generatedAt = new Date().toISOString();
  approved.pass = "30";
  saveJson(STAGED, staged);
  saveJson(APPROVED, approved);
  return { ok: true, approved: added, totalApproved: approved.events.length };
}

module.exports = { approveHistoricPoliticalEvents, APPROVED, STAGED };
