/**
 * Pass 27 — Approve school calendar events with verified dates (local JSON when no DB).
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..", "..");
const STAGED = path.join(ROOT, "data/ingestion/school-events-staged.json");
const APPROVED = path.join(ROOT, "data/ingestion/school-events-approved-events.json");

const TRUSTED_SOURCE_TYPES = new Set(["school_district_public_page"]);

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
    const d = new Date(`${c.event_date}T18:00:00`);
    if (!Number.isNaN(d.getTime())) startAt = d.toISOString();
  }
  return {
    id: `school-${c.id}`,
    slug: slugify(`${c.title}-${c.event_date || c.city}-${c.institution_id}`),
    title: c.title,
    description: c.description,
    startAt,
    city: c.city,
    county: c.county || "Unknown",
    address: c.address ?? null,
    locationName: c.venue_name ?? c.source_name,
    category: c.category || "school",
    hostOrganization: c.source_name,
    status: "approved",
    source: c.source_url || "school_harvest",
    websiteUrl: c.source_url,
    highCivicValue: false,
    candidateRelevant: false,
    isRecurring: Boolean(c.is_recurring_annual),
    intelligenceLayer: c.intelligence_layer || "community",
    relationshipDensityScore: c.relationship_density_score ?? 45,
    eventLane: c.event_lane,
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

function approveSchoolEvents(options = {}) {
  const { minConfidence = 50, requireDate = true, institutionId = null } = options;
  const staged = loadJson(STAGED, { candidates: [] });
  const approved = loadJson(APPROVED, { events: [] });
  const approvedSlugs = new Set(approved.events.map((e) => e.slug));

  let pool = staged.candidates.filter(
    (c) => c.review_status !== "approved" && c.review_status !== "rejected" && TRUSTED_SOURCE_TYPES.has(c.source_type),
  );
  if (institutionId) pool = pool.filter((c) => c.institution_id === institutionId);
  if (requireDate) pool = pool.filter((c) => c.event_date);
  pool = pool.filter((c) => (c.confidence_score ?? 0) >= minConfidence);

  let added = 0;
  for (const c of pool) {
    c.review_status = "approved";
    const ev = candidateToEvent(c);
    if (!approvedSlugs.has(ev.slug)) {
      approved.events.push(ev);
      approvedSlugs.add(ev.slug);
      added++;
    }
  }

  approved.generatedAt = new Date().toISOString();
  saveJson(STAGED, staged);
  saveJson(APPROVED, approved);
  return { ok: true, approved: added, totalApproved: approved.events.length };
}

function approveAllParsed(options = {}) {
  return approveSchoolEvents({ ...options, minConfidence: options.minConfidence ?? 50, requireDate: true });
}

module.exports = { approveSchoolEvents, approveAllParsed, APPROVED, STAGED };
