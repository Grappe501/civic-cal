import type { FreshnessMeta, SourceConfidence } from "./freshnessTypes";

const MS_DAY = 86400000;

export function daysSince(isoDate: string): number {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return 9999;
  return Math.floor((Date.now() - d.getTime()) / MS_DAY);
}

/** Confidence decay from age when not explicitly set. */
export function confidenceFromAge(lastRefreshedAt: string, sourceCount: number): SourceConfidence {
  if (sourceCount === 0) return "placeholder";
  const age = daysSince(lastRefreshedAt);
  if (age <= 30) return "high";
  if (age <= 120) return "medium";
  return "low";
}

export function isStaleFreshness(f: FreshnessMeta): boolean {
  if (f.sourceConfidence === "placeholder" || f.verificationStatus === "placeholder") return true;
  if (f.sourceCount === 0) return true;
  return daysSince(f.lastRefreshedAt) > 120;
}

export function isLowConfidence(f: FreshnessMeta): boolean {
  return f.sourceConfidence === "low" || f.sourceConfidence === "placeholder";
}

export function missingSources(f: FreshnessMeta): boolean {
  return f.sourceCount === 0 || f.sourceLinks.length === 0;
}

export function staleLabel(f: FreshnessMeta): string {
  if (f.verificationStatus === "placeholder") return "Placeholder data";
  if (f.sourceCount === 0) return "No source links on file";
  const age = daysSince(f.lastRefreshedAt);
  if (age > 120) return `Stale (${age} days since refresh)`;
  if (age > 30) return `Aging (${age} days since refresh)`;
  return "Recently refreshed";
}
