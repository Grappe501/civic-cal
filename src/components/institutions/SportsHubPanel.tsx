import { Link } from "react-router-dom";
import type { SportsHubSnapshot } from "../../lib/institutions/types";

interface Props {
  hub: SportsHubSnapshot;
}

export function SportsHubPanel({ hub }: Props) {
  const hs = hub.highSchool;
  return (
    <section className="card card-elevated">
      <h2 className="intel-section-title">Sports hub</h2>
      <p className="text-xs text-muted mt-1">High school & college — rivalry games belong on the calendar</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {[
          ["Football", hs.football],
          ["Basketball", hs.basketball],
          ["Baseball", hs.baseball],
          ["Softball", hs.softball],
          ["Soccer", hs.soccer],
          ["Track", hs.track],
          ["Band", hs.band],
        ].map(([label, count]) => (
          <div key={label as string} className="intel-data-card text-center">
            <dt className="intel-data-label">{label as string}</dt>
            <dd className="intel-data-value text-xl">{count as number}</dd>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted mt-4">
        College home games: {hub.college.scheduledHomeGames} · Tournaments: {hub.college.tournaments}
      </p>
      {hub.upcomingSportsEvents.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {hub.upcomingSportsEvents.slice(0, 6).map((e) => (
            <li key={e.slug ?? e.title}>
              {e.slug ? (
                <Link to={`/event/${e.slug}`} className="font-medium hover:underline">{e.title}</Link>
              ) : (
                e.title
              )}
              {e.rdScore != null && <span className="text-xs text-muted ml-1">RD {e.rdScore}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
