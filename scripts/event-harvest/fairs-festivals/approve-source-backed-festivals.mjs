#!/usr/bin/env node
/**
 * Pass 29 — Approve source-backed fair/festival events with verified dates.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { approveFairFestivalEvents } = require("./lib/festival-approval.cjs");

async function main() {
  const args = process.argv.slice(2);
  const minArg = args.find((a) => a.startsWith("--min-confidence="));
  const minConfidence = minArg ? Number(minArg.split("=")[1]) : 60;

  const result = approveFairFestivalEvents({ minConfidence });
  console.log(`[approve:fairs-festivals] +${result.approved} approved · total public:${result.totalApproved}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
