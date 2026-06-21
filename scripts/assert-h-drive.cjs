#!/usr/bin/env node
/**
 * Fail fast if this lane would write npm/tooling artifacts to C: on Windows dev.
 * Skipped on CI/Netlify — those environments are not H: drive machines.
 */
const path = require("node:path");

const isCi = Boolean(
  process.env.NETLIFY ||
    process.env.NETLIFY_BUILD_BASE ||
    process.env.CI ||
    process.env.CONTINUOUS_INTEGRATION,
);

if (isCi) {
  process.exit(0);
}

const workspaceRoot = path.resolve(__dirname, "..", "..");
const requiredPrefix = workspaceRoot.slice(0, 3).toLowerCase();

if (process.platform === "win32" && requiredPrefix !== "h:\\") {
  console.warn(
    "[civic-call] Warning: workspace is not on H: drive. Set SOSWebsite root to H:\\SOSWebsite.",
  );
}

if (process.env.npm_config_cache) {
  const cache = process.env.npm_config_cache.replace(/\\/g, "/");
  if (!cache.startsWith("H:/")) {
    console.error(`[civic-call] BLOCKED: npm cache must be on H: (got ${process.env.npm_config_cache}).`);
    console.error("[civic-call] Use: node scripts/run-with-h-drive-env.cjs npm install");
    process.exit(1);
  }
}

if (process.env.TEMP && process.platform === "win32") {
  const temp = process.env.TEMP.replace(/\\/g, "/");
  if (!temp.startsWith("H:/")) {
    console.warn(
      `[civic-call] Warning: TEMP=${process.env.TEMP} — use npm scripts (run-with-h-drive-env.cjs).`,
    );
  }
}
