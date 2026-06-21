#!/usr/bin/env node
/**
 * Pass 23C — discover and verify calendar feed URLs for missing slots + institutions.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { candidatesForSlot, candidatesForInstitution, loadInstitutions, annualYield, slug } from "./lib/feed-url-patterns.mjs";
import { verifyBatch, firstVerified } from "./lib/url-verifier.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_FILE = path.join(ROOT, "data/feeds/feed-discovery-results.json");
const PATTERNS = JSON.parse(fs.readFileSync(path.join(ROOT, "data/feeds/feed-discovery-patterns.json"), "utf8"));

const VERIFY_LIMIT = Number(process.env.FEED_DISCOVER_VERIFY_LIMIT || 800);
const SLOT_PRIORITY = Number(process.env.FEED_DISCOVER_SLOT_LIMIT || 600);
const INST_PRIORITY = Number(process.env.FEED_DISCOVER_INST_LIMIT || 400);

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function isAttached(f) {
  return f.attachment_status === "attached" && f.calendar_url;
}

async function main() {
  const countyFeeds = readJson("data/feeds/county-feed-registry.json").feeds ?? [];
  const cityFeeds = readJson("data/feeds/city-feed-registry.json").feeds ?? [];
  const allSlots = [...countyFeeds, ...cityFeeds];

  const missingSlots = allSlots.filter((f) => !isAttached(f));
  const tier1Missing = missingSlots.filter((f) => f.tier === 1);
  const slotQueue = [...tier1Missing, ...missingSlots.filter((f) => f.tier !== 1)].slice(0, SLOT_PRIORITY);

  const institutions = loadInstitutions().slice(0, INST_PRIORITY);

  // Always queue known Arkansas colleges from seed map
  for (const [name, url] of Object.entries(PATTERNS.knownCollegeUrls ?? {})) {
    institutions.push({
      id: `college-known-${slug(name)}`,
      institution_kind: "college",
      institution_name: name,
      label: name,
      county: null,
      city: null,
      website: url,
    });
  }

  const candidateMap = new Map();
  const slotCandidates = [];
  for (const feed of slotQueue) {
    const cands = candidatesForSlot(feed, PATTERNS).slice(0, 6);
    slotCandidates.push({ feed_id: feed.id, feed, candidates: cands });
    for (const u of cands) candidateMap.set(u, true);
  }

  const instCandidates = [];
  for (const inst of institutions) {
    const cands = candidatesForInstitution(inst, PATTERNS).slice(0, 4);
    if (!cands.length) continue;
    instCandidates.push({
      institution_id: inst.id,
      institution_kind: inst.institution_kind,
      county: inst.county,
      city: inst.city,
      label: inst.label,
      candidates: cands,
    });
    for (const u of cands) candidateMap.set(u, true);
  }

  const allUrls = [...candidateMap.keys()].slice(0, VERIFY_LIMIT);
  console.log(`[feeds:discover] Verifying ${allUrls.length} candidate URLs (${slotQueue.length} slots · ${instCandidates.length} institutions)…`);

  const verifyMap = await verifyBatch(allUrls, { concurrency: 8 });

  const slotDiscoveries = [];
  for (const row of slotCandidates) {
    const hit = firstVerified(row.candidates, verifyMap);
    if (!hit) continue;
    slotDiscoveries.push({
      feed_id: row.feed_id,
      scope: row.feed.scope,
      county: row.feed.county,
      city: row.feed.city,
      slot_type: row.feed.slot_type,
      source_type: row.feed.source_type,
      calendar_url: hit.url,
      verification_status: hit.verification.ok ? "verified" : "failed",
      http_status: hit.verification.status,
      expected_annual_yield: annualYield(row.feed.source_type, PATTERNS),
      discovered_by: "feeds:discover",
      discovered_at: new Date().toISOString(),
    });
  }

  const institutionDiscoveries = [];
  for (const row of instCandidates) {
    const hit = firstVerified(row.candidates, verifyMap);
    if (!hit) continue;
    const sourceType =
      row.institution_kind === "school"
        ? "school_district"
        : row.institution_kind === "church"
          ? "church"
          : row.institution_kind === "college"
            ? "college"
            : row.institution_kind;
    institutionDiscoveries.push({
      institution_id: row.institution_id,
      institution_kind: row.institution_kind,
      county: row.county,
      city: row.city,
      label: row.label,
      calendar_url: hit.url,
      verification_status: "verified",
      http_status: hit.verification.status,
      expected_annual_yield: annualYield(sourceType, PATTERNS),
      discovered_by: "feeds:discover",
      discovered_at: new Date().toISOString(),
    });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    verifyLimit: VERIFY_LIMIT,
    slotsQueued: slotQueue.length,
    institutionsQueued: instCandidates.length,
    urlsVerified: allUrls.length,
    slotDiscoveries: slotDiscoveries.length,
    institutionDiscoveries: institutionDiscoveries.length,
    newAttachments: slotDiscoveries.length + institutionDiscoveries.length,
    statewideGoal: PATTERNS.statewideGoalAttachedFeeds ?? 1500,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({ summary, slotDiscoveries, institutionDiscoveries }, null, 2),
  );

  console.log(`[feeds:discover] ${slotDiscoveries.length} slot URLs · ${institutionDiscoveries.length} institution URLs verified`);
  console.log(`[feeds:discover] → ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
