#!/usr/bin/env node
/**
 * Pass 32 publish lane — discover → tourism harvest → city festivals → narratives → indexes → sitemap.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(label, script) {
  console.log(`\n=== ${label} ===`);
  const res = spawnSync(npm, ["run", script], { cwd: ROOT, stdio: "inherit", shell: true });
  if (res.status !== 0) {
    console.error(`[festival:pass32-publish] FAILED at ${label}`);
    process.exit(res.status ?? 1);
  }
}

run("Discover festival density (research queue)", "festival:discover-density");
run("Harvest Arkansas.com tourism events", "harvest:arkansas-tourism");
run("Harvest fairs & festivals registry", "harvest:fairs-festivals");
run("Approve fair/festival staged events", "approve:fairs-festivals");
run("Merge top-250 city festival lane", "harvest:city-festivals");
run("Build festival narrative scaffolds", "narratives:pass32-festivals");
run("Audit city festivals", "audit:city-festivals");
run("Rebuild AI indexes", "ai:build-indexes");
run("Generate research tasks", "ai:research-tasks");
run("Generate sitemap", "generate:sitemap");

console.log("\n[festival:pass32-publish] complete");
