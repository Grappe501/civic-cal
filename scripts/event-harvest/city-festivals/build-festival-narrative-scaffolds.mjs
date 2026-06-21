#!/usr/bin/env node
/**
 * Pass 32 — Narrative scaffolds for approved festivals + city identity profiles + research queue.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FESTIVAL_IDENTITY_SUFFIXES } from "./festival-identity-patterns.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const NARRATIVES = path.join(ROOT, "data/narratives/community-narratives.json");
const APPROVED = path.join(ROOT, "data/ingestion/top250-city-festival-approved-events.json");
const REGISTRY = path.join(ROOT, "data/event-harvest/fair-festival-source-registry.json");
const TOP200 = path.join(ROOT, "data/arkansas/top-200-priority-cities.json");
const RESEARCH = path.join(ROOT, "data/narratives/pass32-festival-narrative-research.json");

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function main() {
  const existing = fs.existsSync(NARRATIVES) ? JSON.parse(fs.readFileSync(NARRATIVES, "utf8")) : { narratives: [] };
  const have = new Set((existing.narratives ?? []).map((n) => `${n.entityType}:${n.slug}`));
  const approved = JSON.parse(fs.readFileSync(APPROVED, "utf8"));
  const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  const top200 = JSON.parse(fs.readFileSync(TOP200, "utf8"));
  const added = [];
  const queue = [];

  for (const ev of approved.events ?? []) {
    const slug = slugify(ev.slug || ev.title);
    const k = `festival:${slug}`;
    if (have.has(k)) continue;
    existing.narratives.push({
      id: `narr-pass32-${slug}`.slice(0, 80),
      entityType: "festival",
      slug,
      title: ev.title,
      city: ev.city,
      county: ev.county,
      about: ev.description ?? `${ev.title} — source-backed community festival in ${ev.city}, ${ev.county} County.`,
      history: null,
      originStory: null,
      timeline: [],
      interestingFacts: [],
      faqs: [
        { question: `When is ${ev.title}?`, answer: `See official Arkansas Everywhere calendar entry — confirm at source link.` },
        { question: `Where is ${ev.title} held?`, answer: ev.locationName || ev.address || `${ev.city}, Arkansas` },
      ],
      relatedEntitySlugs: ev.county
        ? [{ entityType: "county", slug: `${slugify(ev.county)}-county`, label: `${ev.county} County` }]
        : [],
      sources: ev.source ? [{ label: "Official source", url: ev.source }] : [],
      lastRefreshedAt: new Date().toISOString().slice(0, 10),
      verificationStatus: "partial",
      pass: "32",
    });
    have.add(k);
    added.push(k);
  }

  for (const src of registry.sources ?? []) {
    const slug = slugify(src.id || src.title);
    const k = `festival:${slug}`;
    if (have.has(k)) continue;
    existing.narratives.push({
      id: `narr-pass32-reg-${slug}`.slice(0, 80),
      entityType: "festival",
      slug,
      title: src.title,
      city: src.city,
      county: src.county,
      about: src.notes ?? `${src.title} — Arkansas community festival profile.`,
      history: null,
      faqs: [{ question: `What is ${src.title}?`, answer: "Community festival profile — confirm dates from official source." }],
      relatedEntitySlugs: src.county
        ? [{ entityType: "county", slug: `${slugify(src.county)}-county`, label: `${src.county} County` }]
        : [],
      sources: [src.official_url, src.source_url].filter(Boolean).map((url) => ({ label: "Official", url })),
      lastRefreshedAt: new Date().toISOString().slice(0, 10),
      verificationStatus: src.published_dates?.start ? "source_dated" : "placeholder",
      pass: "32",
    });
    have.add(k);
    added.push(k);
    if (!src.published_dates?.start) {
      queue.push({ slug, title: src.title, county: src.county, reason: "missing_verified_dates", pass: "32" });
    }
  }

  for (const cityRow of top200.cities ?? []) {
    const citySlug = slugify(cityRow.city);
    const festSlug = `${citySlug}-community-events`;
    const k = `festival:${festSlug}`;
    if (have.has(k)) continue;
    existing.narratives.push({
      id: `narr-pass32-city-${citySlug}`.slice(0, 80),
      entityType: "festival",
      slug: festSlug,
      title: `${cityRow.city} festivals & community events`,
      city: cityRow.city,
      county: cityRow.county,
      about: `Community festival and public-life calendar for ${cityRow.city}, ${cityRow.county} County, Arkansas.`,
      history: null,
      faqs: FESTIVAL_IDENTITY_SUFFIXES.slice(0, 6).map((suffix) => ({
        question: `Does ${cityRow.city} have a ${suffix}?`,
        answer: `Search Arkansas Everywhere calendar and official city/chamber sources — Pass 32 identity harvest lane.`,
      })),
      relatedEntitySlugs: [
        { entityType: "county", slug: `${slugify(cityRow.county)}-county`, label: `${cityRow.county} County` },
      ],
      sources: [],
      lastRefreshedAt: new Date().toISOString().slice(0, 10),
      verificationStatus: "placeholder",
      pass: "32",
    });
    have.add(k);
    added.push(k);
  }

  existing.generatedAt = new Date().toISOString();
  existing.pass = "32-festival-density";
  fs.writeFileSync(NARRATIVES, JSON.stringify(existing, null, 2));
  fs.writeFileSync(
    RESEARCH,
    JSON.stringify({ pass: "32", generatedAt: new Date().toISOString(), addedCount: added.length, queue }, null, 2),
  );
  console.log(`[narratives:pass32-festivals] added:${added.length} total:${existing.narratives.length}`);
}

main();
