import registry from "../../../data/weekly-recurring/weekly-recurring-institution-registry.json";
import seriesBundle from "../../../data/weekly-recurring/weekly-recurring-series-registry.json";
import approvedBundle from "../../../data/weekly-recurring/weekly-recurring-approved-events.json";
import researchBundle from "../../../data/weekly-recurring/weekly-recurring-research-tasks.json";

type InstitutionRow = { city: string; county: string };
type ResearchTask = { status?: string };

export interface WeeklyRecurringHealth {
  institutionCount: number;
  seriesCount: number;
  approvedPublicEvents: number;
  openResearchTasks: number;
  citiesCovered: number;
  countiesCovered: number;
}

export function runWeeklyRecurringHealth(): WeeklyRecurringHealth {
  const institutions = (registry.institutions ?? []) as InstitutionRow[];
  const series = seriesBundle.series ?? [];
  const events = approvedBundle.events ?? [];
  const tasks = (researchBundle.tasks ?? []) as ResearchTask[];

  return {
    institutionCount: institutions.length,
    seriesCount: series.length,
    approvedPublicEvents: events.length,
    openResearchTasks: tasks.filter((t) => t.status === "open").length,
    citiesCovered: new Set(institutions.map((i) => i.city)).size,
    countiesCovered: new Set(institutions.map((i) => i.county)).size,
  };
}
