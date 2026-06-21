import { listChurches, listColleges, listOrganizations, listSchools } from "../institutions/registry";
import { listExtensionOffices, listHomemakerClubs } from "../institutions/communityAnchorsRegistry";
import { citiesInCounty } from "../local-intelligence/registry";
import type { InstitutionCounts } from "./densityTypes";

function normCounty(county: string): string {
  return county.replace(/\s+County$/i, "").trim();
}

export function countInstitutions(county: string): InstitutionCounts {
  const c = normCounty(county);
  const orgs = listOrganizations(c);
  const vfds = orgs.filter((o) => o.orgType === "vfd");
  const libraries = orgs.filter((o) => o.orgType === "library");
  const chambers = orgs.filter((o) => o.orgType === "chamber");
  const civicOrgs = orgs.filter((o) => !["library", "hospital", "vfd", "chamber"].includes(o.orgType));

  const churches = listChurches(c).length;
  const schools = listSchools(c).length;
  const colleges = listColleges(c).length;
  const extensionOffices = listExtensionOffices(c).length;
  const homemakerClubs = listHomemakerClubs(c).length;

  return {
    churches,
    schools,
    colleges,
    vfds: vfds.length,
    libraries: libraries.length,
    extensionOffices,
    homemakerClubs,
    civicOrgs: civicOrgs.length,
    chambers: chambers.length,
    total: churches + schools + colleges + vfds.length + libraries.length + extensionOffices + homemakerClubs + civicOrgs.length + chambers.length,
  };
}

export function feederCityCount(county: string): number {
  return citiesInCounty(normCounty(county)).length;
}
