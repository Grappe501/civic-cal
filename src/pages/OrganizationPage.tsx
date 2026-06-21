import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Calendar, ExternalLink, HandHeart } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { JsonLd } from "../components/seo/JsonLd";
import { CivicGlyph } from "../components/glyphs/CivicGlyph";
import { StudentServiceBlock } from "../components/student-service/StudentServiceBadge";
import { CIVIC_GLYPHS } from "../lib/glyphs/civicGlyphs";
import { fetchEvents } from "../lib/api";
import {
  getOrganizationBySlug,
  countyPublicPath,
  cityPublicPath,
} from "../lib/organizations/publicOrganizationDirectory";
import { opportunitiesForOrganization } from "../lib/student-service/studentServiceEngine";
import { buildOrganizationSummary } from "../lib/seo/pageSummaries";
import { organizationJsonLd } from "../lib/seo/jsonLd";
import type { CivicEvent } from "../lib/types";
import { getProfile } from "../lib/profiles/profileRegistry";
import { FreshnessFooter } from "../components/FreshnessFooter";
import { RelatedCommunityPages } from "../components/profiles/RelatedCommunityPages";
import { relatedLink } from "../lib/profiles/profileLinks";
import { getPoliticalPartyOrganization } from "../lib/political-infrastructure/registry";
import { formatDensitySummaryText, buildCivicPoliticalDensitySummary } from "../lib/political-infrastructure/civicPoliticalDensityAssistant";

