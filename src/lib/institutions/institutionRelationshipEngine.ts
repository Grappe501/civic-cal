import { differenceInDays, parseISO } from "date-fns";
import type { CivicEvent } from "../types";
import type { CampaignEventPlan } from "../campaigns/types";
import { listChurches, listOrganizations, listSchools } from "./registry";
import { listExtensionOffices, listHomemakerClubs } from "./communityAnchorsRegistry";
import { loadTouchpoints } from "./institutionRelationshipStore";
import type {
  InstitutionRelationKind,
  InstitutionRelationshipStatus,
  RelationshipScoreLabel,
} from "./institutionRelationshipTypes";
import { INSTITUTION_KIND_LABELS } from "./institutionRelationshipTypes";

const KIND_PATTERNS: Record<InstitutionRelationKind, RegExp> = {
  rotary: /rotary/i,
  naacp: /naacp/i,
  farm_bureau: /farm bureau/i,
  vfw: /\bvfw\b|veterans of foreign wars/i,
  chamber: /chamber of commerce|chamber breakfast/i,
  church: /church|fish fry|spaghetti|parish|faith meal/i,
  school_district: /school board|pta|booster|homecoming|graduation/i,
  library: /library/i,
  vfd: /volunteer fire|vfd|fire department/i,
  lions: /lions club/i,
  kiwanis: /kiwanis/i,
  ffa: /\bffa\b/i,
  extension_office: /cooperative extension|extension office|4-h|master gardener|livestock show/i,
  homemakers: /homemaker|extension homemaker|eh club|home demonstration/i,
};

function scoreLabel(score: number): RelationshipScoreLabel {
  if (score >= 65) return "strong";
  if (score >= 35) return "developing";
  return "low";
}

function computeScore(eventsAttended: number, lastAttendedAt?: string): number {
  if (eventsAttended === 0) return 10;
  let score = Math.min(50, eventsAttended * 18);
  if (lastAttendedAt) {
    const days = differenceInDays(new Date(), parseISO(lastAttendedAt));
    if (days <= 90) score += 35;
    else if (days <= 365) score += 20;
    else if (days <= 730) score += 8;
    else score -= 15;
  }
  return Math.max(0, Math.min(100, score));
}

function recommend(kind: InstitutionRelationKind, score: number, eventsAttended: number, lastAttendedAt?: string): string | undefined {
  if (score >= 65) return undefined;
  const days = lastAttendedAt ? differenceInDays(new Date(), parseISO(lastAttendedAt)) : 9999;
  const label = INSTITUTION_KIND_LABELS[kind];
  if (days > 730) return `Last attended 2+ years ago — attend next ${label} breakfast or meeting`;
  if (eventsAttended === 0) return `No recorded presence — identify next ${label} event in county`;
  return `Attend next ${label} gathering to strengthen relationship`;
}

function inferKindFromEvent(event: CivicEvent): InstitutionRelationKind | null {
  const text = `${event.title} ${event.description ?? ""} ${event.hostOrganization ?? ""}`;
  for (const [kind, pattern] of Object.entries(KIND_PATTERNS) as [InstitutionRelationKind, RegExp][]) {
    if (pattern.test(text)) return kind;
  }
  if (event.category === "faith_meal" || event.category === "community_church") return "church";
  if (event.category === "school") return "school_district";
  return null;
}

interface InstitutionSeed {
  institutionId: string;
  institutionName: string;
  kind: InstitutionRelationKind;
  county: string;
  city?: string;
}

