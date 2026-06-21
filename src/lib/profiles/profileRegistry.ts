import traditionsBundle from "../../../data/ingestion/recurring-events-registry.json";
import { getBundledSeedEvents } from "../events/seedCatalog";
import studentBundle from "../../../data/student-service/seed-opportunities.json";
import { defaultFreshness } from "../freshness/freshnessTypes";
import { confidenceFromAge } from "../freshness/staleData";
import { listAllStateDates } from "../state-dates/stateDatesRegistry";
import { listCityDossiers, listCountyDossiers } from "../local-intelligence/registry";
import {
  getOrganizationBySlug,
  listPublicOrganizations,
  organizationPublicSlug,
} from "../organizations/publicOrganizationDirectory";
import { listCampaignWorkspaces } from "../campaigns/workspaces";
import countyFairRegistry from "../../../data/fairs/arkansas-county-fair-registry.json";
import type { CivicEvent } from "../types";
import type { CommunityProfile, ProfileEntityType, RelatedProfileLink } from "./profileTypes";
import {
  citySlugify,
  countySlugify,
  mergeRelated,
  profileCanonicalUrl,
  profilePath,
  relatedLink,
  traditionSlug,
} from "./profileLinks";

let cache: CommunityProfile[] | null = null;

function orgFreshness(verified: boolean, sourceLinks: { url: string; label?: string }[] = [], lastVerified?: string | null) {
  const links = sourceLinks.filter((s) => s.url).map((s) => ({ label: s.label ?? "Source", url: s.url }));
  const refreshed = lastVerified ?? traditionsBundle.updatedAt ?? new Date().toISOString().slice(0, 10);
  const confidence = verified && links.length > 0 ? confidenceFromAge(refreshed, links.length) : "placeholder";
  return defaultFreshness({
    dataAsOf: refreshed,
    lastRefreshedAt: refreshed,
    sourceConfidence: confidence,
    sourceCount: links.length,
    sourceLinks: links,
    verificationStatus: verified ? "verified" : "placeholder",
    refreshNeeded: !verified || links.length === 0,
    refreshNotes: verified ? null : "Directory scaffold — confirm with congregation or official site.",
  });
}

function buildOrgProfiles(): CommunityProfile[] {
  return listPublicOrganizations().map((org) => {
    const entityType: ProfileEntityType =
      org.hostType === "church"
        ? "church"
        : org.hostType === "school"
          ? "school"
          : org.hostType === "college"
            ? "college"
            : "organization";

    const related: RelatedProfileLink[] = mergeRelated([
      ...(org.city ? [relatedLink("city", citySlugify(org.city), org.city)] : []),
      relatedLink("county", `${countySlugify(org.county)}-county`, `${org.county} County`),
      relatedLink("organization", org.slug, org.name, "Full organization profile"),
    ]);

    const summary = org.description ?? `${org.name} in ${org.city ? `${org.city}, ` : ""}${org.county} County, Arkansas.`;
    return {
      slug: org.slug,
      title: org.name.replace(/\s*—\s*verify.*$/i, ""),
      entityType,
      city: org.city,
      county: org.county,
      canonicalUrl: profileCanonicalUrl(entityType, org.slug),
      summary,
      aiSummary: `${summary} Community organization profile on Arkansas Everywhere. Related events and volunteer opportunities may appear when sourced.`,
      relatedLinks: related,
      freshness: orgFreshness(org.verified, [], null),
      organizationSlug: org.slug,
    };
  });
}

