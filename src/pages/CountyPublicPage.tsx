import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Share2, MapPin } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { JsonLd } from "../components/seo/JsonLd";
import { CivicGlyphLegend, CivicGlyph } from "../components/glyphs/CivicGlyph";
import { fetchEvents } from "../lib/api";
import { dedupeEvents, dedupeRelatedLinks, excludeEventsByCanonicalKey } from "../lib/dedupe/dedupeRecords";
import { getCountyDossier, citiesInCounty, citySlug } from "../lib/local-intelligence/registry";
import { buildCountyPageSummary, aiGuidePrompts } from "../lib/seo/pageSummaries";
import { countyPageJsonLd } from "../lib/seo/jsonLd";
import { StudentServiceBlock } from "../components/student-service/StudentServiceBadge";
import { ImportantArkansasDatesBlock } from "../components/state-dates/ImportantArkansasDatesBlock";
import { listPublicOrganizations, organizationPath, cityPublicPath } from "../lib/organizations/publicOrganizationDirectory";
import { listPublicStudentServiceOpportunities } from "../lib/student-service/studentServiceEngine";
import { stateDatesForCounty } from "../lib/state-dates/stateDatesRegistry";
import { formatCountyLabel } from "../lib/counties";
import { CIVIC_GLYPHS } from "../lib/glyphs/civicGlyphs";
import type { CivicEvent } from "../lib/types";
import { getCountyDensity } from "../lib/density/densityReport";
import { CountyDensityStrip } from "../components/density/CountyDensityStrip";
import { CountyFeedCoverageStrip } from "../components/feeds/CountyFeedCoverageStrip";
import { getCountyFeedCoverage } from "../lib/feeds/feedAttachmentReport";
import { buildCountyLaneCoverage } from "../lib/event-lanes/laneCoverageEngine";
import { EventLaneCoveragePanel } from "../components/event-lanes/EventLaneCoveragePanel";
import { getProfile, listProfiles } from "../lib/profiles/profileRegistry";
import { FreshnessFooter } from "../components/FreshnessFooter";
import { RelatedCommunityPages } from "../components/profiles/RelatedCommunityPages";
import { relatedLink } from "../lib/profiles/profileLinks";

interface Props {
  county: string;
  slug: string;
}

