import { Link } from "react-router-dom";
import { listPoliticalPartyOrganizations } from "../lib/political-infrastructure/registry";

export function DemocraticCountyPartiesPage() {
  const committees = listPoliticalPartyOrganizations().filter((o) => o.partyLabel === "Democratic");
  const withSchedule = committees.filter((o) => o.meetingSchedule);
  const sorted = [...committees].sort((a, b) => a.county.localeCompare(b.county));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-sm text-muted">
        Source:{" "}
        <a href="https://www.arkdems.org/counties/" className="underline" target="_blank" rel="noreferrer">
          Arkansas Democrats county directory
        </a>
      </p>
      <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">Democratic County Committees</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Neutral civic directory of public county party committee pages and meeting schedules. Not an endorsement.
      </p>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        {withSchedule.length} of {committees.length} counties with public meeting schedules indexed.{" "}
        <Link to="/calendar/month?category=public_party_meeting&party=Democratic&partyMeeting=1" className="text-ark-sky underline">
          View on calendar (month / week / day)
        </Link>
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {sorted.map((org) => (
          <li key={org.slug} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
            <Link to={`/organization/${org.slug}`} className="font-semibold text-[var(--text-primary)] hover:underline">
              {org.name}
            </Link>
            {org.meetingSchedule ? (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Meeting: {org.meetingSchedule}</p>
            ) : (
              <p className="mt-1 text-sm text-muted">Meeting schedule not yet published on county page</p>
            )}
            {org.chairPublic && <p className="mt-1 text-xs text-muted">Chair: {org.chairPublic}</p>}
            {org.venue && <p className="mt-1 text-xs text-muted">Venue: {org.venue}</p>}
            {org.sourceUrl ? (
              <a href={org.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-ark-sky underline">
                County party page
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