export function OrganizationPage() {
  const { slug } = useParams<{ slug: string }>();
  const org = slug ? getOrganizationBySlug(slug) : undefined;
  const [events, setEvents] = useState<CivicEvent[]>([]);

  useEffect(() => {
    if (!org) return;
    document.title = `${org.name.replace(/\s*—\s*verify.*$/i, "")} | Arkansas Everywhere`;
    fetchEvents({ county: org.county, limit: 500 })
      .then((all) => {
        const namePart = org.name.split("—")[0].trim().toLowerCase();
        setEvents(
          all.filter(
            (e) =>
              e.county.toLowerCase() === org.county.toLowerCase() &&
              (e.hostOrganization?.toLowerCase().includes(namePart.slice(0, 12)) ||
                (org.city && e.city?.toLowerCase() === org.city.toLowerCase())),
          ),
        );
      })
      .catch(console.error);
  }, [org]);

  const summary = org ? buildOrganizationSummary(org, events) : "";
  const glyph = org ? CIVIC_GLYPHS[org.glyphKind] : null;
  const orgServiceOpps = useMemo(
    () => (org && slug ? opportunitiesForOrganization(slug, events) : []),
    [org, slug, events],
  );

  const politicalOrg = useMemo(
    () => (org?.hostType === "political_party" && slug ? getPoliticalPartyOrganization(slug) : undefined),
    [org, slug],
  );
  const densitySummary = useMemo(
    () => (org?.hostType === "political_party" && org.county ? buildCivicPoliticalDensitySummary(org.county) : null),
    [org],
  );

  const profile = useMemo(() => {
    if (!org || !slug) return null;
    const base = getProfile(slug, "organization") ?? getProfile(slug);
    if (!base) return null;
    const extra = [];
    if (org.hostType === "church") extra.push(relatedLink("church", slug, org.name, "Church profile"));
    if (org.hostType === "school") extra.push(relatedLink("school", slug, org.name, "School profile"));
    if (org.hostType === "college") extra.push(relatedLink("college", slug, org.name, "College profile"));
    return { ...base, relatedLinks: [...base.relatedLinks, ...extra] };
  }, [org, slug]);

  if (!org || !glyph) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p>Organization not found.</p>
        <Link to="/organizations" className="btn-primary mt-4 inline-flex">Browse organizations</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={organizationJsonLd(org, events.length)} />

      <div className="flex flex-wrap items-start gap-4 mb-8">
        <CivicGlyph glyph={glyph} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted">Arkansas organization directory</p>
          <h1 className="font-display text-3xl font-bold text-ark-pine">{org.name.replace(/\s*—\s*verify.*$/i, "")}</h1>
          <p className="text-sm text-muted mt-1">
            {org.city ? `${org.city} · ` : ""}
            {org.county} County · {org.claimStatus === "unclaimed" ? "Unclaimed — hosts can claim this page" : org.claimStatus}
          </p>
          <p className="text-sm text-muted mt-3 max-w-2xl ai-readable-summary">{summary}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {org.city && (
          <Link to={cityPublicPath(org.city)} className="btn-secondary text-sm">
            Events in {org.city}
          </Link>
        )}
        <Link to={countyPublicPath(org.county)} className="btn-secondary text-sm">
          {org.county} County calendar
        </Link>
        <Link to="/host" className="btn-primary text-sm">
          Claim & manage as host
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-10">
        <div className="card md:col-span-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Upcoming events
          </h2>
          {events.length === 0 ? (
            <p className="text-sm text-muted mt-3">No events linked yet — hosts can add events from the Host Dashboard.</p>
          ) : (
            <div className="grid gap-3 mt-4 sm:grid-cols-2">
              {events.slice(0, 6).map((e) => (
                <EventCard key={e.id} event={e} compact />
              ))}
            </div>
          )}
        </div>
        <aside className="space-y-4">
          {org.website && (
            <a href={org.website} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-2 text-sm hover:border-ark-sage">
              <ExternalLink className="h-4 w-4" /> Website
            </a>
          )}
          {org.volunteerPageUrl && (
            <a href={org.volunteerPageUrl} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-2 text-sm hover:border-ark-sage">
              <HandHeart className="h-4 w-4" /> Volunteer page
            </a>
          )}
          {org.hostType === "political_party" && politicalOrg && (
            <div className="card">
              <h3 className="text-xs font-bold uppercase text-muted mb-2">Meeting schedule</h3>
              <p className="text-sm">{politicalOrg.meetingSchedule ?? "Not published on official page yet."}</p>
              {politicalOrg.chairPublic && <p className="text-sm text-muted mt-2">Chair (public listing): {politicalOrg.chairPublic}</p>}
              {politicalOrg.electionCommissioner && (
                <p className="text-sm text-muted mt-1">Election commissioner: {politicalOrg.electionCommissioner}</p>
              )}
              {politicalOrg.venue && <p className="text-sm text-muted mt-1">Venue: {politicalOrg.venue}</p>}
              <p className="text-xs text-muted mt-2">Confidence: {politicalOrg.confidenceScore}% · Updated {politicalOrg.freshnessDate}</p>
            </div>
          )}
          {org.sourceUrl && (
            <a href={org.sourceUrl} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-2 text-sm hover:border-ark-sage">
              <ExternalLink className="h-4 w-4" /> Official source
            </a>
          )}
          {densitySummary && (
            <div className="card">
              <h3 className="text-xs font-bold uppercase text-muted mb-2">County civic-political density</h3>
              <pre className="text-xs whitespace-pre-wrap text-muted font-sans">{formatDensitySummaryText(densitySummary)}</pre>
            </div>
          )}
          {org.recurringTraditions && org.recurringTraditions.length > 0 && org.hostType !== "political_party" && (
            <div className="card">
              <h3 className="text-xs font-bold uppercase text-muted mb-2">Traditions</h3>
              <ul className="text-sm space-y-1">
                {org.recurringTraditions.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <StudentServiceBlock organizationSlug={slug} county={org.county} city={org.city ?? undefined} opportunities={orgServiceOpps} />

      {profile && <RelatedCommunityPages links={profile.relatedLinks} />}
      {profile && <FreshnessFooter freshness={profile.freshness} entityLabel={org.name} />}
    </div>
  );
}
