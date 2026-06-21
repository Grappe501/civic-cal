import anchorBundle from "../../../data/institutions/community-anchors-directory.json";
import { listOrganizations } from "./registry";
import type { ExtensionOfficeEntry, HomemakerClubEntry, VfdAnchorEntry } from "./communityAnchorTypes";
import { EXTENSION_HARVEST_TARGETS, VFD_HARVEST_TARGETS } from "./communityAnchorTypes";

function normCounty(county: string): string {
  return county.replace(/\s+County$/i, "").toLowerCase();
}

function mapExtension(raw: Record<string, unknown>): ExtensionOfficeEntry {
  return {
    id: String(raw.id),
    county: String(raw.county),
    officeName: String(raw.office_name),
    address: (raw.address as string) ?? null,
    website: (raw.website as string) ?? null,
    calendarUrl: (raw.calendar_url as string) ?? null,
    newsletterUrl: (raw.newsletter_url as string) ?? null,
    agricultureAgents: (raw.agriculture_agents as string[]) ?? [],
    familyConsumerAgents: (raw.family_consumer_agents as string[]) ?? [],
    fourHAgents: (raw.four_h_agents as string[]) ?? [],
    harvestTargets: (raw.harvest_targets as string[]) ?? [...EXTENSION_HARVEST_TARGETS],
    verified: Boolean(raw.verified),
    status: (raw.status as ExtensionOfficeEntry["status"]) ?? "scaffold",
  };
}

function mapHomemaker(raw: Record<string, unknown>): HomemakerClubEntry {
  return {
    id: String(raw.id),
    clubName: String(raw.club_name),
    county: String(raw.county),
    city: (raw.city as string) ?? null,
    meetingLocation: (raw.meeting_location as string) ?? null,
    meetingSchedule: (raw.meeting_schedule as string) ?? null,
    countyAssociation: (raw.county_association as string) ?? null,
    publicEventsNotes: (raw.public_events_notes as string) ?? null,
    verified: Boolean(raw.verified),
    status: (raw.status as HomemakerClubEntry["status"]) ?? "scaffold",
  };
}

function loadExtensions(): ExtensionOfficeEntry[] {
  const b = anchorBundle as { extension_offices?: Record<string, unknown>[] };
  return (b.extension_offices ?? []).map(mapExtension);
}

function loadHomemakers(): HomemakerClubEntry[] {
  const b = anchorBundle as { homemaker_clubs?: Record<string, unknown>[] };
  return (b.homemaker_clubs ?? []).map(mapHomemaker);
}

export function listExtensionOffices(county?: string): ExtensionOfficeEntry[] {
  let list = loadExtensions();
  if (county) list = list.filter((o) => normCounty(o.county) === normCounty(county));
  return list;
}

export function listHomemakerClubs(county?: string): HomemakerClubEntry[] {
  let list = loadHomemakers();
  if (county) list = list.filter((o) => normCounty(o.county) === normCounty(county));
  return list;
}

export function listVfdAnchors(county?: string): VfdAnchorEntry[] {
  const vfds = listOrganizations(county, "vfd");
  return vfds.map((v) => ({
    id: v.id,
    name: v.name,
    county: v.county,
    city: v.city,
    stationLocation: null,
    coverageArea: `${v.city} area — verify`,
    website: v.website ?? null,
    facebookUrl: null,
    publicContact: null,
    harvestTargets: [...VFD_HARVEST_TARGETS],
    verified: v.verified,
  }));
}
