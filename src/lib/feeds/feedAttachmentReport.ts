import reportBundle from "../../../data/feeds/feed-attachment-report.json";
import type { CountyFeedCoverage, FeedAttachmentReport } from "./types";

export function loadFeedAttachmentReport(): FeedAttachmentReport {
  return reportBundle as FeedAttachmentReport;
}

export function getCountyFeedCoverage(county: string): CountyFeedCoverage | null {
  const name = county.replace(/\s+County$/i, "").trim();
  const report = loadFeedAttachmentReport();
  return report.counties.find((c) => c.county.toLowerCase() === name.toLowerCase()) ?? null;
}

export function formatCoverageSummary(c: CountyFeedCoverage): string {
  return `${c.feedsAttached}/${c.feedSlotsExpected} feeds attached (${c.coveragePercent}%) · ${c.institutions} institutions`;
}
