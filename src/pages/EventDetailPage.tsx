import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarPlus, ExternalLink, MapPin, Share2 } from "lucide-react";
import { CategoryBadge } from "../components/CategoryBadge";
import { EventFeedbackForm } from "../components/EventFeedbackForm";
import { EventDetailMap } from "../components/maps/EventDetailMap";
import { fetchEventBySlug } from "../lib/api";
import { downloadIcs, formatEventRange, mapsUrl, shareEventUrl } from "../lib/format";
import type { CivicEvent } from "../lib/types";

export function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<CivicEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetchEventBySlug(slug)
      .then(setEvent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 animate-pulse h-64 bg-ark-wheat/30 rounded-2xl m-4" />;
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p>Event not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">Back to events</Link>
      </div>
    );
  }

  const ev = event;
  const maps = mapsUrl(ev);

  async function handleShare() {
    const url = shareEventUrl(ev);
    if (navigator.share) await navigator.share({ title: ev.title, url });
    else {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/" className="text-sm text-ark-sage hover:underline">← All events</Link>
      <header className="mt-4 space-y-4">
        <CategoryBadge category={ev.category} />
        <h1 className="font-display text-3xl font-bold text-ark-pine">{ev.title}</h1>
        <p className="text-lg text-ark-pine/70">{formatEventRange(ev)}</p>
      </header>

      <div className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-ark-sage mb-3">Location</h2>
        <EventDetailMap event={ev} />
      </div>

      <div className="card mt-6 space-y-4">
        <p className="flex items-start gap-2 text-ark-pine">
          <MapPin className="h-5 w-5 shrink-0 text-ark-sage" />
          <span>
            {[ev.locationName, ev.address, ev.city, `${ev.county} County, AR`]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </p>
        {ev.description && <p className="text-ark-pine/80 whitespace-pre-wrap">{ev.description}</p>}
        {ev.hostOrganization && (
          <p className="text-sm"><span className="font-medium">Host:</span> {ev.hostOrganization}</p>
        )}
        {ev.websiteUrl && (
          <a href={ev.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ark-rust hover:underline text-sm">
            Website / Facebook <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        {ev.source === "public_submission" && ev.submitterName && (
          <p className="text-xs text-ark-pine/50">Submitted by {ev.submitterName}</p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {maps && (
          <a href={maps} target="_blank" rel="noreferrer" className="btn-secondary">
            Open in Google Maps
          </a>
        )}
        <button type="button" onClick={() => downloadIcs(ev)} className="btn-secondary">
          <CalendarPlus className="h-4 w-4" />
          Add to my calendar
        </button>
        <button type="button" onClick={handleShare} className="btn-primary">
          <Share2 className="h-4 w-4" />
          Share this event
        </button>
      </div>

      <EventFeedbackForm eventId={ev.id} eventSlug={ev.slug} eventCounty={ev.county} eventCity={ev.city} />
    </article>
  );
}
