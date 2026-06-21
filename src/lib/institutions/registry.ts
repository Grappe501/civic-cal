import churchBundle from "../../../data/institutions/church-directory.json";
import schoolBundle from "../../../data/institutions/school-directory.json";
import collegeBundle from "../../../data/institutions/college-directory.json";
import orgBundle from "../../../data/institutions/civic-organizations.json";
import type {
  ChurchDirectoryEntry,
  CivicOrganizationEntry,
  CollegeDirectoryEntry,
  SchoolDirectoryEntry,
} from "./types";

function mapChurch(raw: Record<string, unknown>): ChurchDirectoryEntry {
  return {
    id: String(raw.id),
    churchName: String(raw.church_name),
    city: String(raw.city),
    county: String(raw.county),
    denomination: (raw.denomination as string) ?? null,
    address: (raw.address as string) ?? null,
    website: (raw.website as string) ?? null,
    leadershipPublic: (raw.leadership_public as string) ?? null,
    serviceTimes: (raw.service_times as string) ?? null,
    youthPrograms: (raw.youth_programs as string) ?? null,
    schoolAttached: (raw.school_attached as boolean) ?? null,
    foodPantry: (raw.food_pantry as boolean) ?? null,
    communityMeals: (raw.community_meals as boolean) ?? null,
    annualEvents: (raw.annual_events as string[]) ?? [],
    vbs: (raw.vbs as boolean) ?? null,
    trunkOrTreat: (raw.trunk_or_treat as boolean) ?? null,
    fishFry: (raw.fish_fry as boolean) ?? null,
    spaghettiDinner: (raw.spaghetti_dinner as boolean) ?? null,
    sizeCategory: (raw.size_category as ChurchDirectoryEntry["sizeCategory"]) ?? null,
    sourceLinks: (raw.source_links as ChurchDirectoryEntry["sourceLinks"]) ?? [],
    lastVerified: (raw.last_verified as string) ?? null,
    verified: Boolean(raw.verified),
    status: (raw.status as ChurchDirectoryEntry["status"]) ?? "scaffold",
  };
}

function mapSchool(raw: Record<string, unknown>): SchoolDirectoryEntry {
  const gov = raw.governance as Record<string, unknown> | undefined;
  const act = raw.activities as Record<string, unknown> | undefined;
  const cal = raw.calendar_feed as Record<string, unknown> | undefined;
  return {
    id: String(raw.id),
    schoolName: String(raw.school_name),
    city: String(raw.city),
    county: String(raw.county),
    district: (raw.district as string) ?? null,
    schoolType: (raw.school_type as SchoolDirectoryEntry["schoolType"]) ?? null,
    gradesServed: (raw.grades_served as string) ?? null,
    enrollment: (raw.enrollment as number) ?? null,
    mascot: (raw.mascot as string) ?? null,
    schoolColors: (raw.school_colors as string) ?? null,
    principal: (raw.principal as string) ?? null,
    superintendent: (raw.superintendent as string) ?? null,
    address: (raw.address as string) ?? null,
    website: (raw.website as string) ?? null,
    governance: gov
      ? {
          boardMeetingSchedule: (gov.board_meeting_schedule as string) ?? null,
          boardMembers: (gov.board_members as string[]) ?? [],
          boardMeetingLocation: (gov.board_meeting_location as string) ?? null,
          publicCommentInfo: (gov.public_comment_info as string) ?? null,
        }
      : undefined,
    activities: act
      ? {
          football: Boolean(act.football),
          basketball: Boolean(act.basketball),
          baseball: Boolean(act.baseball),
          softball: Boolean(act.softball),
          soccer: Boolean(act.soccer),
          track: Boolean(act.track),
          band: Boolean(act.band),
          choir: Boolean(act.choir),
          ffa: Boolean(act.ffa),
          fourH: Boolean(act.four_h),
          academicTeams: Boolean(act.academic_teams),
        }
      : undefined,
    calendarFeed: cal
      ? {
          harvestTargets: (cal.harvest_targets as string[]) ?? [],
          lastHarvestAt: (cal.last_harvest_at as string) ?? null,
        }
      : undefined,
    sourceLinks: (raw.source_links as SchoolDirectoryEntry["sourceLinks"]) ?? [],
    lastVerified: (raw.last_verified as string) ?? null,
    verified: Boolean(raw.verified),
    status: (raw.status as SchoolDirectoryEntry["status"]) ?? "scaffold",
  };
}

