import { getCountyInfrastructureCoverage } from "./registry";
import type { CivicPoliticalDensitySummary } from "./types";

const ENTITY_LABELS: Record<string, string> = {
  democratic_committee: "Democratic committee",
  republican_committee: "Republican committee",
  libertarian_affiliate: "Libertarian affiliate",
  school_board: "School board",
  quorum_court: "Quorum court",
  election_commission: "Election commission",
  city_council: "City council",
};

function scheduleLabel(entity: { found: boolean; meetingSchedule?: string | null; status: string }): string {
  if (entity.meetingSchedule) return entity.meetingSchedule;
  if (entity.found && entity.status === "page_discovered") return "page listed — schedule not parsed";
  if (entity.status === "pass_26_plus") return "Pass 26+ harvest";
  return "none found";
}

/** Neutral civic-political infrastructure summary — no ideology, no persuasion. */
export function buildCivicPoliticalDensitySummary(county: string): CivicPoliticalDensitySummary {
  const coverage = getCountyInfrastructureCoverage(county);
  if (!coverage) {
    return {
      county,
      lines: [],
      coveragePercent: 0,
      note: "County infrastructure coverage not built yet — run npm run build:political-infrastructure",
    };
  }

  const lines = coverage.entities.map((e) => ({
    label: ENTITY_LABELS[e.key] ?? e.label,
    value: scheduleLabel(e),
    found: e.found,
  }));

  return {
    county,
    lines,
    coveragePercent: coverage.coveragePercent,
    note: "Public-source civic-political infrastructure only. Verify locally before planning.",
  };
}

export function formatDensitySummaryText(summary: CivicPoliticalDensitySummary): string {
  const header = `${summary.county} County — civic-political infrastructure`;
  const body = summary.lines.map((l) => `${l.label}: ${l.found ? l.value : "none found"}`).join("\n");
  return `${header}\n\n${body}\n\nPolitical infrastructure coverage: ${summary.coveragePercent}% (party committees; government bodies in Pass 26+)`;
}
