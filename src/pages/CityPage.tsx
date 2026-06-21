import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Share2, Building2 } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { JsonLd } from "../components/seo/JsonLd";
import { CivicGlyphLegend, CivicGlyph } from "../components/glyphs/CivicGlyph";
import { StudentServiceBlock } from "../components/student-service/StudentServiceBadge";
import { ImportantArkansasDatesBlock } from "../components/state-dates/ImportantArkansasDatesBlock";
import { fetchEvents } from "../lib/api";
import { dedupeEvents, dedupeRelatedLinks, excludeEventsByCanonicalKey } from "../lib/dedupe/dedupeRecords";
import { cityFromSlug, citySlug } from "../lib/local-intelligence/registry";
import { buildCityPageSummary, aiGuidePrompts } from "../lib/seo/pageSummaries";
import { cityPageJsonLd } from "../lib/seo/jsonLd";
import { countyPublicPath, organizationPath, organizationsInCity } from "../lib/organizations/publicOrganizationDirectory";
import { countySlug, formatCountyLabel } from "../lib/counties";
import { CIVIC_GLYPHS } from "../lib/glyphs/civicGlyphs";
import { listPublicStudentServiceOpportunities } from "../lib/student-service/studentServiceEngine";
import { stateDatesForCounty } from "../lib/state-dates/stateDatesRegistry";
import type { CivicEvent } from "../lib/types";
import { getProfile, listProfiles } from "../lib/profiles/profileRegistry";
import { FreshnessFooter } from "../components/FreshnessFooter";
import { RelatedCommunityPages } from "../components/profiles/RelatedCommunityPages";
import { relatedLink } from "../lib/profiles/profileLinks";
import { buildCityLaneCoverage } from "../lib/event-lanes/laneCoverageEngine";
import { EventLaneCoveragePanel } from "../components/event-lanes/EventLaneCoveragePanel";
import { getCityCommunityDna } from "../lib/community-dna/communityDnaEngine";
import { CommunityDnaPanel } from "../components/community-dna/CommunityDnaPanel";

interface Props {
  slug?: string;
}

