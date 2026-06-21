import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { EventCard } from "../components/EventCard";
import { JsonLd } from "../components/seo/JsonLd";
import { getDiscoveryGuide } from "../lib/community-dna/communityDnaEngine";
import { countySlug } from "../lib/counties";
import { countyEventCounts, eventsForDiscoveryGuide } from "../lib/community-dna/discoveryGuideEvents";

export function DiscoveryGuidePage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const guide = getDiscoveryGuide(slug);
  const events = useMemo(() => (guide ? eventsForDiscoveryGuide(guide.slug, 60) : []), [guide]);
  const countyCounts = useMemo(() => countyEventCounts(), []);

  if (!guide) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p>Guide not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">Back home</Link>
      </div>
    );
  }

  const jsonLd =
    guide.faqJsonLd && events.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: `What ${guide.title.toLowerCase()} events are coming up?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: `${events.length} source-backed events are listed on Arkansas Everywhere for this guide.`,
              },
            },
          ],
        }
      : null;

  const isCountyIndex = guide.generation === "county_index";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {jsonLd && <JsonLd data={jsonLd} />}
      <p className="text-kicker">Arkansas discovery guide · Pass 38</p>
      <h1 className="page-header">{guide.title}</h1>
      <p className="text-muted mt-2 max-w-2xl ai-readable-summary">
        High-intent community calendar guide — aggregated from source-backed public events, not thin scrape lists.
      </p>

      {isCountyIndex ? (
        <section className="mt-8">
          <h2 className="font-semibold mb-4">Events by county</h2>
          <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {[...countyCounts.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([county, count]) => (
                <li key={county}>
                  <Link
                    to={`/county/${countySlug(county)}`}
                    className="flex justify-between rounded-lg border border-[var(--border)] px-3 py-2 hover:border-ark-sage text-sm"
                  >
                    <span>{county} County</span>
                    <span className="text-caption">{count}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ) : (
        <section className="mt-8">
          <h2 className="font-semibold mb-4">Upcoming events ({events.length})</h2>
          {events.length === 0 ? (
            <p className="text-muted">No matching events in the current calendar window — check back as harvest lanes expand.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <EventCard key={e.slug} event={e} compact />
              ))}
            </div>
          )}
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <Link to="/calendar/month" className="btn-secondary text-sm">Full calendar</Link>
        <Link to="/counties" className="btn-ghost text-sm">All counties</Link>
      </div>
    </div>
  );
}
