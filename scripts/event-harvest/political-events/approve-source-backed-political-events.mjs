#!/usr/bin/env node
/**
 * Pass 30 — Approve source-backed historic political events with verified 2026 dates.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { approveHistoricPoliticalEvents } = require("./lib/political-event-approval.cjs");

async function main() {
  const args = process.argv.slice(2);
  const minArg = args.find((a) => a.startsWith("--min-confidence="));
  const minConfidence = minArg ? Number(minArg.split("=")[1]) : 60;

  const result = approveHistoricPoliticalEvents({ minConfidence });
  console.log(`[approve:political-events] +${result.approved} approved · total public:${result.totalApproved}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
