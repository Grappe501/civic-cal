import registryBundle from "../../../data/fairs/arkansas-county-fair-registry.json";
import approvedBundle from "../../../data/ingestion/county-fair-approved-events.json";
import researchBundle from "../../../data/ingestion/county-fair-research-tasks.json";

export type CountyFairHealth = {
  countyRegistryCount: number;
  verifiedDatedCount: number;
  needsConfirmationCount: number;
  approvedPublicCount: number;
  researchTaskCount: number;
  stateFairStatus: string;
  regionalFairCount: number;
};

export function runCountyFairHealth(): CountyFairHealth {
  const registry = registryBundle as { countyCount?: number; fairs?: { verification_status?: string; is_state_fair?: boolean; is_regional_fair?: boolean }[] };
  const fairs = registry.fairs ?? [];
  const approved = (approvedBundle as { events?: unknown[] }).events ?? [];
  const research = (researchBundle as { tasks?: unknown[]; openCount?: number }).tasks ?? [];

  const countyFairs = fairs.filter((f) => !f.is_regional_fair && !f.is_state_fair);
  const stateFair = fairs.find((f) => f.is_state_fair);

  return {
    countyRegistryCount: registry.countyCount ?? countyFairs.length,
    verifiedDatedCount: countyFairs.filter((f) => f.verification_status === "verified_dated").length,
    needsConfirmationCount: countyFairs.filter((f) => f.verification_status === "needs_date_confirmation").length,
    approvedPublicCount: approved.length,
    researchTaskCount: research.length || (researchBundle as { openCount?: number }).openCount || 0,
    stateFairStatus: stateFair?.verification_status ?? "needs_date_confirmation",
    regionalFairCount: fairs.filter((f) => f.is_regional_fair).length,
  };
}
