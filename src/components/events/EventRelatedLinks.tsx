import { Link } from "react-router-dom";
import type { CivicEvent } from "../../lib/types";
import { countySlug } from "../../lib/counties";
import { citySlug } from "../../lib/local-intelligence/registry";
import { isFairFestivalEvent } from "../../lib/events/festivalUtils";

interface Props {
  event: CivicEvent;
  relatedEvents?: CivicEvent[];
}

export function EventRelatedLinks({ event, relatedEvents = [] }: Props) {
  const links: { label: string; to: string }[] = [];

  if (event.city) links.push({ label: `${event.city} events`, to: `/city/${citySlug(event.city)}` });
  if (event.county) links.push({ label: `${event.county} County calendar`, to: `/county/${countySlug(event.county)}` });

  if (isFairFestivalEvent(event)) {
    links.push({ label: "Arkansas festival guide", to: "/guides/arkansas-festival-guide" });
    links.push({ label: "County fair guide", to: "/guides/arkansas-county-fair-guide" });
  }

  if (event.category === "public_party_meeting") {
    links.push({ label: "Democratic county parties", to: "/democratic-county-parties" });
  }

  if (event.category === "volunteer") {
    links.push({ label: "Volunteer opportunities", to: "/calendar/month?volunteer=1" });
  }

  links.push({ label: "Full month calendar", to: "/calendar/month" });

  const similar = relatedEvents.filter((e) => e.id !== event.id).slice(0, 5);

  return (
    <section className="dossier-section card card-elevated">
      <h2 className="dossier-section-title">Explore further</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="chip chip-muted hover:border-ark-sage text-xs">
            {l.label}
          </Link>
        ))}
      </div>
      {event.hostOrganization && (
        <p className="text-sm text-muted mt-4">
          Host: <span className="font-medium text-[var(--text-primary)]">{event.hostOrganization}</span>
        </p>
      )}
      {similar.length > 0 && (
        <div className="mt-4">
          <p className="text-kicker mb-2">Nearby / similar events</p>
          <ul className="text-sm space-y-1.5">
            {similar.map((e) => (
              <li key={e.id}>
                <Link to={`/event/${e.slug}`} className="text-ark-rust hover:underline">
                  {e.title}
                </Link>
                <span className="text-caption ml-1">· {e.city ?? e.county}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
