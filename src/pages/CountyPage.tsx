import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { List, Map as MapIcon, Share2 } from "lucide-react";
import { EventCard } from "../components/EventCard";
import { JsonLd } from "../components/seo/JsonLd";
import { ArkansasEventMap } from "../components/maps/ArkansasEventMap";
import { fetchEvents } from "../lib/api";
import { countyFromSlug, countySlug, formatCountyLabel, ARKANSAS_COUNTIES } from "../lib/counties";
import { getCountyDossier } from "../lib/local-intelligence/registry";
import { buildCountyPageSummary } from "../lib/seo/pageSummaries";
import { countyPageJsonLd } from "../lib/seo/jsonLd";
import { StudentServiceBlock } from "../components/student-service/StudentServiceBadge";
import { ImportantArkansasDatesBlock } from "../components/state-dates/ImportantArkansasDatesBlock";
import { countyPublicPath } from "../lib/organizations/publicOrganizationDirectory";
import { listPublicStudentServiceOpportunities } from "../lib/student-service/studentServiceEngine";
import { stateDatesForCounty } from "../lib/state-dates/stateDatesRegistry";
import type { CivicEvent } from "../lib/types";

function eventsThisWeek(events: CivicEvent[]) {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return events.filter((e) => {
    const s = new Date(e.startAt);
    return s >= now && s <= weekEnd;
  });
}

export function CountyPage() {
  const { slug } = useParams<{ slug: string }>();
  const county = slug ? countyFromSlug(slug) : undefined;
  const [events, setEvents] = useState<CivicEvent[]>([]);
  const [view, setView] = useState<"list" | "map">("list");

  useEffect(() => {
    if (!county) return;
    fetchEvents({ county, limit: 500 }).then(setEvents).catch(console.error);
  }, [county]);

  const thisWeek = useMemo(() => eventsThisWeek(events), [events]);
  const civic = useMemo(() => events.filter((e) => e.category === "civic_meeting" || e.isPublicGovernmentMeeting), [events]);
  const community = useMemo(() => events.filter((e) => e.category === "community"), [events]);
  const candidate = useMemo(() => events.filter((e) => e.candidateRelevant), [events]);
  const summary = useMemo(() => {
    if (!county) return "";
    const dossier = getCountyDossier(county);
    return buildCountyPageSummary(
      dossier ?? { county, region: "Arkansas", confidenceScore: 10 },
      events,
    );
  }, [county, events]);
  const serviceOpps = useMemo(() => (county ? listPublicStudentServiceOpportunities(events, { county }) : []), [county, events]);
  const countyDates = useMemo(() => (county ? stateDatesForCounty(county).slice(0, 5) : []), [county]);

  if (!county) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p>County not found.</p>
        <Link to="/counties" className="btn-primary mt-4 inline-flex">All counties</Link>
      </div>
    );
  }

  async function shareCounty() {
    const url = `${window.location.origin}/county/${countySlug(county!)}`;
    if (navigator.share) await navigator.share({ title: `${formatCountyLabel(county!)} calendar`, url });
    else {
      await navigator.clipboard.writeText(url);
      alert("County calendar link copied!");
    }
  }

  function Section({ title, items }: { title: string; items: CivicEvent[] }) {
    if (!items.length) return null;
    return (
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ark-pine mb-4">{title}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((e) => (
            <EventCard key={e.id} event={e} compact />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={countyPageJsonLd(county!, summary, events.length)} />

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-ark-sage font-medium uppercase tracking-wide">County calendar</p>
          <h1 className="font-display text-3xl font-bold text-ark-pine">{formatCountyLabel(county)}</h1>
          <p className="mt-2 text-muted ai-readable-summary max-w-2xl">{summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={countyPublicPath(county)} className="btn-secondary text-sm">Community intelligence view</Link>
          <div className="flex rounded-full border border-ark-pine/15 p-1 bg-white">
            <button
              type="button"
              onClick={() => setView("list")}
              className={view === "list" ? "chip bg-ark-pine text-white" : "chip text-ark-pine"}
            >
              <List className="h-3.5 w-3.5 inline mr-1" />
              List
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              className={view === "map" ? "chip bg-ark-pine text-white" : "chip text-ark-pine"}
            >
              <MapIcon className="h-3.5 w-3.5 inline mr-1" />
              Map
            </button>
          </div>
          <button type="button" onClick={shareCounty} className="btn-secondary">
            <Share2 className="h-4 w-4" />
            Share county calendar
          </button>
        </div>
      </div>

      {view === "map" ? (
        <ArkansasEventMap events={events} height="420px" />
      ) : events.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted">No events listed yet for {county} County.</p>
          <Link to="/submit" className="btn-primary mt-4 inline-flex">Submit the first event</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}

      <Section title={`Events this week in ${county} County`} items={thisWeek} />
      <Section title="Civic meetings" items={civic} />
      <Section title="Festivals & community" items={community} />
      <Section title="Candidate opportunity events" items={candidate} />

      <StudentServiceBlock county={county} opportunities={serviceOpps} />
      {countyDates.length > 0 && <ImportantArkansasDatesBlock dates={countyDates} title={`Important dates — ${county} County`} compact />}
    </div>
  );
}

export function CountiesIndexPage() {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    fetchEvents({ limit: 500 })
      .then((events) => {
        const m = new Map<string, number>();
        for (const e of events) m.set(e.county, (m.get(e.county) ?? 0) + 1);
        setCounts(m);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-ark-pine">All 75 counties</h1>
      <p className="mt-2 text-muted mb-8">Shareable county calendars for organizers and neighbors.</p>
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {ARKANSAS_COUNTIES.map((county) => (
          <Link
            key={county}
            to={`/county/${countySlug(county)}`}
            className="card py-3 px-4 flex items-center justify-between hover:border-ark-sage"
          >
            <span className="font-medium text-ark-pine">{county}</span>
            <span className="text-xs text-caption">{counts.get(county) ?? 0}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