function buildGeoProfiles(): CommunityProfile[] {
  const profiles: CommunityProfile[] = [];
  for (const c of listCityDossiers()) {
    const slug = citySlugify(c.city);
    profiles.push({
      slug,
      title: `${c.city}, Arkansas`,
      entityType: "city",
      city: c.city,
      county: c.county,
      canonicalUrl: profileCanonicalUrl("city", slug),
      summary: c.opportunityNotes ?? `Community calendar and local anchors for ${c.city}, ${c.county} County.`,
      aiSummary: `City community profile for ${c.city} in ${c.county} County, Arkansas. Includes events, organizations, and local intelligence where sourced.`,
      relatedLinks: mergeRelated([
        relatedLink("county", `${countySlugify(c.county)}-county`, `${c.county} County`),
      ]),
      freshness: defaultFreshness({
        sourceConfidence: "medium",
        sourceCount: 1,
        verificationStatus: "needs_review",
        refreshNeeded: true,
        refreshNotes: "City dossier partially sourced — expand with official city data.",
      }),
    });
  }
  for (const c of listCountyDossiers()) {
    const slug = `${countySlugify(c.county)}-county`;
    profiles.push({
      slug,
      title: `${c.county} County, Arkansas`,
      entityType: "county",
      county: c.county,
      canonicalUrl: profileCanonicalUrl("county", slug),
      summary: c.demographicsSummary ?? `County-wide community calendar for ${c.county} County, Arkansas.`,
      aiSummary: `County community intelligence for ${c.county} County, Arkansas — events, cities, institutions, and traditions where verified.`,
      relatedLinks: [],
      freshness: defaultFreshness({
        sourceConfidence: "medium",
        sourceCount: 1,
        verificationStatus: "needs_review",
        refreshNeeded: true,
      }),
    });
  }
  return profiles;
}

function buildTraditionProfiles(): CommunityProfile[] {
  return (traditionsBundle.traditions ?? []).map((t) => {
    const slug = traditionSlug(t.id);
    const isParade = /parade/i.test(t.event_name);
    const entityType: ProfileEntityType = isParade ? "parade" : "festival";
    const links = t.source_url ? [{ label: t.source_name ?? "Official source", url: t.source_url }] : [];
    return {
      slug,
      title: t.event_name,
      entityType,
      city: t.city,
      county: t.county,
      canonicalUrl: profileCanonicalUrl(entityType, slug),
      summary: t.notes ?? `Recurring Arkansas ${entityType} tradition in ${t.city}, ${t.county} County. Confirm dates annually.`,
      aiSummary: `${t.event_name} is a recurring community tradition in ${t.city}, ${t.county} County, Arkansas. Dates should be verified each year from official sources.`,
      relatedLinks: mergeRelated([
        ...(t.city ? [relatedLink("city", citySlugify(t.city), t.city)] : []),
        relatedLink("county", `${countySlugify(t.county ?? "arkansas")}-county`, `${t.county ?? "Arkansas"} County`),
      ]),
      freshness: defaultFreshness({
        dataAsOf: traditionsBundle.updatedAt,
        lastRefreshedAt: traditionsBundle.updatedAt,
        sourceConfidence: links.length ? "medium" : "placeholder",
        sourceCount: links.length,
        sourceLinks: links,
        verificationStatus: links.length ? "needs_review" : "placeholder",
        refreshNeeded: true,
        refreshNotes: "Tradition registry entry — confirm dates yearly.",
      }),
    };
  });
}

