export type SourceConfidence = "high" | "medium" | "low" | "placeholder";

export type VerificationStatus = "verified" | "needs_review" | "placeholder" | "rejected";

export interface SourceLink {
  label: string;
  url: string;
}

export interface FreshnessMeta {
  dataAsOf: string;
  lastRefreshedAt: string;
  sourceConfidence: SourceConfidence;
  sourceCount: number;
  sourceLinks: SourceLink[];
  verificationStatus: VerificationStatus;
  refreshNeeded: boolean;
  refreshNotes?: string | null;
}

export function defaultFreshness(partial?: Partial<FreshnessMeta>): FreshnessMeta {
  const now = new Date().toISOString().slice(0, 10);
  return {
    dataAsOf: partial?.dataAsOf ?? now,
    lastRefreshedAt: partial?.lastRefreshedAt ?? now,
    sourceConfidence: partial?.sourceConfidence ?? "placeholder",
    sourceCount: partial?.sourceCount ?? 0,
    sourceLinks: partial?.sourceLinks ?? [],
    verificationStatus: partial?.verificationStatus ?? "placeholder",
    refreshNeeded: partial?.refreshNeeded ?? true,
    refreshNotes: partial?.refreshNotes ?? "Scaffold profile — verify before promoting.",
  };
}
