/**
 * Pass 29 — Approve source-backed county fair calendar events only.
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..", "..", "..");
const STAGED = path.join(ROOT, "data/ingestion/county-fair-staged.json");
const APPROVED = path.join(ROOT, "data/ingestion/county-fair-approved-events.json");

const TRUSTED_SOURCE_TYPES = new Set([
  "county_fair_page",
  "official_festival_website",
  "fair_guide_page",
  "tourism_cvb_page",
]);

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function candidateToEvent(c) {
  let startAt = new Date().toISOString();
  if (c.event_date) {
    const d = new Date(`${c.event_date}T15:00:00-05:00`);
    if (!Number.isNaN(d.getTime())) startAt = d.toISOString();
  }
  let endAt = null;
  if (c.end_date && c.end_date !== c.event_date) {
    const d = new Date(`${c.end_date}T23:00:00-05:00`);
    if (!Number.isNaN(d.getTime())) endAt = d.toISOString();
  }

  return {
    id: `county-fair-${c.id}`,
    slug: slugify(`${c.title}-${c.event_date}-${c.county}-fair`),
    title: c.title,
    description:
      c.description ||
      `Source-backed ${c.county} County fair${c.city ? ` in ${c.city}` : ""}. Confirm schedule and admission at official source.`,
    startAt,
    endAt,
    allDay: true,
    timezone: "America/Chicago",
    city: c.city,
    county: c.county || "Unknown",
    address: c.address ?? null,
    locationName: c.venue_name ?? null,
    category: "community",
    hostOrganization: c.source_name,
    status: "approved",
    source: c.source_url,
    websiteUrl: c.official_url || c.source_url,
    highCivicValue: true,
    candidateRelevant: false,
    isRecurring: true,
    intelligenceLayer: "community_identity",
    relationshipDensityScore: c.relationship_density_score ?? 72,
    isFamilyFriendly: true,
    harvestBatch: c.harvest_batch,
    festivalCategory: "county_fair",
  };
}

function loadJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function saveJson(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function isValidForApproval(c) {
  if (!c.title || !c.event_date || !c.county || !c.source_url) return false;
  if (!(c.city || c.venue_name || c.address)) return false;
  if (!TRUSTED_SOURCE_TYPES.has(c.source_type)) return false;
  if (c.verification_status !== "verified_dated") return false;
  if ((c.confidence_score ?? 0) < 60) return false;
  return true;
}

function approveCountyFairEvents(options = {}) {
  const { minConfidence = 60 } = options;
  const staged = loadJson(STAGED, { candidates: [], dated_events: [] });
  const approved = loadJson(APPROVED, { events: [] });
  const approvedSlugs = new Set(approved.events.map((e) => e.slug));

  const poolSource = [...(staged.dated_events ?? []), ...(staged.candidates ?? [])];
  const pool = poolSource.filter(
    (c) =>
      c.review_status !== "approved" &&
      c.review_status !== "rejected" &&
      c.event_date &&
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
  approved.pass = "29";
  saveJson(STAGED, staged);
  saveJson(APPROVED, approved);
  return { ok: true, approved: added, totalApproved: approved.events.length };
}

module.exports = { approveCountyFairEvents, APPROVED, STAGED };
