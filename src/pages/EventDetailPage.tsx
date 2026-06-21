import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchEventBySlug, fetchEvents } from "../lib/api";
import { dedupeEvents } from "../lib/dedupe/dedupeRecords";
import { fetchEventDossier } from "../lib/api-event-dossier";
import { useEventPresence } from "../hooks/useEventPresence";
import { shareEventUrl } from "../lib/format";
import type { CivicEvent } from "../lib/types";
import type { EventDossierBundle } from "../lib/intelligence/eventDossierTypes";
import { buildDossierBundle, whyEventMattersPublic } from "../lib/ai/eventDossierBuilder";
import { buildEventFaqs } from "../lib/events/eventNarrativeIntelligence";
import { JsonLd } from "../components/seo/JsonLd";
import { eventJsonLd, eventFaqJsonLd } from "../lib/seo/jsonLd";
import { EventIntelligenceDossierView } from "../components/events/EventIntelligenceDossierView";
import { FreshnessFooter } from "../components/FreshnessFooter";
import { defaultFreshness } from "../lib/freshness/freshnessTypes";

export function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<CivicEvent | null>(null);
  const [bundle, setBundle] = useState<EventDossierBundle | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<CivicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetchEventBySlug(slug)
      .then(async (ev) => {
        if (!ev) {
          setEvent(null);
          return;
        }
        setEvent(ev);
        const [dossierBundle, countyEvents] = await Promise.all([
          fetchEventDossier(ev),
          fetchEvents({ county: ev.county, limit: 12 }),
        ]);
        setBundle(dossierBundle);
        setRelatedEvents(
          dedupeEvents(countyEvents.filter((e) => e.slug !== ev.slug)).slice(0, 8),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const presence = useEventPresence(event?.id ?? "");

  const jsonLd = useMemo(() => {
    if (!event) return null;
    const dossierBundle = bundle ?? buildDossierBundle(event);
    const publicDescription = whyEventMattersPublic(event);
    const eventSchema = eventJsonLd(event, publicDescription);
    const faqs = buildEventFaqs(event, dossierBundle.dossier);
    const faqSchema = eventFaqJsonLd(faqs, shareEventUrl(event));
    if (!faqSchema) return eventSchema;
    return {
      "@context": "https://schema.org",
      "@graph": [eventSchema, faqSchema],
    };
  }, [event, bundle]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 animate-pulse h-96 bg-ark-wheat/30 rounded-2xl m-4" />;
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p>Event not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">Back to events</Link>
      </div>
    );
  }

  const dossierBundle = bundle ?? buildDossierBundle(event);

  async function handleShare() {
    const url = shareEventUrl(event!);
    if (navigator.share) await navigator.share({ title: event!.title, url });
    else {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  }

  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <EventIntelligenceDossierView
        event={event}
        bundle={dossierBundle}
        presence={presence}
        onShare={handleShare}
        relatedEvents={relatedEvents}
        publicMode
      />
      <div className="mx-auto max-w-4xl px-4 pb-10">
        <FreshnessFooter
          freshness={defaultFreshness({
            sourceConfidence: event.source === "demo_seed" ? "placeholder" : event.status === "approved" ? "medium" : "low",
            sourceCount: event.websiteUrl ? 1 : 0,
            sourceLinks: event.websiteUrl ? [{ label: "Event source", url: event.websiteUrl }] : [],
            verificationStatus: event.status === "approved" ? "verified" : "needs_review",
            refreshNeeded: event.source === "demo_seed" || event.status !== "approved",
            refreshNotes: event.source === "demo_seed" ? "Demo seed event — confirm with host before citing." : undefined,
          })}
          entityLabel={event.title}
        />
      </div>
    </>
  );
}
