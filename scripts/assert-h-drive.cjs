#!/usr/bin/env node
/**
 * Fail fast if this lane would write npm/tooling artifacts to C:.
 * civic-call is H:-only — no exceptions on Windows dev machines.
 */
const path = require("node:path");

const workspaceRoot = path.resolve(__dirname, "..", "..");
const requiredPrefix = workspaceRoot.slice(0, 3).toLowerCase();

if (process.platform === "win32" && requiredPrefix !== "h:\\") {
  console.warn(
    "[civic-call] Warning: workspace is not on H: drive. Set SOSWebsite root to H:\\SOSWebsite.",
  );
}

const cacheFromNpmrc = "H:/SOSWebsite/.local/npm-cache";
if (process.env.npm_config_cache && !process.env.npm_config_cache.replace(/\\/g, "/").startsWith("H:/")) {
  console.error(
    `[civic-call] BLOCKED: npm cache must be on H: (got ${process.env.npm_config_cache}).`,
  );
  process.exit(1);
}

if (process.env.TEMP && process.platform === "win32") {
  const temp = process.env.TEMP.replace(/\\/g, "/");
  if (!temp.startsWith("H:/") && !process.env.CI) {
    console.warn(
      `[civic-call] Warning: TEMP=${process.env.TEMP} — use npm scripts (run-with-h-drive-env.cjs).`,
    );
  }
}

module.exports = { cacheFromNpmrc };
