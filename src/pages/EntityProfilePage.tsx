import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Calendar } from "lucide-react";
import { ProfileShell } from "../components/profiles/ProfileShell";
import { PageMeta } from "../components/seo/PageMeta";
import { JsonLd } from "../components/seo/JsonLd";
import { EventCard } from "../components/EventCard";
import { getProfileForTypedRoute, enrichRelatedLinks } from "../lib/profiles/profileRegistry";
import type { ProfileEntityType } from "../lib/profiles/profileTypes";
import { profilePath, relatedLink } from "../lib/profiles/profileLinks";
import { profilePageJsonLd } from "../lib/seo/jsonLd";
import { fetchEvents } from "../lib/api";
import type { CivicEvent } from "../lib/types";
import { getOrganizationBySlug } from "../lib/organizations/publicOrganizationDirectory";

interface Props {
  entityType: ProfileEntityType;
}

export function EntityProfilePage({ entityType }: Props) {
  const { slug = "" } = useParams<{ slug: string }>();
  const baseProfile = slug ? getProfileForTypedRoute(entityType, slug) : null;
  const [events, setEvents] = useState<CivicEvent[]>([]);

  useEffect(() => {
    if (!baseProfile) return;
    const county = baseProfile.county;
    if (!county) return;
    fetchEvents({ county, limit: 200 })
      .then((all) => {
        const city = baseProfile.city?.toLowerCase();
        const filtered = city ? all.filter((e) => e.city?.toLowerCase() === city) : all;
        setEvents(filtered.slice(0, 12));
      })
      .catch(console.error);
  }, [baseProfile]);

  const profile = useMemo(() => {
    if (!baseProfile) return null;
    const extra = [];
    if (baseProfile.sourceEventSlug) {
      extra.push(relatedLink("event", baseProfile.sourceEventSlug, "Calendar event"));
    }
    const org = baseProfile.organizationSlug ? getOrganizationBySlug(baseProfile.organizationSlug) : null;
    if (org?.website) {
      extra.push({
        slug: org.slug,
        title: `${org.name} — official site`,
        entityType: "organization" as const,
        href: org.website,
        note: "External",
      });
    }
    for (const e of events.slice(0, 4)) {
      if (e.slug !== baseProfile.slug) {
        extra.push(relatedLink("event", e.slug, e.title));
      }
    }
    return enrichRelatedLinks(baseProfile, extra);
  }, [baseProfile, events]);

  if (!profile) {
    const dir =
      entityType === "volunteer_opportunity"
        ? "/volunteer-opportunities"
        : entityType === "state_date"
          ? "/dates"
          : `/${entityType}s`;
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p>Profile not found in community registry.</p>
        <Link to={dir} className="btn-primary mt-4 inline-flex">
          Browse directory
        </Link>
      </div>
    );
  }

  const canonical = profilePath(entityType, slug);

  return (
    <>
      <PageMeta title={profile.title} description={profile.summary.slice(0, 160)} canonicalPath={canonical} />
      <JsonLd data={profilePageJsonLd(profile)} />
      <ProfileShell profile={profile}>
        {events.length > 0 && (
          <section className="card-readable mb-8">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Related calendar events
            </h2>
            <div className="grid gap-3 mt-4 sm:grid-cols-2">
              {events.slice(0, 6).map((e) => (
                <EventCard key={e.id} event={e} compact />
              ))}
            </div>
          </section>
        )}
      </ProfileShell>
    </>
  );
}
