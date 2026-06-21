import seedBundle from "../../../data/student-service/seed-opportunities.json";
import type { ServiceCategory, StudentServiceInterest, StudentServiceOpportunity, VerificationStatus } from "./studentServiceTypes";
import { loadHostVolunteerSettings } from "../hosts/hostStore";
import { listPublicOrganizations } from "../organizations/publicOrganizationDirectory";
import type { CivicEvent } from "../types";

const VERIFIED_ENTITIES_KEY = "civic-cal-verified-entities";
const OPPORTUNITY_OVERRIDES_KEY = "civic-cal-student-service-overrides";
const INTEREST_KEY = "civic-cal-student-service-interest";

interface EntityRecord {
  organizationSlug: string;
  verified: boolean;
  studentServiceEligible: boolean;
  verificationStatus: VerificationStatus;
  signupUrl?: string | null;
  contactUrl?: string | null;
  notes?: string | null;
}

interface OpportunityOverride {
  id?: string;
  verificationStatus?: VerificationStatus;
  verifiedEntity?: boolean;
  studentServiceEligible?: boolean;
}

function loadEntityRecords(): Record<string, EntityRecord> {
  try {
    const raw = localStorage.getItem(VERIFIED_ENTITIES_KEY);
    if (raw) return JSON.parse(raw) as Record<string, EntityRecord>;
  } catch (_) {}
  return {};
}

function saveEntityRecords(records: Record<string, EntityRecord>): void {
  localStorage.setItem(VERIFIED_ENTITIES_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent("civic-student-service-updated"));
}

function loadOverrides(): Record<string, OpportunityOverride> {
  try {
    const raw = localStorage.getItem(OPPORTUNITY_OVERRIDES_KEY);
    if (raw) return JSON.parse(raw) as Record<string, OpportunityOverride>;
  } catch (_) {}
  return {};
}

function saveOverrides(overrides: Record<string, OpportunityOverride>): void {
  localStorage.setItem(OPPORTUNITY_OVERRIDES_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new CustomEvent("civic-student-service-updated"));
}

function mapSeed(o: (typeof seedBundle.opportunities)[0]): StudentServiceOpportunity {
  return {
    id: o.id,
    title: o.title,
    description: o.description ?? null,
    city: o.city ?? null,
    county: o.county,
    serviceCategory: o.service_category as ServiceCategory,
    eligibleGrades: o.eligible_grades ?? "9-12",
    estimatedHours: o.estimated_hours ?? null,
    recurring: o.recurring ?? false,
    verifiedEntity: o.verified_entity,
    verificationStatus: o.verification_status as VerificationStatus,
    organizationSlug: o.organization_slug ?? null,
    signupUrl: o.signup_url ?? null,
    contactUrl: o.contact_url ?? null,
    sourceUrl: o.source_url ?? null,
    notes: o.notes ?? null,
  };
}

function inferCategoryFromEvent(e: CivicEvent): ServiceCategory {
  const text = `${e.title} ${e.description ?? ""}`.toLowerCase();
  if (/library/i.test(text)) return "library";
  if (/food bank|pantry/i.test(text)) return "food_pantry";
  if (/5k|10k|marathon|race/i.test(text)) return "race_volunteer";
  if (/festival|fair/i.test(text)) return "festival_volunteer";
  if (/vfd|fire department|pancake/i.test(text)) return "vfd_fundraiser";
  if (/church|fish fry|spaghetti|meal/i.test(text)) return "church_community_meal";
  if (/4-h|extension/i.test(text)) return "four_h_extension";
  if (/cleanup|trail/i.test(text)) return "cleanup";
  if (/school|pta/i.test(text)) return "school_event";
  return "civic_organization";
}

export function isOrganizationVerified(slug: string): boolean {
  const rec = loadEntityRecords()[slug];
  return rec?.verified === true && rec.verificationStatus === "verified";
}

export function isOrganizationStudentServiceEligible(slug: string): boolean {
  const rec = loadEntityRecords()[slug];
  return isOrganizationVerified(slug) && rec.studentServiceEligible !== false;
}

export function setOrganizationVerification(
  slug: string,
  patch: Partial<EntityRecord> & { organizationSlug?: never },
): void {
  const records = loadEntityRecords();
  records[slug] = {
    organizationSlug: slug,
    verified: patch.verified ?? records[slug]?.verified ?? false,
    studentServiceEligible: patch.studentServiceEligible ?? records[slug]?.studentServiceEligible ?? false,
    verificationStatus: patch.verificationStatus ?? records[slug]?.verificationStatus ?? "needs_review",
    signupUrl: patch.signupUrl ?? records[slug]?.signupUrl,
    contactUrl: patch.contactUrl ?? records[slug]?.contactUrl,
    notes: patch.notes ?? records[slug]?.notes,
  };
  saveEntityRecords(records);
}

export function setOpportunityOverride(id: string, patch: OpportunityOverride): void {
  const overrides = loadOverrides();
  overrides[id] = { ...overrides[id], ...patch, id };
  saveOverrides(overrides);
}

