/**
 * Pass 25 — Approve entire recurring party meeting series (local JSON when no DB).
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..", "..");
const STAGED = path.join(ROOT, "data/ingestion/political-party-meetings-staged.json");
const APPROVED = path.join(ROOT, "data/ingestion/political-party-meetings-approved-events.json");

const TRUSTED_SOURCE_TYPES = new Set([
  "political_party_public_page",
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
    const time = c.start_time && /^\d{2}:\d{2}$/.test(c.start_time) ? c.start_time : "18:00";
    const d = new Date(`${c.event_date}T${time}:00`);
    if (!Number.isNaN(d.getTime())) startAt = d.toISOString();
  }
  return {
    id: `party-${c.id}`,
    slug: slugify(`${c.title}-${c.event_date || c.county}-${c.party_label}`),
    title: c.title,
    description: c.description,
    startAt,
    city: c.city,
    county: c.county || "Unknown",
    address: c.address,
    locationName: c.venue_name,
    category: "public_party_meeting",
    hostOrganization: c.source_name,
    status: "approved",
    source: c.source_url || "party_harvest",
    websiteUrl: c.source_url,
    highCivicValue: false,
    candidateRelevant: false,
    isRecurring: Boolean(c.is_recurring_series),
    intelligenceLayer: c.intelligence_layer || "government",
    relationshipDensityScore: c.relationship_density_score ?? 55,
    recurringRegistryId: c.recurring_registry_id || c.series_key,
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

function approveRecurringSeries(seriesKey, options = {}) {
  const { minConfidence = 50, requireTrustedSource = true } = options;
  const staged = loadJson(STAGED, { candidates: [] });
  const approved = loadJson(APPROVED, { events: [] });
  const approvedSlugs = new Set(approved.events.map((e) => e.slug));

  const series = staged.candidates.filter(
    (c) =>
      (c.series_key === seriesKey || c.recurring_registry_id === seriesKey) &&
      c.review_status !== "approved" &&
      c.review_status !== "rejected",
  );

  if (!series.length) {
    return { ok: false, error: "No staged candidates for series", seriesKey, approved: 0 };
  }

  const sample = series[0];
  if (requireTrustedSource && !TRUSTED_SOURCE_TYPES.has(sample.source_type)) {
    return { ok: false, error: "Source type not trusted for series approval", seriesKey };
  }
  if ((sample.confidence_score ?? 0) < minConfidence && !sample.is_recurring_series) {
    return { ok: false, error: "Confidence below threshold", seriesKey };
  }

  let added = 0;
  for (const c of series) {
    c.review_status = "approved";
    if (!c.event_date) continue;
    const ev = candidateToEvent(c);
    if (!approvedSlugs.has(ev.slug)) {
      approved.events.push(ev);
      approvedSlugs.add(ev.slug);
      added++;
    }
  }

  approved.generatedAt = new Date().toISOString();
  staged.generatedAt = new Date().toISOString();
  saveJson(STAGED, staged);
  saveJson(APPROVED, approved);

  return { ok: true, seriesKey, occurrences: series.length, eventsPublished: added };
}

module.exports = { approveRecurringSeries, candidateToEvent, STAGED, APPROVED };
