import type { CivicEvent } from "../types";
import type { CampaignEventPlan, CampaignWorkspace } from "../campaigns/types";
import type { CountyOpportunityAnalysis, CountyRollupView } from "../local-intelligence/types";
import { institutionsNotYetInCalendar } from "../local-intelligence/countyRollup";
import { scoreEventForCampaign } from "../campaigns/eventIntel";

export function analyzeCountyOpportunity(
  rollup: CountyRollupView,
  workspace: CampaignWorkspace,
  events: CivicEvent[],
  plans: Record<string, CampaignEventPlan>,
): CountyOpportunityAnalysis {
  const { dossier, cities, events: eventRollup, candidateActivity } = rollup;
  const countyEvents = events.filter((e) => e.county?.toLowerCase() === dossier.county.toLowerCase());
  const highRd = countyEvents.filter((e) => scoreEventForCampaign(e).relationshipDensityScore >= 70);
  const unplannedHighRd = highRd.filter((e) => !plans[e.id] || plans[e.id].planStatus === "needs_research");
  const citiesWithoutEvents = cities.filter(
    (c) => !countyEvents.some((e) => e.city?.toLowerCase() === c.city.toLowerCase()),
  );

  const institutionGaps = institutionsNotYetInCalendar(dossier.institutions, eventRollup);
  const missingRelationships = [
    ...institutionGaps,
    ...(candidateActivity.attendedCount === 0 ? [`No ${workspace.candidateName} presence planned in ${dossier.county} County`] : []),
  ].slice(0, 6);

  const highValueNotVisited = institutionGaps.filter((g) => /Rotary|Farm Bureau|VFD|Kiwanis/i.test(g));

  return {
    source: "deterministic",
    biggestOpportunity:
      unplannedHighRd.length > 0
        ? `${unplannedHighRd.length} high-RD events in ${dossier.county} County with no campaign plan — start with ${unplannedHighRd[0]?.title ?? "top RD room"}`
        : highRd.length > 0
          ? `${highRd.length} relationship-density rooms already indexed — deepen repeat attendance`
          : `Expand harvest coverage across ${cities.length} priority cities feeding ${dossier.county} County`,
    biggestRisk:
      citiesWithoutEvents.length >= cities.length / 2
        ? `Calendar gap: ${citiesWithoutEvents.length} feeder cities have zero indexed events`
        : candidateActivity.attendedCount === 0
          ? "No planned campaign presence despite upcoming county events"
          : "Low dossier confidence — verify demographics and institutions locally before scaling spend",
    missingRelationships,
    highValueInstitutionsNotVisited: highValueNotVisited,
    eventsMissingFromCalendar: citiesWithoutEvents.slice(0, 8).map((c) => `${c.city} — no events in feed`),
    untappedVolunteerOpportunities: eventRollup.volunteer.length
      ? eventRollup.volunteer.slice(0, 5)
      : ["County fair setup", "Church/community meal service", "VFD fundraiser — verify locally"],
  };
}
