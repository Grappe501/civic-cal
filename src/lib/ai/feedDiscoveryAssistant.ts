import type { CountyFeedCoverage, FeedAttachmentReport } from "../feeds/types";

export interface FeedDiscoveryGapResult {
  county: string;
  institutions: number;
  feedsAttached: number;
  feedsMissing: number;
  coveragePercent: number;
  potentialProjectedYield: number;
  recommendedSearches: string[];
  highestProbabilityFeeds: string[];
  expectedAnnualYield: number;
  notes: string[];
}

const YIELD_BY_LABEL: Record<string, number> = {
  library: 24,
  "school district": 70,
  school: 70,
  extension: 18,
  church: 12,
  vfd: 6,
  chamber: 15,
  parks: 20,
  tourism: 8,
  college: 40,
  university: 40,
};

export function buildCountyFeedDiscoveryPlan(county: string, report: FeedAttachmentReport): FeedDiscoveryGapResult {
  const row: CountyFeedCoverage | null =
    report.counties.find((c: CountyFeedCoverage) => c.county.toLowerCase() === county.replace(/\s+County$/i, "").trim().toLowerCase()) ?? null;

  const institutions = row?.institutions ?? 0;
  const feedsAttached = row?.feedsAttached ?? 0;
  const feedsMissing = row?.feedsMissing ?? 0;
  const coveragePercent = row?.coveragePercent ?? 0;
  const potentialProjectedYield = row?.potentialProjectedYield ?? 0;

  const highestProbabilityFeeds = [
    `${county} County public library calendar`,
    `${county} County school district calendar`,
    `${county} County Cooperative Extension events`,
    `${county} County parks and recreation calendar`,
    `Major ${county} County church community calendar`,
  ];

  const recommendedSearches = [
    `site:.k12.ar.us ${county} County Arkansas calendar`,
    `site:.org ${county} County Arkansas library events`,
    `${county} County Arkansas chamber events calendar`,
    `${county} County Arkansas cooperative extension 4-H`,
    `${county} County Arkansas parks recreation events`,
  ];

  const expectedAnnualYield = highestProbabilityFeeds.reduce((n, label) => {
    const key = Object.keys(YIELD_BY_LABEL).find((k) => label.toLowerCase().includes(k));
    return n + (key ? YIELD_BY_LABEL[key] : 8);
  }, 0);

  return {
    county,
    institutions,
    feedsAttached,
    feedsMissing,
    coveragePercent,
    potentialProjectedYield,
    recommendedSearches,
    highestProbabilityFeeds,
    expectedAnnualYield,
    notes: [
      "Advisory only — verify URLs before attaching feeds.",
      "Prioritize school district and library calendars for highest recurring yield.",
      "Do not invent events; attach public calendar URLs only.",
    ],
  };
}

export function formatFeedAttachmentScore(c: CountyFeedCoverage): string {
  return `${c.county} County — Institutions: ${c.institutions} · Feeds attached: ${c.feedsAttached} · Missing: ${c.feedsMissing} · Coverage: ${c.coveragePercent}% · Potential yield: ${c.potentialProjectedYield.toLocaleString()}`;
}
