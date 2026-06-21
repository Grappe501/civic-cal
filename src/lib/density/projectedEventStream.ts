import traditionsBundle from "../../../data/ingestion/recurring-events-registry.json";
import studentBundle from "../../../data/student-service/seed-opportunities.json";
import discoveredSources from "../../../data/ingestion/discovered-sources/top-200-city-sources.json";
import { listExtensionOffices, listHomemakerClubs, listVfdAnchors } from "../institutions/communityAnchorsRegistry";
import { VFD_HARVEST_TARGETS } from "../institutions/communityAnchorTypes";
import { listChurches, listSchools, listColleges } from "../institutions/registry";
import { CHURCH_HARVEST_PATTERNS, SCHOOL_HARVEST_PATTERNS, COLLEGE_HARVEST_PATTERNS } from "./harvestPatterns";
import type { InstitutionEventProjection } from "./densityTypes";

function normCounty(county: string): string {
  return county.replace(/\s+County$/i, "").trim();
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function traditionsForCounty(county: string): number {
  const c = normCounty(county).toLowerCase();
  return (traditionsBundle.traditions ?? []).filter((t) => String(t.county ?? "").toLowerCase() === c).length;
}

export function volunteerOpportunitiesForCounty(county: string): number {
  const c = normCounty(county).toLowerCase();
  return ((studentBundle as { opportunities?: { county?: string }[] }).opportunities ?? []).filter(
    (o) => String(o.county ?? "").toLowerCase() === c,
  ).length;
}

export function sourceFeedsForCounty(county: string): number {
  const c = normCounty(county).toLowerCase();
  const cities = (discoveredSources as { cities?: { county?: string; source_templates?: unknown[] }[] }).cities ?? [];
  return cities.filter((city) => String(city.county ?? "").toLowerCase() === c && (city.source_templates?.length ?? 0) > 0).length;
}

export function buildInstitutionProjections(county: string): InstitutionEventProjection[] {
  const c = normCounty(county);
  const out: InstitutionEventProjection[] = [];

  for (const church of listChurches(c)) {
    const annual = church.annualEvents ?? [];
    const patterns =
      annual.length > 0
        ? annual
        : church.verified
          ? CHURCH_HARVEST_PATTERNS.slice(0, 3)
          : CHURCH_HARVEST_PATTERNS.slice(0, 2);

    for (const pattern of patterns) {
      out.push({
        id: `proj-church-${church.id}-${slug(pattern)}`,
        title: `${church.churchName.replace(/\s*—\s*verify.*$/i, "")} — ${pattern}`,
        county: c,
        city: church.city,
        institutionId: church.id,
        institutionType: "church",
        institutionName: church.churchName,
        recurrence: "annual",
        typicalMonth: null,
        harvestTarget: !church.verified,
        projectionStatus: church.verified ? "institution_verified" : "scaffold",
        sourceUrl: church.sourceLinks?.[0]?.url ?? church.website,
        notes: church.verified
          ? "Verified institution — confirm date from official source before publishing."
          : "Scaffold institution — harvest target only, not a confirmed event.",
      });
    }
  }

  for (const school of listSchools(c)) {
    const patterns = school.verified ? SCHOOL_HARVEST_PATTERNS : SCHOOL_HARVEST_PATTERNS.slice(0, 4);
    for (const pattern of patterns) {
      out.push({
        id: `proj-school-${school.id}-${slug(pattern)}`,
        title: `${school.schoolName.replace(/\s*—\s*verify.*$/i, "")} — ${pattern}`,
        county: c,
        city: school.city,
        institutionId: school.id,
        institutionType: "school",
        institutionName: school.schoolName,
        recurrence: pattern.includes("Board") ? "monthly" : "annual",
        harvestTarget: !school.verified,
        projectionStatus: school.verified ? "institution_verified" : "scaffold",
        sourceUrl: school.website,
        notes: "School calendar harvest target — verify before public listing.",
      });
    }
  }

  for (const college of listColleges(c)) {
    for (const pattern of COLLEGE_HARVEST_PATTERNS) {
      out.push({
        id: `proj-college-${college.id}-${slug(pattern)}`,
        title: `${college.institutionName} — ${pattern}`,
        county: c,
        city: college.city,
        institutionId: college.id,
        institutionType: "college",
        institutionName: college.institutionName,
        recurrence: "seasonal",
        harvestTarget: false,
        projectionStatus: "institution_verified",
        sourceUrl: college.campusCalendarUrl ?? college.sourceLinks?.[0]?.url ?? null,
        notes: "College activity feed — harvest from official athletics/events calendar.",
      });
    }
  }

  for (const t of (traditionsBundle.traditions ?? []).filter((tr) => String(tr.county ?? "").toLowerCase() === c.toLowerCase())) {
    out.push({
      id: `proj-tradition-${t.id}`,
      title: t.event_name,
      county: c,
      city: t.city ?? null,
      institutionId: t.id,
      institutionType: "festival",
      institutionName: t.event_name,
      recurrence: "annual",
      typicalMonth: t.typical_month ?? null,
      harvestTarget: false,
      projectionStatus: "verified_tradition",
      sourceUrl: t.source_url ?? null,
      notes: t.notes ?? "Recurring tradition — confirm date yearly.",
    });
  }

  for (const ext of listExtensionOffices(c)) {
    for (const target of ext.harvestTargets.slice(0, 6)) {
      out.push({
        id: `proj-ext-${ext.id}-${slug(target)}`,
        title: `${ext.officeName.replace(/\s*—\s*verify.*$/i, "")} — ${target}`,
        county: c,
        city: null,
        institutionId: ext.id,
        institutionType: "extension",
        institutionName: ext.officeName,
        recurrence: "seasonal",
        harvestTarget: true,
        projectionStatus: ext.verified ? "institution_verified" : "scaffold",
        sourceUrl: ext.calendarUrl ?? ext.website,
        notes: "Extension office harvest target — UAEX calendar.",
      });
    }
  }

  for (const club of listHomemakerClubs(c)) {
    out.push({
      id: `proj-ehc-${club.id}`,
      title: `${club.clubName.replace(/\s*—\s*verify.*$/i, "")} — Monthly meeting`,
      county: c,
      city: club.city ?? null,
      institutionId: club.id,
      institutionType: "organization",
      institutionName: club.clubName,
      recurrence: "monthly",
      harvestTarget: true,
      projectionStatus: "scaffold",
      sourceUrl: null,
      notes: "Extension Homemakers club — verify meeting schedule from county association.",
    });
  }

  for (const vfd of listVfdAnchors(c)) {
    for (const target of VFD_HARVEST_TARGETS.slice(0, 3)) {
      out.push({
        id: `proj-vfd-${vfd.id}-${slug(target)}`,
        title: `${vfd.name.replace(/\s*—\s*verify.*$/i, "")} — ${target}`,
        county: c,
        city: vfd.city,
        institutionId: vfd.id,
        institutionType: "vfd",
        institutionName: vfd.name,
        recurrence: "annual",
        harvestTarget: true,
        projectionStatus: "scaffold",
        sourceUrl: vfd.website,
        notes: "VFD fundraiser harvest target.",
      });
    }
  }

  return out;
}

export function projectedEventCountForCounty(county: string): number {
  return buildInstitutionProjections(county).length;
}

export function allProjections(): InstitutionEventProjection[] {
  const counties = new Set<string>();
  for (const ch of listChurches()) counties.add(normCounty(ch.county));
  for (const s of listSchools()) counties.add(normCounty(s.county));
  const all: InstitutionEventProjection[] = [];
  for (const county of counties) {
    all.push(...buildInstitutionProjections(county));
  }
  return all;
}
