#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function load(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function main() {
  const cities = load("data/community-dna/city-community-dna.json");
  const counties = load("data/community-dna/county-community-dna.json");
  const scores = load("data/community-dna/county-calendar-dna-scores.json");
  const guides = load("data/community-systems/discovery-guide-registry.json");

  const thin = scores.scores.filter((s) => s.total_score < 45);
  const strong = scores.scores.filter((s) => s.total_score >= 70);

  const report = {
    pass: 38,
    generatedAt: new Date().toISOString(),
    cityDnaCount: cities.count,
    countyDnaCount: counties.count,
    countyScores: scores.count,
    thinCounties: thin.length,
    strongCounties: strong.length,
    discoveryGuides: guides.guides?.length ?? 0,
    weakestCounties: thin.slice(0, 10).map((s) => ({ county: s.county, score: s.total_score })),
    strongestCounties: [...scores.scores].sort((a, b) => b.total_score - a.total_score).slice(0, 10).map((s) => ({
      county: s.county,
      score: s.total_score,
    })),
  };

  fs.writeFileSync(path.join(ROOT, "data/community-dna/community-dna-audit.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main();