function buildEventDerivedProfiles(events: CivicEvent[]): CommunityProfile[] {
  const profiles: CommunityProfile[] = [];
  for (const e of events) {
    const text = `${e.title} ${e.description ?? ""}`;
    if (/5k|10k|marathon|turkey trot|fun run|race/i.test(text)) {
      profiles.push({
        slug: e.slug,
        title: e.title,
        entityType: "race",
        city: e.city,
        county: e.county,
        canonicalUrl: profileCanonicalUrl("race", e.slug),
        summary: e.description ?? `${e.title} — community race in ${e.city ?? e.county} County, Arkansas.`,
        aiSummary: `Race event profile linked to calendar listing ${e.title}.`,
        relatedLinks: mergeRelated([
          relatedLink("event", e.slug, "Event details"),
          ...(e.city ? [relatedLink("city", citySlugify(e.city), e.city)] : []),
        ]),
        freshness: defaultFreshness({
          sourceConfidence: e.source === "demo_seed" ? "placeholder" : "medium",
          verificationStatus: e.source === "demo_seed" ? "placeholder" : "needs_review",
          refreshNeeded: e.source === "demo_seed",
          refreshNotes: e.source === "demo_seed" ? "Demo seed event." : undefined,
        }),
        sourceEventSlug: e.slug,
      });
    }
    if (/parade/i.test(text) && !profiles.some((p) => p.slug === e.slug && p.entityType === "parade")) {
      profiles.push({
        slug: e.slug,
        title: e.title,
        entityType: "parade",
        city: e.city,
        county: e.county,
        canonicalUrl: profileCanonicalUrl("parade", e.slug),
        summary: e.description ?? `${e.title} — community parade in Arkansas.`,
        aiSummary: `Parade event profile for ${e.title}.`,
        relatedLinks: [relatedLink("event", e.slug, "Event details")],
        freshness: defaultFreshness({ sourceConfidence: "medium", verificationStatus: "needs_review" }),
        sourceEventSlug: e.slug,
      });
    }
    if (
      /festival|fair\b|rodeo|watermelon|peach|tomato|grape|crawdad|gumbo|folklife|scotsfest|toad suck|beanfest|picklefest/i.test(text) &&
      !profiles.some((p) => p.slug === e.slug && p.entityType === "festival")
    ) {
      const links = e.websiteUrl || e.source ? [{ label: "Official source", url: String(e.websiteUrl || e.source) }] : [];
      profiles.push({
        slug: e.slug,
        title: e.title,
        entityType: "festival",
        city: e.city,
        county: e.county,
        canonicalUrl: profileCanonicalUrl("festival", e.slug),
        summary: e.description ?? `${e.title} — Arkansas fair or festival in ${e.city ?? e.county} County.`,
        aiSummary: `Festival profile for ${e.title}. Dates sourced from official pages when available.`,
        relatedLinks: mergeRelated([
          relatedLink("event", e.slug, "Event details"),
          ...(e.city ? [relatedLink("city", citySlugify(e.city), e.city)] : []),
        ]),
        freshness: defaultFreshness({
          sourceConfidence: e.id.startsWith("fest-harvest-") ? "high" : "medium",
          sourceCount: links.length,
          sourceLinks: links,
          verificationStatus: e.id.startsWith("fest-harvest-") ? "verified" : "needs_review",
          refreshNeeded: !e.id.startsWith("fest-harvest-"),
        }),
        sourceEventSlug: e.slug,
      });
    }
  }
  return profiles;
}

function buildStateDateProfiles(): CommunityProfile[] {
  return listAllStateDates(true).map((d) => ({
    slug: d.id,
    title: d.title,
    entityType: "state_date" as const,
    city: d.city,
    county: d.county,
    canonicalUrl: profileCanonicalUrl("state_date", d.id),
    summary: d.notes ?? `Important Arkansas date: ${d.title}.`,
    aiSummary: `Statewide or regional important date: ${d.title}. Sourced from ${d.sourceName}.`,
    relatedLinks: mergeRelated([
      relatedLink("state_date", d.id, d.title),
      ...(d.county ? [relatedLink("county", `${countySlugify(d.county)}-county`, `${d.county} County`)] : []),
    ]),
    freshness: defaultFreshness({
      dataAsOf: d.date,
      lastRefreshedAt: registryUpdated(),
      sourceConfidence: d.verificationStatus === "verified" ? "high" : "medium",
      sourceCount: 1,
      sourceLinks: [{ label: d.sourceName, url: d.sourceUrl }],
      verificationStatus: d.verificationStatus === "verified" ? "verified" : "needs_review",
      refreshNeeded: d.verificationStatus !== "verified",
    }),
  }));
}

function registryUpdated(): string {
  return traditionsBundle.updatedAt ?? new Date().toISOString().slice(0, 10);
}

function buildCandidateProfiles(): CommunityProfile[] {
  return listCampaignWorkspaces().map((ws) => ({
    slug: ws.slug,
    title: ws.candidateName,
    entityType: "candidate" as const,
    county: ws.counties[0] ?? null,
    city: ws.cities[0] ?? null,
    canonicalUrl: profileCanonicalUrl("candidate", ws.slug),
    summary: `${ws.candidateName} — ${ws.officeSought}. Campaign workspace on Arkansas Everywhere (community calendar context, not an endorsement).`,
    aiSummary: `Public candidate profile for ${ws.candidateName}, ${ws.officeSought}. Links to community events and campaign workspace tools.`,
    relatedLinks: mergeRelated([
      relatedLink("candidate", ws.slug, ws.candidateName),
      ...(ws.campaignWebsiteUrl
        ? [{ slug: ws.slug, title: "Official campaign site", entityType: "candidate" as const, href: ws.campaignWebsiteUrl, note: "External" }]
        : []),
    ]),
    freshness: defaultFreshness({
      sourceConfidence: ws.campaignWebsiteUrl ? "medium" : "placeholder",
      sourceCount: ws.campaignWebsiteUrl ? 1 : 0,
      sourceLinks: ws.campaignWebsiteUrl ? [{ label: "Campaign website", url: ws.campaignWebsiteUrl }] : [],
      verificationStatus: "needs_review",
      refreshNotes: "Candidate branding from public campaign site when available.",
    }),
  }));
}

