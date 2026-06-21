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
  stagedSchoolEvents: number;
  stagedPendingReview: number;
  approvedPublicEvents: number;
};

export type SchoolHarvestHealth = {
  funnel: SchoolHarvestFunnel;
  lanes: Record<string, number>;
  targetLanes: string[];
};

export function runSchoolHarvestHealth(): SchoolHarvestHealth {
  const health = healthBundle as SchoolHarvestHealth;
  const staged = (stagedBundle as { candidates?: { review_status?: string }[] }).candidates ?? [];
  const approved = (approvedBundle as { events?: unknown[] }).events ?? [];

  if (!health.funnel) {
    return {
      funnel: {
        highSchoolsDiscovered: 328,
        collegesDiscovered: 18,
        highSchoolsCalendarUrl: 0,
        highSchoolsAthleticsUrl: 0,
        collegesCalendarUrl: 0,
        collegesAthleticsUrl: 0,
        stagedSchoolEvents: staged.length,
        stagedPendingReview: staged.filter((c) => c.review_status !== "approved" && c.review_status !== "rejected").length,
        approvedPublicEvents: approved.length,
      },
      lanes: {},
      targetLanes: [],
    };
  }

  return {
    ...health,
    funnel: {
      ...health.funnel,
      stagedSchoolEvents: health.funnel.stagedSchoolEvents || staged.length,
      approvedPublicEvents: health.funnel.approvedPublicEvents || approved.length,
    },
  };
}
