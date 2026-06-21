#!/usr/bin/env node
/**
 * Institution-first harvest targets → staged candidates (needs_review, no invented dates).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dedupeCandidates } from "../event-harvest/lib/dedupe-logic.mjs";
import { STAGED_FILE, ensureDirs, loadJson, nowIso } from "../event-harvest/lib/paths.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const CHURCH_PATTERNS = ["Fish Fry", "Spaghetti Dinner", "BBQ Fundraiser", "VBS", "Trunk or Treat"];
const SCHOOL_PATTERNS = ["School Board Meeting", "Homecoming", "Football Game", "Basketball Game", "Graduation"];

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function projectionCandidate({ title, county, city, institutionId, institutionType, sourceUrl, notes }) {
  return {
    title,
    description: notes,
    event_date: null,
    city,
    county,
    state: "AR",
    category: institutionType === "church" ? "community_church" : institutionType === "school" ? "school" : "community",
    intelligence_layer: institutionType === "church" ? "community_church" : "community",
    confidence_score: 25,
    source_name: "institution_projection_engine",
    source_url: sourceUrl ?? null,
    source_type: "institution_feed",
    discovered_by: "density:project",
    review_status: "needs_review",
    is_recurring_annual: true,
    institution_id: institutionId,
    projection_status: "scaffold",
    notes: `${notes} NOT auto-published — verify official calendar.`,
  };
}

function loadExisting() {
  if (!fs.existsSync(STAGED_FILE)) return [];
  return JSON.parse(fs.readFileSync(STAGED_FILE, "utf8")).candidates ?? [];
}

function main() {
  ensureDirs();
  const churches = loadJson("data/institutions/church-directory.json").churches ?? [];
  const schools = loadJson("data/institutions/school-directory.json").schools ?? [];
  const traditions = loadJson("data/ingestion/recurring-events-registry.json").traditions ?? [];

  const projected = [];

  for (const ch of churches) {
    const patterns = ch.annual_events?.length ? ch.annual_events : CHURCH_PATTERNS.slice(0, 2);
    for (const p of patterns) {
      projected.push(
        projectionCandidate({
          title: `${String(ch.church_name).replace(/\s*—\s*verify.*$/i, "")} — ${p}`,
          county: ch.county,
          city: ch.city,
          institutionId: ch.id,
          institutionType: "church",
          sourceUrl: ch.website ?? ch.source_links?.[0]?.url,
          notes: "Church institution harvest target.",
        }),
      );
    }
  }

  for (const sc of schools) {
    for (const p of SCHOOL_PATTERNS) {
      projected.push(
        projectionCandidate({
          title: `${String(sc.school_name).replace(/\s*—\s*verify.*$/i, "")} — ${p}`,
          county: sc.county,
          city: sc.city,
          institutionId: sc.id,
          institutionType: "school",
          sourceUrl: sc.website,
          notes: "School calendar harvest target.",
        }),
      );
    }
  }

  for (const t of traditions) {
    projected.push(
      projectionCandidate({
        title: t.event_name,
        county: t.county,
        city: t.city,
        institutionId: t.id,
        institutionType: "tradition",
        sourceUrl: t.source_url,
        notes: `Recurring tradition · typical month ${t.typical_month ?? "TBD"}. ${t.notes ?? ""}`.trim(),
      }),
    );
  }

  const existing = loadExisting();
  const merged = dedupeCandidates([...existing, ...projected]);

  fs.writeFileSync(
    STAGED_FILE,
    JSON.stringify(
      {
        generatedAt: nowIso(),
        source: "density:project",
        count: merged.length,
        newProjections: projected.length,
        candidates: merged,
      },
      null,
      2,
    ),
  );

  console.log(`[density:project] ${projected.length} institution projections merged → ${merged.length} staged total`);
}

main();