export function CityPage({ slug: slugProp }: Props = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = slugProp ?? paramSlug ?? "";
  const dossier = cityFromSlug(slug);
  const [events, setEvents] = useState<CivicEvent[]>([]);

  useEffect(() => {
    if (!dossier) return;
    document.title = `Events in ${dossier.city}, Arkansas | Arkansas Everywhere`;
    fetchEvents({ county: dossier.county, limit: 500 })
      .then((all) => {
        const cityEvents = dedupeEvents(
          all.filter((e) => e.city?.toLowerCase() === dossier.city.toLowerCase()),
        );
        setEvents(cityEvents);
      })
      .catch(console.error);
  }, [dossier]);

  const orgs = useMemo(
    () => (dossier ? organizationsInCity(dossier.city, dossier.county).slice(0, 12) : []),
    [dossier],
  );

  const summary = dossier ? buildCityPageSummary(dossier, events) : "";
  const food = events.filter((e) => /fish fry|spaghetti|dinner|meal/i.test(e.title));
  const festivals = events.filter((e) => /festival|fair|parade/i.test(e.title));
  const sports = events.filter((e) => e.category === "school" || /football|basketball|game/i.test(e.title));
  const upcoming = events.slice(0, 9);
  const foodExclusive = useMemo(
    () => excludeEventsByCanonicalKey(food, upcoming),
    [food, upcoming],
  );
  const festivalsExclusive = useMemo(
    () => excludeEventsByCanonicalKey(festivals, upcoming),
    [festivals, upcoming],
  );
  const sportsExclusive = useMemo(
    () => excludeEventsByCanonicalKey(sports, upcoming),
    [sports, upcoming],
  );
  const serviceOpps = useMemo(() => listPublicStudentServiceOpportunities(events), [events]);
  const countyDates = useMemo(() => (dossier ? stateDatesForCounty(dossier.county).slice(0, 4) : []), [dossier]);

  const geoProfile = useMemo(() => {
    const base = getProfile(slug, "city");
    if (!base || !dossier) return base;
    const extra = listProfiles()
      .filter(
        (p) =>
          p.entityType !== "city" &&
          p.city?.toLowerCase() === dossier.city.toLowerCase() &&
          ["church", "school", "college", "festival", "race"].includes(p.entityType),
      )
      .slice(0, 8)
      .map((p) => relatedLink(p.entityType, p.slug, p.title));
    extra.push(relatedLink("county", `${countySlug(dossier.county)}-county`, `${dossier.county} County`));
    return { ...base, relatedLinks: dedupeRelatedLinks([...base.relatedLinks, ...extra]) };
  }, [slug, dossier]);

  const laneCoverage = useMemo(
    () => (dossier ? buildCityLaneCoverage(dossier.city, dossier.county, events) : null),
    [dossier, events],
  );
  const communityDna = useMemo(() => (dossier ? getCityCommunityDna(dossier.city) : null), [dossier]);

  if (!dossier) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p>City not found in Arkansas community directory.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">Discover Arkansas</Link>
      </div>
    );
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: `${dossier!.city}, Arkansas events`, url });
    else {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={cityPageJsonLd(dossier.city, dossier.county, summary, events.length)} />

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-ark-sage font-medium uppercase tracking-wide">Arkansas Community Calendar</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ark-pine">{dossier.city}, Arkansas</h1>
          <p className="mt-2 text-muted max-w-2xl">{summary}</p>
          <p className="text-xs text-muted mt-2 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {formatCountyLabel(dossier.county)} · Priority community #{dossier.priorityRank}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={countyPublicPath(dossier.county)} className="btn-secondary text-sm">
            {dossier.county} County →
          </Link>
          <button type="button" className="btn-secondary text-sm" onClick={share}>
            <Share2 className="h-4 w-4" /> Share
          </button>
          <Link to="/host" className="btn-primary text-sm">Host an event here</Link>
        </div>
      </div>

      {laneCoverage && <EventLaneCoveragePanel coverage={laneCoverage} compact />}

      {communityDna && <CommunityDnaPanel dna={communityDna} title={`Community DNA — ${dossier?.city}`} />}

      <section className="card bg-ark-wheat/30 mb-8">
        <h2 className="font-semibold text-ark-pine">What is happening in {dossier.city}?</h2>
        <p className="text-sm text-muted mt-2 ai-readable-summary">{summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {aiGuidePrompts(dossier.city, dossier.county).map((q) => (
            <span key={q} className="chip chip-muted text-[10px]">{q}</span>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {[
          { label: "Upcoming events", value: events.length },
          { label: "Organizations", value: orgs.length },
          { label: "Recurring traditions", value: dossier.recurringEvents?.length ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-2xl font-bold text-ark-pine">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {events.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold mb-4">Upcoming events</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => (
              <EventCard key={e.slug} event={e} compact />
            ))}
          </div>
        </section>
      )}

      {foodExclusive.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold mb-4">Food & community meals</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {foodExclusive.slice(0, 6).map((e) => (
              <EventCard key={e.slug} event={e} compact />
            ))}
          </div>
        </section>
      )}

      {festivalsExclusive.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold mb-4">Festivals & fairs</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {festivalsExclusive.slice(0, 6).map((e) => (
              <EventCard key={e.slug} event={e} compact />
            ))}
          </div>
        </section>
      )}

      {sportsExclusive.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold mb-4">School & sports</h2>
          <ul className="text-sm space-y-1">
            {sportsExclusive.slice(0, 8).map((e) => (
              <li key={e.slug}>
                <Link to={`/event/${e.slug}`} className="hover:underline">{e.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <StudentServiceBlock city={dossier?.city} county={dossier?.county} opportunities={serviceOpps} />
      {countyDates.length > 0 && <ImportantArkansasDatesBlock dates={countyDates} title={`Important dates — ${dossier?.county} County`} compact />}

      {dossier.recurringEvents && dossier.recurringEvents.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold mb-4">Annual traditions</h2>
          <ul className="text-sm space-y-1 text-muted">
            {dossier.recurringEvents.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </section>
      )}

      {orgs.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5" /> Active organizations
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {orgs.map((o) => (
              <li key={o.id}>
                <Link to={organizationPath(o.slug)} className="flex items-center gap-2 text-sm hover:underline p-2 rounded-lg hover:bg-ark-wheat/50">
                  <CivicGlyph glyph={CIVIC_GLYPHS[o.glyphKind]} size="sm" />
                  <span>{o.name.replace(/\s*—\s*verify.*$/i, "")}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to={`/organizations?county=${countySlug(dossier.county)}`} className="text-xs text-ark-sage mt-2 inline-block hover:underline">
            Browse all {dossier.county} County organizations →
          </Link>
        </section>
      )}

      {geoProfile && <RelatedCommunityPages links={geoProfile.relatedLinks} title="Related community pages" />}
      {geoProfile && <FreshnessFooter freshness={geoProfile.freshness} entityLabel={dossier.city} />}

      <CivicGlyphLegend />
    </div>
  );
}

export function cityCanonicalPath(city: string): string {
  return `/${citySlug(city)}`;
}
