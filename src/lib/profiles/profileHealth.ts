import { buildProfileRegistry } from "./profileRegistry";
import { isLowConfidence, isStaleFreshness, missingSources } from "../freshness/staleData";
import type { CommunityProfile } from "./profileTypes";

export interface ProfileHealthSummary {
  totalProfiles: number;
  staleCount: number;
  lowConfidenceCount: number;
  missingSourceCount: number;
  refreshNeededCount: number;
  byEntityType: Record<string, number>;
  staleProfiles: CommunityProfile[];
  lowConfidenceProfiles: CommunityProfile[];
  missingSourceProfiles: CommunityProfile[];
}

export function runProfileHealth(): ProfileHealthSummary {
  const all = buildProfileRegistry();
  const staleProfiles = all.filter((p) => isStaleFreshness(p.freshness));
  const lowConfidenceProfiles = all.filter((p) => isLowConfidence(p.freshness));
  const missingSourceProfiles = all.filter((p) => missingSources(p.freshness));
  const refreshNeededCount = all.filter((p) => p.freshness.refreshNeeded).length;

  const byEntityType: Record<string, number> = {};
  for (const p of all) {
    byEntityType[p.entityType] = (byEntityType[p.entityType] ?? 0) + 1;
  }

  return {
    totalProfiles: all.length,
    staleCount: staleProfiles.length,
    lowConfidenceCount: lowConfidenceProfiles.length,
    missingSourceCount: missingSourceProfiles.length,
    refreshNeededCount,
    byEntityType,
    staleProfiles: staleProfiles.slice(0, 50),
    lowConfidenceProfiles: lowConfidenceProfiles.slice(0, 50),
    missingSourceProfiles: missingSourceProfiles.slice(0, 50),
  };
}
