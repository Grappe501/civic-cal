#!/usr/bin/env node
/** Pass 24 — mark stale profiles for refresh queue (advisory). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appendRun, updateHealth, ROOT } from "./lib/autogrow-io.mjs";

const OUT = path.join(ROOT, "data/autogrow/profile-refresh-queue.json");

function main() {
  const registryPath = path.join(ROOT, "data/profiles/community-profile-registry.json");
  let profiles = [];
  try {
    profiles = JSON.parse(fs.readFileSync(registryPath, "utf8")).profiles ?? [];
  } catch {
    console.warn("[autogrow:profiles] No profile registry — skipping");
  }

  const stale = profiles.filter((p) => p.freshness?.refreshNeeded || p.freshness?.stale);
  const queue = stale.slice(0, 100).map((p) => ({
    slug: p.slug,
    entityType: p.entityType,
    title: p.title,
    county: p.county,
    reason: p.freshness?.stale ? "stale" : "refresh_needed",
    queuedAt: new Date().toISOString(),
  }));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), count: queue.length, queue }, null, 2));

  const summary = { staleProfiles: queue.length, totalProfiles: profiles.length };
  appendRun("weekly_profile_refresh", summary);
  updateHealth({ lastProfileRefresh: new Date().toISOString(), staleProfiles: queue.length, status: "idle" });
  console.log(`[autogrow:profiles] ${queue.length} profiles queued for refresh`);
}

main();
