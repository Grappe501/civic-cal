#!/usr/bin/env node
/**
 * Run a command with TEMP/TMP and npm cache pinned to H:\SOSWebsite\.local\
 * civic-call: ALL local artifacts must stay on H: — nothing on C:
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const laneRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(laneRoot, "..");
const localRoot = path.join(workspaceRoot, ".local");
const tempDir = path.join(localRoot, "temp", "civic-call");
const npmCache = path.join(localRoot, "npm-cache");
const viteCache = path.join(localRoot, "vite-cache", "civic-call");

for (const dir of [localRoot, tempDir, npmCache, viteCache]) {
  fs.mkdirSync(dir, { recursive: true });
}

const isCiBuild = Boolean(
  process.env.NETLIFY ||
    process.env.NETLIFY_BUILD_BASE ||
    process.env.CI ||
    process.env.CONTINUOUS_INTEGRATION,
);

const env = {
  ...process.env,
  TEMP: isCiBuild ? process.env.TEMP : tempDir,
  TMP: isCiBuild ? process.env.TMP : tempDir,
  VITE_CACHE_DIR: viteCache,
  CIVIC_CALL_H_DRIVE_ONLY: "1",
};

if (!isCiBuild && process.platform === "win32") {
  env.npm_config_cache = npmCache;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/run-with-h-drive-env.cjs <command> [args...]");
  process.exit(1);
}

const [command, ...rest] = args;
const result = spawnSync(command, rest, {
  cwd: laneRoot,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