export function CountyPublicPage({ county, slug }: Props) {
  const dossier = getCountyDossier(county);
  const [events, setEvents] = useState<CivicEvent[]>([]);

  useEffect(() => {
    document.title = `${formatCountyLabel(county)} Events | Arkansas Everywhere`;
    fetchEvents({ county, limit: 500 })
      .then((list) => setEvents(dedupeEvents(list)))
      .catch(console.error);
  }, [county]);

  const summary = buildCountyPageSummary(
    dossier ?? { county, region: "Arkansas", confidenceScore: 10 },
    events,
  );
  const cities = citiesInCounty(county).slice(0, 12);
  const orgs = useMemo(() => listPublicOrganizations(county).slice(0, 16), [county]);
  const serviceOpps = useMemo(() => listPublicStudentServiceOpportunities(events, { county }), [events, county]);
  const countyDates = useMemo(() => stateDatesForCounty(county).slice(0, 5), [county]);
  const food = events.filter((e) => /fish fry|spaghetti|dinner|meal/i.test(e.title));
  const festivals = events.filter((e) => /festival|fair|parade/i.test(e.title));
  const upcoming = events.slice(0, 9);
  const foodExclusive = useMemo(() => excludeEventsByCanonicalKey(food, upcoming), [food, upcoming]);
  const festivalsExclusive = useMemo(() => excludeEventsByCanonicalKey(festivals, upcoming), [festivals, upcoming]);

  const geoProfile = useMemo(() => {
    const base = getProfile(slug, "county");
    if (!base) return base;
    const extra = listProfiles()
      .filter((p) => p.county?.toLowerCase() === county.toLowerCase() && p.entityType !== "county")
      .slice(0, 10)
      .map((p) => relatedLink(p.entityType, p.slug, p.title));
    for (const c of cities.slice(0, 6)) {
      extra.push(relatedLink("city", citySlug(c.city), c.city));
    }
    return { ...base, relatedLinks: dedupeRelatedLinks([...base.relatedLinks, ...extra]) };
  }, [slug, county, cities]);

  const density = useMemo(() => getCountyDensity(county, events), [county, events]);
  const feedCoverage = useMemo(() => getCountyFeedCoverage(county), [county]);
  const laneCoverage = useMemo(() => buildCountyLaneCoverage(county, events), [county, events]);

  async function share() {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: `${formatCountyLabel(county)} calendar`, url });
    else {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={countyPageJsonLd(county, summary, events.length)} />

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-ark-sage font-medium uppercase tracking-wide">Arkansas Community Intelligence</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ark-pine">{formatCountyLabel(county)}</h1>
          <p className="mt-2 text-muted max-w-2xl ai-readable-summary">{summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/county/${slug.replace(/-county$/, "")}`} className="btn-secondary text-sm">Classic county view</Link>
          <button type="button" className="btn-secondary text-sm" onClick={share}><Share2 className="h-4 w-4" /> Share</button>
          <Link to="/host" className="btn-primary text-sm">Add county event</Link>
        </div>
      </div>

      <CountyDensityStrip density={density} />
      <CountyFeedCoverageStrip coverage={feedCoverage} />
      <EventLaneCoveragePanel coverage={laneCoverage} compact />

      <section className="card bg-ark-wheat/30 mb-8">
        <h2 className="font-semibold">What is happening in {county} County this month?</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {aiGuidePrompts(undefined, county).map((q) => (
            <span key={q} className="chip chip-muted text-[10px]">{q}</span>
          ))}
        </div>
      </section>

      {cities.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold mb-3">Towns & cities</h2>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <Link key={c.city} to={cityPublicPath(c.city)} className="chip chip-muted hover:border-ark-rust/40">
                <MapPin className="h-3 w-3 inline mr-1" />
                {c.city}
              </Link>
            ))}
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold mb-4">Upcoming events ({events.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => (
              <EventCard key={e.slug} event={e} compact />
            ))}
          </div>
        </section>
      )}

      {foodExclusive.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold mb-4">Arkansas Food Trail — {county} County</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {foodExclusive.slice(0, 6).map((e) => (
              <EventCard key={e.slug} event={e} compact />
            ))}
          </div>
        </section>
      )}

      {festivalsExclusive.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold mb-4">Festivals & parades</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {festivalsExclusive.slice(0, 6).map((e) => (
              <EventCard key={e.slug} event={e} compact />
            ))}
          </div>
        </section>
      )}

      {dossier?.recurringTraditions && dossier.recurringTraditions.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold mb-4">County traditions</h2>
          <ul className="text-sm space-y-1">
            {dossier.recurringTraditions.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </section>
      )}

      {orgs.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold mb-4">Community anchors</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {orgs.map((o) => (
              <li key={o.id}>
                <Link to={organizationPath(o.slug)} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-ark-wheat/50">
                  <CivicGlyph glyph={CIVIC_GLYPHS[o.glyphKind]} size="sm" />
                  {o.name.replace(/\s*—\s*verify.*$/i, "")}
                </Link>
              </li>
            ))}
          </ul>
          <Link to={`/organizations?county=${slug.replace(/-county$/, "")}`} className="text-xs mt-2 inline-block hover:underline text-ark-sage">
            All organizations in {county} County →
          </Link>
        </section>
      )}

      <StudentServiceBlock county={county} opportunities={serviceOpps} />
      {countyDates.length > 0 && <ImportantArkansasDatesBlock dates={countyDates} title={`Important dates — ${county} County`} compact />}

      {geoProfile && <RelatedCommunityPages links={geoProfile.relatedLinks} />}
      {geoProfile && <FreshnessFooter freshness={geoProfile.freshness} entityLabel={`${county} County`} />}

      <CivicGlyphLegend />
    </div>
  );
}
