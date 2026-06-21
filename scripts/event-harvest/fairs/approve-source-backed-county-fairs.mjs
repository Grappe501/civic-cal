#!/usr/bin/env node
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { approveCountyFairEvents } = require("./lib/county-fair-approval.cjs");

async function main() {
  const minArg = process.argv.find((a) => a.startsWith("--min-confidence="));
  const minConfidence = minArg ? Number(minArg.split("=")[1]) : 60;
  const result = approveCountyFairEvents({ minConfidence });
  console.log(`[approve:county-fairs] +${result.approved} approved · total public:${result.totalApproved}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
