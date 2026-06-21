import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchEventBySlug } from "../lib/api";
import { fetchEventDossier } from "../lib/api-event-dossier";
import { useEventPresence } from "../hooks/useEventPresence";
import { shareEventUrl } from "../lib/format";
import type { CivicEvent } from "../lib/types";
import type { EventDossierBundle } from "../lib/intelligence/eventDossierTypes";
import { buildDossierBundle } from "../lib/ai/eventDossierBuilder";
import { EventIntelligenceDossierView } from "../components/events/EventIntelligenceDossierView";

export function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<CivicEvent | null>(null);
  const [bundle, setBundle] = useState<EventDossierBundle | null>(null);
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
        setBundle(await fetchEventDossier(ev));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const presence = useEventPresence(event?.id ?? "");

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
    <EventIntelligenceDossierView
      event={event}
      bundle={dossierBundle}
      presence={presence}
      onShare={handleShare}
    />
  );
}
