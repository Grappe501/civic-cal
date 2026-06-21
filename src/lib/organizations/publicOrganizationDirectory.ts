import { listChurches, listColleges, listOrganizations, listSchools } from "../institutions/registry";
import { listExtensionOffices, listHomemakerClubs } from "../institutions/communityAnchorsRegistry";
import { citySlug } from "../local-intelligence/registry";
import { countySlug } from "../counties";
import type { HostGlyphKind } from "../glyphs/civicGlyphs";

export type PublicHostType =
  | "church"
  | "school"
  | "college"
  | "festival"
  | "chamber"
  | "rotary"
  | "vfd"
  | "library"
  | "farm_bureau"
  | "extension"
  | "homemakers"
  | "naacp"
  | "four_h"
  | "business"
  | "nonprofit"
  | "campaign"
  | "community";

export interface PublicOrganizationProfile {
  id: string;
  slug: string;
  name: string;
  hostType: PublicHostType;
  glyphKind: HostGlyphKind;
  county: string;
  city?: string | null;
  website?: string | null;
  description?: string | null;
  volunteerPageUrl?: string | null;
  donationPageUrl?: string | null;
  recurringTraditions?: string[];
  verified: boolean;
  claimStatus: "unclaimed" | "pending" | "claimed";
}

function slugifyPart(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

export function organizationPublicSlug(name: string, county: string, city?: string | null): string {
  const base = [city ? slugifyPart(city) : null, slugifyPart(county), slugifyPart(name.replace(/\s*—\s*verify.*$/i, ""))]
    .filter(Boolean)
    .join("-");
  return base.slice(0, 96);
}

function orgTypeToHost(orgType: string): { hostType: PublicHostType; glyphKind: HostGlyphKind } {
  const map: Record<string, { hostType: PublicHostType; glyphKind: HostGlyphKind }> = {
    vfd: { hostType: "vfd", glyphKind: "vfd" },
    rotary: { hostType: "rotary", glyphKind: "rotary" },
    lions: { hostType: "community", glyphKind: "community" },
    kiwanis: { hostType: "community", glyphKind: "community" },
    farm_bureau: { hostType: "farm_bureau", glyphKind: "farm_bureau" },
    ffa: { hostType: "four_h", glyphKind: "four_h" },
    four_h: { hostType: "four_h", glyphKind: "four_h" },
    chamber: { hostType: "chamber", glyphKind: "chamber" },
    library: { hostType: "library", glyphKind: "library" },
    hospital: { hostType: "nonprofit", glyphKind: "nonprofit" },
    community_center: { hostType: "community", glyphKind: "community" },
    youth_sports: { hostType: "nonprofit", glyphKind: "race" },
  };
  return map[orgType] ?? { hostType: "community", glyphKind: "community" };
}

function buildDirectory(): PublicOrganizationProfile[] {
  const profiles: PublicOrganizationProfile[] = [];
  const seen = new Set<string>();

  function add(p: PublicOrganizationProfile) {
    if (seen.has(p.slug)) return;
    seen.add(p.slug);
    profiles.push(p);
  }

  for (const c of listChurches()) {
    add({
      id: c.id,
      slug: organizationPublicSlug(c.churchName, c.county, c.city),
      name: c.churchName,
      hostType: "church",
      glyphKind: "church",
      county: c.county,
      city: c.city,
      website: c.website,
      description: c.denomination ? `${c.denomination} congregation in ${c.city}, ${c.county} County` : null,
      recurringTraditions: c.annualEvents,
      verified: c.verified,
      claimStatus: "unclaimed",
    });
  }

  for (const s of listSchools()) {
    add({
      id: s.id,
      slug: organizationPublicSlug(s.schoolName, s.county, s.city),
      name: s.schoolName,
      hostType: "school",
      glyphKind: "school",
      county: s.county,
      city: s.city,
      website: s.website,
      description: s.district ? `${s.district} — ${s.city}` : null,
      verified: s.verified,
      claimStatus: "unclaimed",
    });
  }

  for (const col of listColleges()) {
    add({
      id: col.id,
      slug: organizationPublicSlug(col.institutionName, col.county, col.city),
      name: col.institutionName,
      hostType: "college",
      glyphKind: "college",
      county: col.county,
      city: col.city,
      website: col.campusCalendarUrl,
      description: col.publicEventsNotes,
      verified: col.verified,
      claimStatus: "unclaimed",
    });
  }

  for (const o of listOrganizations()) {
    const { hostType, glyphKind } = orgTypeToHost(o.orgType);
    add({
      id: o.id,
      slug: organizationPublicSlug(o.name, o.county, o.city),
      name: o.name,
      hostType,
      glyphKind,
      county: o.county,
      city: o.city,
      website: o.website,
      verified: o.verified,
      claimStatus: "unclaimed",
    });
  }

  for (const ext of listExtensionOffices()) {
    add({
      id: ext.id,
      slug: organizationPublicSlug(ext.officeName, ext.county),
      name: ext.officeName,
      hostType: "extension",
      glyphKind: "extension",
      county: ext.county,
      website: ext.website,
      description: "Cooperative Extension — agriculture, 4-H, family & consumer science",
      recurringTraditions: ext.harvestTargets,
      verified: ext.verified,
      claimStatus: "unclaimed",
    });
  }

  for (const eh of listHomemakerClubs()) {
    add({
      id: eh.id,
      slug: organizationPublicSlug(eh.clubName, eh.county, eh.city),
      name: eh.clubName,
      hostType: "homemakers",
      glyphKind: "homemakers",
      county: eh.county,
      city: eh.city,
      description: eh.publicEventsNotes,
      verified: eh.verified,
      claimStatus: "unclaimed",
    });
  }

  return profiles;
}

let cache: PublicOrganizationProfile[] | null = null;

export function listPublicOrganizations(county?: string, hostType?: PublicHostType): PublicOrganizationProfile[] {
  if (!cache) cache = buildDirectory();
  let list = cache;
  if (county) list = list.filter((o) => o.county.toLowerCase() === county.replace(/\s+County$/i, "").toLowerCase());
  if (hostType) list = list.filter((o) => o.hostType === hostType);
  return list;
}

export function getOrganizationBySlug(slug: string): PublicOrganizationProfile | undefined {
  return listPublicOrganizations().find((o) => o.slug === slug.toLowerCase());
}

export function organizationsInCity(city: string, county: string): PublicOrganizationProfile[] {
  const cNorm = city.toLowerCase();
  return listPublicOrganizations(county).filter((o) => o.city?.toLowerCase() === cNorm);
}

export function organizationPath(slug: string): string {
  return `/organization/${slug}`;
}

export function cityPublicPath(city: string): string {
  return `/${citySlug(city)}`;
}

export function countyPublicPath(county: string): string {
  return `/${countySlug(county)}-county`;
}
