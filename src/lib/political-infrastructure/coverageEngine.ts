import { listCountyInfrastructureCoverage } from "./registry";

export interface PoliticalInfrastructureAuditRow {
  county: string;
  democratic: string;
  republican: string;
  libertarian: string;
  coveragePercent: number;
}

export function runPoliticalInfrastructureAudit(): {
  generatedAt: string;
  totalCounties: number;
  avgPoliticalCoverage: number;
  democraticPagesDiscovered: number;
  democraticWithSchedule: number;
  republicanWithSchedule: number;
  libertarianIndexed: number;
  rows: PoliticalInfrastructureAuditRow[];
} {
  const counties = listCountyInfrastructureCoverage();
  const rows = counties.map((c) => {
    const dem = c.entities.find((e) => e.key === "democratic_committee");
    const rep = c.entities.find((e) => e.key === "republican_committee");
    const lib = c.entities.find((e) => e.key === "libertarian_affiliate");
    return {
      county: c.county,
      democratic: dem?.meetingSchedule ?? (dem?.found ? "page discovered" : "none"),
      republican: rep?.meetingSchedule ?? (rep?.found ? "page discovered" : "none"),
      libertarian: lib?.found ? lib.meetingSchedule ?? "affiliate indexed" : "none",
      coveragePercent: c.coveragePercent,
    };
  });

  const avg =
    rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.coveragePercent, 0) / rows.length) : 0;

  return {
    generatedAt: new Date().toISOString(),
    totalCounties: rows.length,
    avgPoliticalCoverage: avg,
    democraticPagesDiscovered: rows.filter((r) => r.democratic !== "none").length,
    democraticWithSchedule: rows.filter((r) => r.democratic !== "none" && r.democratic !== "page discovered").length,
    republicanWithSchedule: rows.filter((r) => r.republican !== "none" && r.republican !== "page discovered").length,
    libertarianIndexed: rows.filter((r) => r.libertarian !== "none").length,
    rows,
  };
}