function buildCountyFairProfiles(): CommunityProfile[] {
  const fairs = (countyFairRegistry as { fairs?: Record<string, unknown>[] }).fairs ?? [];
  return fairs
    .filter((f) => !f.is_regional_fair && !f.is_state_fair)
    .map((f) => {
      const slug = String(f.id || `${countySlugify(String(f.county))}-county-fair`);
      const links = [f.official_url, f.cofairs_url, f.source_url].filter(Boolean).map((url) => ({
        label: String(url).includes("cofairs.com") ? "Fair guide listing" : "Official source",
        url: String(url),
      }));
      const verified = f.verification_status === "verified_dated";
      return {
        slug,
        title: String(f.fair_name ?? `${f.county} County Fair`),
        entityType: "festival" as const,
        city: (f.city as string) ?? null,
        county: String(f.county),
        canonicalUrl: profileCanonicalUrl("festival", slug),
        summary:
          verified && f.date_start
            ? `${f.fair_name} — ${f.date_start}${f.date_end && f.date_end !== f.date_start ? ` to ${f.date_end}` : ""} (source-backed). Confirm details annually.`
            : `${f.fair_name} in ${f.county} County, Arkansas — dates need confirmation from official sources.`,
        aiSummary: `County fair profile for ${f.county} County, Arkansas. ${verified ? "2026 dates sourced from public pages." : "Research task open until official dates verified."}`,
        relatedLinks: mergeRelated([
          ...(f.city ? [relatedLink("city", citySlugify(String(f.city)), String(f.city))] : []),
          relatedLink("county", `${countySlugify(String(f.county))}-county`, `${f.county} County`),
        ]),
        freshness: defaultFreshness({
          dataAsOf: (f.date_start as string) ?? undefined,
          lastRefreshedAt: (f.information_last_refreshed as string) ?? undefined,
          sourceConfidence: verified ? "high" : links.length ? "medium" : "placeholder",
          sourceCount: links.length,
          sourceLinks: links,
          verificationStatus: verified ? "verified" : "needs_review",
          refreshNeeded: !verified,
          refreshNotes: verified ? null : "Confirm fair dates from official county fair or fairgrounds page.",
        }),
      };
    });
}

function buildStateAndRegionalFairProfiles(): CommunityProfile[] {
  const fairs = (countyFairRegistry as { fairs?: Record<string, unknown>[] }).fairs ?? [];
  return fairs
    .filter((f) => f.is_regional_fair || f.is_state_fair)
    .map((f) => {
      const slug = String(f.id);
      const verified = f.verification_status === "verified_dated";
      const links = [f.official_url, f.cofairs_url, f.source_url].filter(Boolean).map((url) => ({
        label: "Source",
        url: String(url),
      }));
      return {
        slug,
        title: String(f.fair_name),
        entityType: "festival" as const,
        city: (f.city as string) ?? null,
        county: String(f.county),
        canonicalUrl: profileCanonicalUrl("festival", slug),
        summary: `${f.fair_name} — ${verified ? "dated from public source" : "dates need confirmation"}.`,
        aiSummary: `Regional or state fair profile for Arkansas.`,
        relatedLinks: mergeRelated([
          relatedLink("county", `${countySlugify(String(f.county))}-county`, `${f.county} County`),
        ]),
        freshness: defaultFreshness({
          sourceConfidence: verified ? "high" : "medium",
          sourceCount: links.length,
          sourceLinks: links,
          verificationStatus: verified ? "verified" : "needs_review",
          refreshNeeded: !verified,
        }),
      };
    });
}

