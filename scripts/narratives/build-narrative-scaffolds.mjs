#!/usr/bin/env node
/**
 * Pass 31 — Generate narrative scaffolds for entities missing community narratives.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "data/narratives/community-narratives.json");
const RESEARCH_OUT = path.join(ROOT, "data/narratives/narrative-research-queue.json");
const TRADITIONS = path.join(ROOT, "data/ingestion/recurring-events-registry.json");
const FAIRS = path.join(ROOT, "data/fairs/arkansas-county-fair-registry.json");
const FAIR_INSTITUTIONS = path.join(ROOT, "data/fairs/county-fair-institution-profiles.json");
const COUNTIES = path.join(ROOT, "data/arkansas-counties.json");

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function collectEntities() {
  const entities = [];

  const traditions = JSON.parse(fs.readFileSync(TRADITIONS, "utf8")).traditions ?? [];
  for (const t of traditions) {
    entities.push({
      entityType: "festival",
      slug: String(t.id).replace(/^rec-/, ""),
      title: t.event_name,
      city: t.city,
      county: t.county,
      summary: t.notes,
      sources: t.source_url ? [{ label: t.source_name ?? "Source", url: t.source_url }] : [],
    });
  }

  const institutions = fs.existsSync(FAIR_INSTITUTIONS)
    ? JSON.parse(fs.readFileSync(FAIR_INSTITUTIONS, "utf8")).profiles ?? []
    : [];
  const instById = new Map(institutions.map((p) => [p.tradition?.id?.replace(/-tradition$/, "") ?? p.id?.replace(/-institution$/, ""), p]));

  const fairs = JSON.parse(fs.readFileSync(FAIRS, "utf8")).fairs ?? [];
  for (const f of fairs) {
    if (f.is_regional_fair || f.is_state_fair) continue;
    const slug = String(f.id || `${slugify(f.county)}-county-fair`);
    const inst = instById.get(slug);
    const instData = inst?.institution;
    entities.push({
      entityType: "festival",
      slug,
      title: String(f.fair_name ?? `${f.county} County Fair`),
      city: f.city,
      county: f.county,
      summary: instData?.history_public ?? `${f.fair_name} — county fair institution in ${f.county} County, Arkansas.`,
      sources: [f.official_url, f.source_url, instData?.extension_office_url].filter(Boolean).map((url) => ({
        label: "Official",
        url: String(url),
      })),
      pass33Institution: Boolean(inst),
    });
  }

  const counties = JSON.parse(fs.readFileSync(COUNTIES, "utf8")).counties ?? [];
  for (const c of counties) {
    entities.push({
      entityType: "county",
      slug: `${slugify(c)}-county`,
      title: `${c} County, Arkansas`,
      county: c,
      summary: `County-wide community calendar for ${c} County.`,
      sources: [],
    });
  }

  return entities;
}

function main() {
  const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { narratives: [] };
  const have = new Set((existing.narratives ?? []).map((n) => `${n.entityType}:${n.slug}`));
  const entities = collectEntities();
  const added = [];
  const queue = [];

  for (const p of entities) {
    const k = `${p.entityType}:${p.slug}`;
    if (have.has(k)) continue;

    const narrative = {
      id: `narr-scaffold-${p.slug}`.slice(0, 80),
      entityType: p.entityType,
      slug: p.slug,
      title: p.title,
      city: p.city ?? null,
      county: p.county ?? null,
      about: p.summary ?? null,
      history: null,
      originStory: null,
      timeline: [],
      interestingFacts: [],
      faqs: [
        {
          question: `What is ${p.title}?`,
          answer: `Community profile on Arkansas Everywhere — expand with sourced history and official links.`,
        },
      ],
      relatedEntitySlugs: p.county
        ? [{ entityType: "county", slug: `${slugify(p.county)}-county`, label: `${p.county} County` }]
        : [],
      sources: p.sources ?? [],
      lastRefreshedAt: new Date().toISOString().slice(0, 10),
      verificationStatus: "placeholder",
      researchNotes: "Auto-scaffold — requires sourced research before verification.",
    };

    existing.narratives.push(narrative);
    have.add(k);
    added.push(k);
    queue.push({
      entityType: p.entityType,
      slug: p.slug,
      title: p.title,
      county: p.county,
      priority: p.entityType === "festival" ? "high" : "medium",
      queuedAt: new Date().toISOString(),
    });
  }

  existing.generatedAt = new Date().toISOString();
  existing.pass = "31-community-narrative-engine";
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(existing, null, 2));
  fs.writeFileSync(
    RESEARCH_OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), count: queue.length, queue: queue.slice(0, 500) }, null, 2),
  );

  console.log(`[narratives:build-scaffolds] +${added.length} scaffolds (${existing.narratives.length} total narratives)`);
}

main();
