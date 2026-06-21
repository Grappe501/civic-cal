import healthBundle from "../../../data/schools/school-harvest-health.json";
import stagedBundle from "../../../data/ingestion/school-events-staged.json";
import approvedBundle from "../../../data/ingestion/school-events-approved-events.json";

export type SchoolHarvestFunnel = {
  highSchoolsDiscovered: number;
  collegesDiscovered: number;
  highSchoolsCalendarUrl: number;
  highSchoolsAthleticsUrl: number;
  collegesCalendarUrl: number;
  collegesAthleticsUrl: number;
  projectionTargets?: number;
  datedParsedEvents?: number;
  datedPendingReview?: number;
  stagedSchoolEvents?: number;
  stagedPendingReview?: number;
  approvedPublicEvents: number;
  pass28TargetMet?: boolean;
};

export type SchoolHarvestHealth = {
  funnel: SchoolHarvestFunnel;
  lanes: Record<string, number>;
  platformCounts?: Record<string, number>;
  targetLanes: string[];
};

export function runSchoolHarvestHealth(): SchoolHarvestHealth {
  const health = healthBundle as SchoolHarvestHealth;
  const staged = stagedBundle as {
    candidates?: { review_status?: string; event_date?: string }[];
    dated_events?: { review_status?: string }[];
  };
  const approved = (approvedBundle as { events?: unknown[] }).events ?? [];
  const dated = staged.dated_events ?? staged.candidates?.filter((c) => c.event_date) ?? [];

  return {
    ...health,
    funnel: {
      ...health.funnel,
      datedParsedEvents: health.funnel.datedParsedEvents ?? dated.length,
      datedPendingReview:
        health.funnel.datedPendingReview ??
        dated.filter((c) => c.review_status !== "approved" && c.review_status !== "rejected").length,
      approvedPublicEvents: health.funnel.approvedPublicEvents || approved.length,
    },
  };
}