function buildVolunteerProfiles(): CommunityProfile[] {
  const opps = (studentBundle as { opportunities?: Record<string, unknown>[] }).opportunities ?? [];
  return opps.map((raw) => {
    const o = raw as Record<string, unknown>;
    const id = String(o.id);
    const title = String(o.title ?? "Volunteer opportunity");
    return {
      slug: id,
      title,
      entityType: "volunteer_opportunity" as const,
      city: (o.city as string) ?? null,
      county: String(o.county ?? "Unknown"),
      canonicalUrl: profileCanonicalUrl("volunteer_opportunity", id),
      summary: String(o.description ?? `Verified student-service eligible volunteer opportunity in Arkansas.`),
      aiSummary: `Volunteer opportunity profile: ${title}. Student-service eligible when verified.`,
      relatedLinks: [relatedLink("volunteer_opportunity", id, title)],
      freshness: defaultFreshness({
        sourceConfidence: o.verification_status === "verified" ? "high" : "placeholder",
        verificationStatus: o.verification_status === "verified" ? "verified" : "placeholder",
        sourceCount: o.source_url || o.signup_url || o.contact_url ? 1 : 0,
        sourceLinks: o.source_url
          ? [{ label: "Official source", url: String(o.source_url) }]
          : o.signup_url
            ? [{ label: "Signup", url: String(o.signup_url) }]
            : o.contact_url
              ? [{ label: "Contact", url: String(o.contact_url) }]
              : [],
      }),
    };
  });
}

export function buildProfileRegistry(): CommunityProfile[] {
  if (cache) return cache;
  const events = getBundledSeedEvents();
  const all = [
    ...buildOrgProfiles(),
    ...buildGeoProfiles(),
    ...buildTraditionProfiles(),
    ...buildEventDerivedProfiles(events),
    ...buildCountyFairProfiles(),
    ...buildStateAndRegionalFairProfiles(),
    ...buildStateDateProfiles(),
    ...buildCandidateProfiles(),
    ...buildVolunteerProfiles(),
  ];

  const byKey = new Map<string, CommunityProfile>();
  for (const p of all) {
    byKey.set(`${p.entityType}:${p.slug}`, p);
  }
  cache = [...byKey.values()];
  return cache;
}

export function listProfiles(entityType?: ProfileEntityType): CommunityProfile[] {
  const all = buildProfileRegistry();
  return entityType ? all.filter((p) => p.entityType === entityType) : all;
}

export function getProfile(slug: string, entityType?: ProfileEntityType): CommunityProfile | null {
  const all = buildProfileRegistry();
  if (entityType) {
    return all.find((p) => p.slug === slug && p.entityType === entityType) ?? null;
  }
  return all.find((p) => p.slug === slug) ?? null;
}

export function getProfileForTypedRoute(entityType: ProfileEntityType, slug: string): CommunityProfile | null {
  const direct = getProfile(slug, entityType);
  if (direct) return direct;

  if (entityType === "church" || entityType === "school" || entityType === "college" || entityType === "organization") {
    const org = getOrganizationBySlug(slug);
    if (!org) return null;
    const mapped =
      org.hostType === "church"
        ? "church"
        : org.hostType === "school"
          ? "school"
          : org.hostType === "college"
            ? "college"
            : "organization";
    if (mapped !== entityType && entityType !== "organization") {
      return getProfile(slug, mapped);
    }
    return getProfile(slug, mapped) ?? getProfile(slug, "organization");
  }

  if (entityType === "race" || entityType === "parade" || entityType === "festival") {
    return getProfile(slug, entityType) ?? getProfile(slug);
  }

  return null;
}

export function enrichRelatedLinks(profile: CommunityProfile, extra: RelatedProfileLink[]): CommunityProfile {
  return { ...profile, relatedLinks: mergeRelated([...profile.relatedLinks, ...extra]) };
}

export function invalidateProfileCache(): void {
  cache = null;
}

/** Sitemap / SEO: all canonical profile URLs */
export function allProfilePaths(): { loc: string; entityType: ProfileEntityType }[] {
  return buildProfileRegistry().map((p) => ({
    loc: profilePath(p.entityType, p.slug),
    entityType: p.entityType,
  }));
}

export { organizationPublicSlug };
