import orgBundle from "../../../data/political-infrastructure/party-organizations.json";
import coverageBundle from "../../../data/political-infrastructure/county-infrastructure-coverage.json";
import type { CountyInfrastructureCoverage, PoliticalPartyOrganization } from "./types";

export function listPoliticalPartyOrganizations(county?: string): PoliticalPartyOrganization[] {
  const orgs = (orgBundle as { organizations?: PoliticalPartyOrganization[] }).organizations ?? [];
  if (!county) return orgs;
  return orgs.filter((o) => o.county.toLowerCase() === county.toLowerCase());
}

export function getPoliticalPartyOrganization(slug: string): PoliticalPartyOrganization | undefined {
  return listPoliticalPartyOrganizations().find((o) => o.slug === slug);
}

export function listCountyInfrastructureCoverage(): CountyInfrastructureCoverage[] {
  return (coverageBundle as { counties?: CountyInfrastructureCoverage[] }).counties ?? [];
}

export function getCountyInfrastructureCoverage(county: string): CountyInfrastructureCoverage | undefined {
  return listCountyInfrastructureCoverage().find((c) => c.county.toLowerCase() === county.toLowerCase());
}
