import { searchWeb, hasSearchProvider } from "./lib/search-provider.mjs";
import { ensureDirs, writeJson, RAW_DIR, nowIso } from "./lib/paths.mjs";

const query = process.argv.slice(2).join(" ").trim();
if (!query) {
  console.error("Usage: node search-events.mjs \"query string\"");
  process.exit(1);
}

ensureDirs();

async function main() {
  const stamp = nowIso().replace(/[:.]/g, "-");
  const outFile = `${RAW_DIR}/search-${stamp}.json`;

  if (!hasSearchProvider()) {
    const payload = {
      mode: "query_plan_only",
      message: "No BING_SEARCH_API_KEY or GOOGLE_CUSTOM_SEARCH_* — saving planned query only.",
      query,
      generatedAt: nowIso(),
      results: [],
    };
    writeJson(outFile, payload);
    console.log(`[search-events] query plan saved → ${outFile}`);
    return;
  }

  const results = await searchWeb(query);
  writeJson(outFile, { query, generatedAt: nowIso(), results });
  console.log(`[search-events] ${results.length} results → ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
