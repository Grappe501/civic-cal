import { addDays, format, endOfWeek } from "date-fns";
import type { CampaignEventPlan, CampaignWorkspace } from "./types";
import type { ClassifiedCampaignEvent } from "./districtScope";

export interface CalendarGap {
  type: string;
  label: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

export interface GapAnalysisResult {
  gaps: CalendarGap[];
  daysWithNoPlans: string[];
  countiesWithoutPresence: string[];
  citiesWithoutPresence: string[];
  highValueUnacted: ClassifiedCampaignEvent[];
  lowValueOverplanned: ClassifiedCampaignEvent[];
  volunteerGaps: ClassifiedCampaignEvent[];
  weekendOpportunities: ClassifiedCampaignEvent[];
  districtCoveragePct: number;
}

export function analyzeCalendarGaps(
  classified: ClassifiedCampaignEvent[],
  plans: Record<string, CampaignEventPlan>,
  workspace: CampaignWorkspace,
): GapAnalysisResult {
  const gaps: CalendarGap[] = [];
  const now = new Date();
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

  const planned = classified.filter(
    (c) => plans[c.scored.event.id] && !["skip", "needs_research"].includes(plans[c.scored.event.id].planStatus),
  );
  const plannedDates = new Set(
    planned.map((c) => format(new Date(c.scored.event.startAt), "yyyy-MM-dd")),
  );

  const daysWithNoPlans: string[] = [];
  for (let d = now; d <= weekEnd; d = addDays(d, 1)) {
    const key = format(d, "yyyy-MM-dd");
    if (!plannedDates.has(key)) daysWithNoPlans.push(key);
  }

  if (daysWithNoPlans.length >= 3) {
    gaps.push({
      type: "empty_days",
      label: `${daysWithNoPlans.length} days this week with no planned events`,
      detail: daysWithNoPlans.slice(0, 5).join(", "),
      severity: "high",
    });
  }

  const scopeCounties = workspace.districtScope.counties.length
    ? workspace.districtScope.counties
    : [...new Set(classified.map((c) => c.scored.event.county).filter(Boolean))] as string[];

  const countiesWithPlans = new Set(
    planned.map((c) => c.scored.event.county).filter(Boolean),
  );
  const countiesWithoutPresence = scopeCounties.filter((c) => !countiesWithPlans.has(c));

  if (countiesWithoutPresence.length) {
    gaps.push({
      type: "county_gap",
      label: `${countiesWithoutPresence.length} counties with no planned presence`,
      detail: countiesWithoutPresence.slice(0, 6).join(", "),
      severity: countiesWithoutPresence.length > 3 ? "high" : "medium",
    });
  }

  const citiesWithPlans = new Set(planned.map((c) => c.scored.event.city).filter(Boolean));
  const scopeCities = workspace.cities.length ? workspace.cities : [];
  const citiesWithoutPresence = scopeCities.filter((c) => !citiesWithPlans.has(c));

  const highValueUnacted = classified
    .filter(
      (c) =>
        c.scored.politicalOpportunityScore >= 75 &&
        (!plans[c.scored.event.id] || ["considering", "needs_research"].includes(plans[c.scored.event.id].planStatus)),
    )
    .slice(0, 10);

  if (highValueUnacted.length >= 3) {
    gaps.push({
      type: "high_value_unacted",
      label: `${highValueUnacted.length} high-PO events not yet planned`,
      detail: highValueUnacted.slice(0, 3).map((c) => c.scored.event.title).join("; "),
      severity: "high",
    });
  }

  const lowValueOverplanned = planned.filter((c) => c.scored.politicalOpportunityScore < 45).slice(0, 8);

  const volunteerGaps = classified.filter(
    (c) =>
      c.scored.relationshipDensityScore >= 70 &&
      (!plans[c.scored.event.id] || plans[c.scored.event.id].planStatus !== "needs_volunteers"),
  ).slice(0, 8);

  const weekendOpportunities = classified.filter((c) => {
    const day = new Date(c.scored.event.startAt).getDay();
    return (day === 0 || day === 6) && c.scored.politicalOpportunityScore >= 60;
  }).slice(0, 10);

  if (weekendOpportunities.length && planned.filter((c) => {
    const day = new Date(c.scored.event.startAt).getDay();
    return day === 0 || day === 6;
  }).length === 0) {
    gaps.push({
      type: "weekend_gap",
      label: "No weekend events planned yet",
      detail: `${weekendOpportunities.length} weekend opportunities in scope`,
      severity: "medium",
    });
  }

  const insideCount = classified.filter((c) => c.zone === "inside").length;
  const insidePlanned = planned.filter((c) => c.zone === "inside").length;
  const districtCoveragePct = insideCount ? Math.round((insidePlanned / insideCount) * 100) : 0;

  if (districtCoveragePct < 30 && insideCount > 5) {
    gaps.push({
      type: "district_coverage",
      label: `Only ${districtCoveragePct}% of inside-district events have plans`,
      detail: "Prioritize events inside your district boundary",
      severity: "high",
    });
  }

  return {
    gaps,
    daysWithNoPlans,
    countiesWithoutPresence,
    citiesWithoutPresence,
    highValueUnacted,
    lowValueOverplanned,
    volunteerGaps,
    weekendOpportunities,
    districtCoveragePct,
  };
}

export function recommendedNextEvents(
  classified: ClassifiedCampaignEvent[],
  plans: Record<string, CampaignEventPlan>,
  limit = 5,
): ClassifiedCampaignEvent[] {
  return [...classified]
    .filter((c) => !plans[c.scored.event.id] || plans[c.scored.event.id].planStatus === "considering")
    .sort((a, b) => {
      const scoreA = a.scored.politicalOpportunityScore * 0.5 + a.scored.relationshipDensityScore * 0.5;
      const scoreB = b.scored.politicalOpportunityScore * 0.5 + b.scored.relationshipDensityScore * 0.5;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}
