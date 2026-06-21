import type { CommunityProfile, ProfileEntityType, RelatedProfileLink } from "./profileTypes";

const SITE = "https://arkansaseverywhere.org";

export function profilePath(entityType: ProfileEntityType, slug: string): string {
  switch (entityType) {
    case "event":
      return `/event/${slug}`;
    case "city":
      return `/${slug}`;
    case "county":
      return `/${slug}-county`;
    case "organization":
      return `/organization/${slug}`;
    case "church":
      return `/church/${slug}`;
    case "school":
      return `/school/${slug}`;
    case "college":
      return `/college/${slug}`;
    case "candidate":
      return `/candidate/${slug}`;
    case "host":
      return `/host`;
    case "race":
      return `/race/${slug}`;
    case "festival":
      return `/festival/${slug}`;
    case "parade":
      return `/parade/${slug}`;
    case "state_date":
      return `/date/${slug}`;
    case "volunteer_opportunity":
      return `/volunteer/${slug}`;
    default:
      return `/`;
  }
}

export function profileCanonicalUrl(entityType: ProfileEntityType, slug: string): string {
  return `${SITE}${profilePath(entityType, slug)}`;
}

export function relatedLink(
  entityType: ProfileEntityType,
  slug: string,
  title: string,
  note?: string,
): RelatedProfileLink {
  return {
    entityType,
    slug,
    title,
    href: profilePath(entityType, slug),
    note,
  };
}

export function mergeRelated(links: RelatedProfileLink[], max = 12): RelatedProfileLink[] {
  const seen = new Set<string>();
  const out: RelatedProfileLink[] = [];
  for (const l of links) {
    const key = `${l.entityType}:${l.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l);
    if (out.length >= max) break;
  }
  return out;
}

export function citySlugify(city: string): string {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function countySlugify(county: string): string {
  return county.toLowerCase().replace(/\s+/g, "-");
}

export function traditionSlug(id: string): string {
  return id.replace(/^rec-/, "");
}

export function profileMatchesRoute(
  profile: CommunityProfile,
  entityType: ProfileEntityType,
  slug: string,
): boolean {
  return profile.slug === slug && (profile.entityType === entityType || profile.organizationSlug === slug);
}