function seedInstitutionsForCounties(counties: string[]): InstitutionSeed[] {
  const seeds: InstitutionSeed[] = [];
  for (const county of counties) {
    for (const c of listChurches(county).slice(0, 3)) {
      seeds.push({ institutionId: c.id, institutionName: c.churchName, kind: "church", county: c.county, city: c.city });
    }
    for (const s of listSchools(county).slice(0, 2)) {
      seeds.push({ institutionId: s.id, institutionName: s.schoolName, kind: "school_district", county: s.county, city: s.city });
    }
    for (const o of listOrganizations(county)) {
      const kindMap: Partial<Record<string, InstitutionRelationKind>> = {
        rotary: "rotary",
        lions: "lions",
        kiwanis: "kiwanis",
        farm_bureau: "farm_bureau",
        chamber: "chamber",
        library: "library",
        vfd: "vfd",
      };
      const kind = kindMap[o.orgType];
      if (kind) seeds.push({ institutionId: o.id, institutionName: o.name, kind, county: o.county, city: o.city });
    }
    seeds.push({ institutionId: `naacp-${county}`, institutionName: `${county} NAACP chapter — verify`, kind: "naacp", county });
    seeds.push({ institutionId: `vfw-${county}`, institutionName: `${county} VFW — verify`, kind: "vfw", county });
    for (const ext of listExtensionOffices(county).slice(0, 1)) {
      seeds.push({ institutionId: ext.id, institutionName: ext.officeName, kind: "extension_office", county: ext.county });
    }
    for (const eh of listHomemakerClubs(county).slice(0, 2)) {
      seeds.push({ institutionId: eh.id, institutionName: eh.clubName, kind: "homemakers", county: eh.county, city: eh.city ?? undefined });
    }
  }
  return seeds;
}

export function buildInstitutionRelationships(
  workspaceSlug: string,
  counties: string[],
  communityEvents: CivicEvent[],
  plans: Record<string, CampaignEventPlan>,
): InstitutionRelationshipStatus[] {
  const touchpoints = loadTouchpoints(workspaceSlug);
  const seeds = seedInstitutionsForCounties(counties);
  const byId = new Map<string, InstitutionRelationshipStatus>();

  for (const seed of seeds) {
    byId.set(seed.institutionId, {
      institutionId: seed.institutionId,
      institutionName: seed.institutionName,
      kind: seed.kind,
      county: seed.county,
      city: seed.city,
      eventsAttended: 0,
      relationshipScore: 10,
      scoreLabel: "low",
    });
  }

  for (const tp of touchpoints) {
    const row = byId.get(tp.institutionId) ?? {
      institutionId: tp.institutionId,
      institutionName: tp.institutionName,
      kind: tp.kind,
      county: tp.county,
      city: tp.city,
      eventsAttended: 0,
      relationshipScore: 10,
      scoreLabel: "low" as const,
    };
    row.eventsAttended += 1;
    if (!row.lastAttendedAt || tp.attendedAt > row.lastAttendedAt) {
      row.lastAttendedAt = tp.attendedAt;
      row.lastEventTitle = tp.eventTitle;
    }
    byId.set(tp.institutionId, row);
  }

  for (const ev of communityEvents) {
    const plan = plans[ev.id];
    if (!plan || !["attending", "candidate_should_attend", "surrogate_should_attend"].includes(plan.planStatus)) continue;
    const kind = inferKindFromEvent(ev);
    if (!kind) continue;
    const match = [...byId.values()].find((r) => r.kind === kind && r.county === ev.county);
    if (match) {
      match.eventsAttended += 1;
      const at = ev.startAt.slice(0, 10);
      if (!match.lastAttendedAt || at > match.lastAttendedAt) {
        match.lastAttendedAt = at;
        match.lastEventTitle = ev.title;
      }
      byId.set(match.institutionId, match);
    }
  }

  return [...byId.values()]
    .map((row) => {
      const relationshipScore = computeScore(row.eventsAttended, row.lastAttendedAt);
      return {
        ...row,
        relationshipScore,
        scoreLabel: scoreLabel(relationshipScore),
        recommendedAction: recommend(row.kind, relationshipScore, row.eventsAttended, row.lastAttendedAt),
      };
    })
    .sort((a, b) => a.relationshipScore - b.relationshipScore);
}

export function institutionsNeedingAttention(statuses: InstitutionRelationshipStatus[], limit = 8): InstitutionRelationshipStatus[] {
  return statuses.filter((s) => s.scoreLabel === "low" || s.relationshipScore < 40).slice(0, limit);
}