export function listAllOpportunities(): StudentServiceOpportunity[] {
  const overrides = loadOverrides();
  const seed = seedBundle.opportunities.map(mapSeed).map((o) => {
    const ov = overrides[o.id];
    return ov ? { ...o, ...ov, verificationStatus: ov.verificationStatus ?? o.verificationStatus, verifiedEntity: ov.verifiedEntity ?? o.verifiedEntity } : o;
  });
  return seed;
}

export function buildOpportunitiesFromEvents(events: CivicEvent[]): StudentServiceOpportunity[] {
  const out: StudentServiceOpportunity[] = [];
  for (const e of events) {
    const host = loadHostVolunteerSettings(e.id);
    if (!host?.studentServiceEligible || !host.advertisePublicly) continue;
    const orgSlug = host.organizationSlug ?? null;
    const verified = orgSlug ? isOrganizationStudentServiceEligible(orgSlug) : host.verifiedEntity === true;
    if (!verified) continue;
    out.push({
      id: `event-${e.id}`,
      eventId: e.id,
      organizationSlug: orgSlug,
      title: e.title,
      description: e.description ?? host.roleSummary ?? null,
      city: e.city ?? null,
      county: e.county,
      serviceCategory: (host.serviceCategory as ServiceCategory) ?? inferCategoryFromEvent(e),
      eligibleGrades: "9-12",
      estimatedHours: host.estimatedServiceHours ?? null,
      recurring: e.isRecurring ?? false,
      verifiedEntity: true,
      verificationStatus: "verified",
      signupUrl: host.volunteerSignupUrl ?? null,
      contactUrl: null,
      sourceUrl: e.websiteUrl ?? null,
    });
  }
  return out;
}

export interface OpportunityFilters {
  county?: string;
  city?: string;
  category?: ServiceCategory;
  minHours?: number;
  verifiedOnly?: boolean;
}

export function listPublicStudentServiceOpportunities(
  events: CivicEvent[],
  filters: OpportunityFilters = {},
): StudentServiceOpportunity[] {
  let list = [...listAllOpportunities(), ...buildOpportunitiesFromEvents(events)];
  list = list.filter((o) => o.verifiedEntity && o.verificationStatus === "verified");

  if (filters.county) list = list.filter((o) => o.county.toLowerCase() === filters.county!.toLowerCase());
  if (filters.city) list = list.filter((o) => o.city?.toLowerCase().includes(filters.city!.toLowerCase()));
  if (filters.category) list = list.filter((o) => o.serviceCategory === filters.category);
  if (filters.minHours != null) list = list.filter((o) => (o.estimatedHours ?? 0) >= filters.minHours!);
  if (filters.verifiedOnly !== false) list = list.filter((o) => o.verifiedEntity);

  return list;
}

export function listPendingVerificationOpportunities(events: CivicEvent[]): StudentServiceOpportunity[] {
  const seed = seedBundle.opportunities.map(mapSeed).filter((o) => o.verificationStatus === "needs_review");
  const fromEvents = buildOpportunitiesFromEvents(events);
  return [...seed, ...fromEvents.filter((o) => o.verificationStatus !== "verified")];
}

export function listVerifiedEntities(): EntityRecord[] {
  return Object.values(loadEntityRecords()).filter((r) => r.verified);
}

export function listOrganizationsRequestingEligibility(): { slug: string; name: string; county: string }[] {
  const records = loadEntityRecords();
  return listPublicOrganizations()
    .filter((o) => {
      const rec = records[o.slug];
      return rec && !rec.verified && rec.studentServiceEligible;
    })
    .map((o) => ({ slug: o.slug, name: o.name, county: o.county }));
}

export function countiesWithServiceGaps(events: CivicEvent[]): string[] {
  const covered = new Set(listPublicStudentServiceOpportunities(events).map((o) => o.county.toLowerCase()));
  const allCounties = new Set(events.map((e) => e.county.toLowerCase()));
  return [...allCounties].filter((c) => !covered.has(c));
}

export function saveStudentServiceInterest(input: Omit<StudentServiceInterest, "id" | "status" | "createdAt">): void {
  const list = loadStudentServiceInterests();
  list.push({
    ...input,
    id: `interest-${Date.now()}`,
    status: "submitted",
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(INTEREST_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("civic-student-service-updated"));
}

export function loadStudentServiceInterests(): StudentServiceInterest[] {
  try {
    const raw = localStorage.getItem(INTEREST_KEY);
    if (raw) return JSON.parse(raw) as StudentServiceInterest[];
  } catch (_) {}
  return [];
}

export function getEventStudentServiceOpportunity(event: CivicEvent): StudentServiceOpportunity | null {
  const built = buildOpportunitiesFromEvents([event]);
  return built[0] ?? null;
}

export function opportunitiesForCounty(county: string, events: CivicEvent[]): StudentServiceOpportunity[] {
  return listPublicStudentServiceOpportunities(events, { county });
}

export function opportunitiesForOrganization(orgSlug: string, events: CivicEvent[]): StudentServiceOpportunity[] {
  return listPublicStudentServiceOpportunities(events).filter((o) => o.organizationSlug === orgSlug);
}
