#!/usr/bin/env node
/**
 * Pass 23C — apply discovery results to feed registries + institution feed registry.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DISCOVERY_FILE = path.join(ROOT, "data/feeds/feed-discovery-results.json");
const INST_REGISTRY = path.join(ROOT, "data/feeds/institution-feed-registry.json");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function writeJson(rel, data) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function applySlotDiscoveries(feeds, discoveries) {
  const byId = new Map(discoveries.map((d) => [d.feed_id, d]));
  let applied = 0;
  for (const feed of feeds) {
    const d = byId.get(feed.id);
    if (!d?.calendar_url) continue;
    feed.calendar_url = d.calendar_url;
    feed.contact_url = d.calendar_url;
    feed.attachment_status = "attached";
    feed.discovery_status = "verified";
    feed.verification_status = d.verification_status;
    feed.expected_annual_yield = d.expected_annual_yield;
    feed.discovered_at = d.discovered_at;
    feed.discovered_by = d.discovered_by;
    applied++;
  }
  return applied;
}

function main() {
  if (!fs.existsSync(DISCOVERY_FILE)) {
    console.error("[feeds:apply] No discovery results — run npm run feeds:discover first");
    process.exit(1);
  }

  const { summary, slotDiscoveries = [], institutionDiscoveries = [] } = JSON.parse(
    fs.readFileSync(DISCOVERY_FILE, "utf8"),
  );

  const countyBundle = readJson("data/feeds/county-feed-registry.json");
  const cityBundle = readJson("data/feeds/city-feed-registry.json");

  const countyApplied = applySlotDiscoveries(countyBundle.feeds, slotDiscoveries);
  const cityApplied = applySlotDiscoveries(cityBundle.feeds, slotDiscoveries);

  countyBundle.generatedAt = new Date().toISOString();
  cityBundle.generatedAt = new Date().toISOString();
  writeJson("data/feeds/county-feed-registry.json", countyBundle);
  writeJson("data/feeds/city-feed-registry.json", cityBundle);

  const institutionFeeds = institutionDiscoveries.map((d) => ({
    id: `inst-${d.institution_id}`,
    scope: "institution",
    institution_id: d.institution_id,
    institution_kind: d.institution_kind,
    county: d.county,
    city: d.city,
    label: d.label,
    calendar_url: d.calendar_url,
    attachment_status: "attached",
    discovery_status: "verified",
    verification_status: d.verification_status,
    expected_annual_yield: d.expected_annual_yield,
    source_type: d.institution_kind,
    discovered_at: d.discovered_at,
    discovered_by: d.discovered_by,
  }));

  writeJson("data/feeds/institution-feed-registry.json", {
    generatedAt: new Date().toISOString(),
    count: institutionFeeds.length,
    feeds: institutionFeeds,
  });

  console.log(`[feeds:apply] ${countyApplied + cityApplied} slot feeds updated · ${institutionFeeds.length} institution feeds`);
  console.log(`[feeds:apply] Discovery batch added ${summary?.newAttachments ?? institutionFeeds.length + countyApplied + cityApplied} attachments`);
}

main();
