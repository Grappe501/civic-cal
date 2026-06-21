/** @deprecated Use src/lib/campaigns/* — kept for backward imports */
export type { DistrictType, PlanStatus, CampaignWorkspace, CampaignEventPlan } from "../campaigns/types";
export { DISTRICT_TYPE_LABELS, PLAN_STATUS_LABELS } from "../campaigns/types";
export { applyDistrictScope as filterEventsInDistrict } from "../campaigns/districtScope";
export { loadPlansForCampaign as loadEventPlans, savePlanForCampaign as saveEventPlan } from "../campaigns/planStore";
