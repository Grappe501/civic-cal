/** Soft spam/risk scoring for public submissions — stages questionable items, does not hard-block. */

export interface SubmissionTrustSignals {
  isHostOrganizer?: boolean;
  attendedBefore?: boolean;
  isPublicGovernmentMeeting?: boolean;
  isRecurringTradition?: boolean;
  isOpenToPublic?: boolean;
}

export interface SubmitRiskResult {
  score: number;
  flags: string[];
  recommendation: "auto_review" | "standard_review" | "enhanced_review";
}

const ADULT_TERMS = /\b(casino|porn|xxx|escort|strip club|adult only)\b/i;
const SUSPICIOUS_LINK = /bit\.ly|tinyurl|t\.co\/[a-z0-9]{4,}/i;

export function scoreSubmissionRisk(payload: {
  title: string;
  description?: string;
  websiteUrl?: string;
  startAt?: string;
  city?: string;
  county?: string;
  address?: string;
  locationName?: string;
  trust?: SubmissionTrustSignals;
}): SubmitRiskResult {
  const flags: string[] = [];
  let score = 0;
  const text = `${payload.title} ${payload.description ?? ""}`;

  if (!payload.startAt) {
    flags.push("missing_date");
    score += 15;
  }
  if (!payload.county && !payload.city && !payload.address && !payload.locationName) {
    flags.push("missing_location");
    score += 15;
  }
  if (!payload.websiteUrl && !payload.trust?.isPublicGovernmentMeeting) {
    flags.push("no_source");
    score += 8;
  }
  if (payload.title === payload.title.toUpperCase() && payload.title.length > 10) {
    flags.push("all_caps_title");
    score += 12;
  }
  if (ADULT_TERMS.test(text)) {
    flags.push("adult_or_irrelevant");
    score += 40;
  }
  if (payload.websiteUrl && SUSPICIOUS_LINK.test(payload.websiteUrl)) {
    flags.push("suspicious_link");
    score += 20;
  }

  const trust = payload.trust ?? {};
  if (trust.isHostOrganizer) score -= 10;
  if (trust.attendedBefore) score -= 5;
  if (trust.isPublicGovernmentMeeting) score -= 8;
  if (trust.isRecurringTradition) score -= 5;
  if (trust.isOpenToPublic) score -= 3;

  score = Math.max(0, Math.min(100, score));

  let recommendation: SubmitRiskResult["recommendation"] = "standard_review";
  if (score >= 45) recommendation = "enhanced_review";
  else if (score <= 10 && (trust.isHostOrganizer || trust.isPublicGovernmentMeeting)) recommendation = "auto_review";

  return { score, flags, recommendation };
}
