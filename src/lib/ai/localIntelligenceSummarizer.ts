import type { CampaignWorkspace } from "../campaigns/types";
import type {
  CityIntelligenceDossier,
  CountyIntelligenceDossier,
  LocalIntelligenceSummary,
} from "../local-intelligence/types";
import type { CivicEvent } from "../types";

export interface LocalIntelContext {
  workspace: CampaignWorkspace;
  cityDossier?: CityIntelligenceDossier | null;
  countyDossier?: CountyIntelligenceDossier | null;
  events?: CivicEvent[];
}

export function deterministicLocalSummary(ctx: LocalIntelContext): LocalIntelligenceSummary {
  const { workspace, cityDossier, countyDossier, events = [] } = ctx;
  const place = cityDossier?.city || countyDossier?.county || "this area";
  const county = cityDossier?.county || countyDossier?.county;

  const highRd = events.filter((e) => (e.relationshipDensityScore ?? 0) >= 70);
  const missing = events.length === 0;

  const electionContext = cityDossier
    ? `SOS placeholder baseline ${cityDossier.sosBaselineVotes?.toLocaleString() ?? "?"} → target ${cityDossier.sosTargetVotes?.toLocaleString() ?? "?"} (aggregate geography only — not individual targeting).`
    : countyDossier
      ? `County baseline ${countyDossier.priorSosBaseline?.toLocaleString() ?? "?"} → target ${countyDossier.targetVotes?.toLocaleString() ?? "?"}`
      : "Election math pending for this geography.";

  const missingData: string[] = [];
  if (!cityDossier?.population && !countyDossier?.demographics?.population) missingData.push("Verified population from Census ACS");
  if (!cityDossier?.majorEmployers?.length) missingData.push("Major employers list");
  if (missing) missingData.push("Events in calendar for this city/county");
  if (countyDossier && !countyDossier.institutions?.rotary?.length) missingData.push("Rotary / civic club verification");

  return {
    source: "deterministic",
    whyItMatters: `${place}${county ? ` (${county} County)` : ""} is priority rank ${cityDossier?.priorityRank ?? "—"} in the ${workspace.candidateName} workspace scope. Relationship-density civic events drive field credibility.`,
    eventsThatMatter: [
      "Church/community meals and fish fries",
      "County fair and heritage festivals",
      "City council and quorum court meetings",
      "School board and rivalry games",
      "Chamber breakfasts and VFD fundraisers",
    ],
    calendarGaps: missing
      ? ["No events currently indexed — run harvest or recruit local contributor"]
      : highRd.length
        ? [`${highRd.length} high-RD events already in feed — prioritize top PO/RD rooms`]
        : ["Few high-RD events indexed — local intel needed"],
    electionContext,
    relationshipGuidance:
      "Show up consistently at recurring traditions before election season peaks. Handshake rooms beat speeches in small Arkansas towns.",
    questionsForLocals: [
      "Which annual dinner does every serious candidate attend?",
      "Who organizes the county fair and chamber breakfast?",
      "Which church/community meal draws the biggest crowd?",
      "What meeting is on the calendar but not online?",
    ],
    confidenceNotes: `Dossier confidence ${cityDossier?.confidenceScore ?? countyDossier?.confidenceScore ?? 15}% — Census/BLS hooks pending full import.`,
    missingData,
  };
}
