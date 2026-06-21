import type { IngestionCandidate } from "../intelligence/types";
import type { SourceVerificationResult } from "./eventCoverageTypes";

export function verifyCandidateSource(
  candidate: Pick<IngestionCandidate, "title" | "eventDate" | "venueName" | "county" | "sourceUrl" | "rawText" | "notes">,
  sourceExcerpt?: string,
): SourceVerificationResult {
  const text = `${sourceExcerpt ?? ""} ${candidate.rawText ?? ""} ${candidate.notes ?? ""}`.toLowerCase();
  const confirmedFields: string[] = [];
  const inferredFields: string[] = [];
  const missingFields: string[] = [];
  const warnings: string[] = [];

  if (candidate.county && text.includes(candidate.county.toLowerCase())) confirmedFields.push("county");
  else if (candidate.county) missingFields.push("county");

  if (candidate.venueName && text.includes(candidate.venueName.toLowerCase().slice(0, 12))) confirmedFields.push("venue");
  else if (candidate.venueName) inferredFields.push("venue");

  if (candidate.eventDate && /\d{4}-\d{2}-\d{2}/.test(text)) confirmedFields.push("date");
  else if (!candidate.eventDate) missingFields.push("next_date");

  if (candidate.sourceUrl) confirmedFields.push("source_url");
  else {
    missingFields.push("source_url");
    warnings.push("No source URL on file");
  }

  if (/awaiting committee confirmation/i.test(text)) {
    warnings.push("Source says meeting info awaiting confirmation");
  }

  const confidence = Math.min(100, confirmedFields.length * 20 + (candidate.sourceUrl ? 15 : 0));
  return {
    supported: confirmedFields.includes("source_url") && confirmedFields.length >= 2,
    confirmedFields,
    inferredFields,
    missingFields,
    confidence,
    warnings,
    summary: `Source supports ${confirmedFields.length} field(s); ${missingFields.length} missing; ${warnings.length} warning(s).`,
  };
}