function mapCollege(raw: Record<string, unknown>): CollegeDirectoryEntry {
  const cal = raw.calendar_feed as Record<string, unknown> | undefined;
  return {
    id: String(raw.id),
    institutionName: String(raw.institution_name),
    city: String(raw.city),
    county: String(raw.county),
    institutionType: (raw.institution_type as CollegeDirectoryEntry["institutionType"]) ?? "university",
    enrollment: (raw.enrollment as number) ?? null,
    studentDemographics: (raw.student_demographics as string) ?? null,
    athletics: (raw.athletics as string[]) ?? [],
    majorPrograms: (raw.major_programs as string[]) ?? [],
    campusCalendarUrl: (raw.campus_calendar_url as string) ?? null,
    publicEventsNotes: (raw.public_events_notes as string) ?? null,
    calendarFeed: cal
      ? { harvestTargets: (cal.harvest_targets as string[]) ?? [], lastHarvestAt: (cal.last_harvest_at as string) ?? null }
      : undefined,
    sourceLinks: (raw.source_links as CollegeDirectoryEntry["sourceLinks"]) ?? [],
    lastVerified: (raw.last_verified as string) ?? null,
    verified: Boolean(raw.verified),
    status: (raw.status as CollegeDirectoryEntry["status"]) ?? "scaffold",
  };
}

function mapOrg(raw: Record<string, unknown>): CivicOrganizationEntry {
  return {
    id: String(raw.id),
    name: String(raw.name),
    orgType: raw.org_type as CivicOrganizationEntry["orgType"],
    city: String(raw.city),
    county: String(raw.county),
    website: (raw.website as string) ?? null,
    verified: Boolean(raw.verified),
    lastVerified: (raw.last_verified as string) ?? null,
  };
}

function loadChurches(): ChurchDirectoryEntry[] {
  const b = churchBundle as { churches?: Record<string, unknown>[] };
  return (b.churches ?? []).map(mapChurch);
}

function loadSchools(): SchoolDirectoryEntry[] {
  const b = schoolBundle as { schools?: Record<string, unknown>[] };
  return (b.schools ?? []).map(mapSchool);
}

function loadColleges(): CollegeDirectoryEntry[] {
  const b = collegeBundle as { colleges?: Record<string, unknown>[] };
  return (b.colleges ?? []).map(mapCollege);
}

function loadOrganizations(): CivicOrganizationEntry[] {
  const b = orgBundle as { organizations?: Record<string, unknown>[] };
  return (b.organizations ?? []).map(mapOrg);
}

export function listChurches(county?: string, city?: string): ChurchDirectoryEntry[] {
  let list = loadChurches();
  if (county) list = list.filter((c) => c.county.toLowerCase() === county.replace(/\s+County$/i, "").toLowerCase());
  if (city) list = list.filter((c) => c.city.toLowerCase() === city.toLowerCase());
  return list;
}

export function listSchools(county?: string, city?: string): SchoolDirectoryEntry[] {
  let list = loadSchools();
  if (county) list = list.filter((s) => s.county.toLowerCase() === county.replace(/\s+County$/i, "").toLowerCase());
  if (city) list = list.filter((s) => s.city.toLowerCase() === city.toLowerCase());
  return list;
}

export function listColleges(county?: string): CollegeDirectoryEntry[] {
  let list = loadColleges();
  if (county) list = list.filter((c) => c.county.toLowerCase() === county.replace(/\s+County$/i, "").toLowerCase());
  return list;
}

export function listOrganizations(county?: string, orgType?: CivicOrganizationEntry["orgType"]): CivicOrganizationEntry[] {
  let list = loadOrganizations();
  if (county) list = list.filter((o) => o.county.toLowerCase() === county.replace(/\s+County$/i, "").toLowerCase());
  if (orgType) list = list.filter((o) => o.orgType === orgType);
  return list;
}

export function getChurchById(id: string): ChurchDirectoryEntry | undefined {
  return loadChurches().find((c) => c.id === id);
}

export function getSchoolById(id: string): SchoolDirectoryEntry | undefined {
  return loadSchools().find((s) => s.id === id);
}
