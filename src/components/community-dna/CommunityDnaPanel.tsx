import type { CityCommunityDna, CountyCommunityDna } from "../../lib/community-dna/communityDnaTypes";

interface Props {
  dna: CityCommunityDna | CountyCommunityDna;
  title?: string;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-ark-wheat/20 px-3 py-2">
      <p className="text-caption">{label}</p>
      <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export function CommunityDnaPanel({ dna, title = "Community DNA" }: Props) {
  const people = dna.people;
  const isCity = "city" in dna;
  const placeLabel = isCity ? `${(dna as CityCommunityDna).city}, ${dna.county} County` : `${(dna as CountyCommunityDna).county} County`;

  return (
    <section className="card-readable mt-8 border-l-4 border-ark-sage">
      <p className="text-kicker">Pass 38 · Census + BLS community intelligence</p>
      <h2 className="font-semibold text-[var(--text-secondary)]">{title}</h2>
      <p className="text-sm text-muted mt-1 ai-readable-summary">{dna.personality.summary}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {dna.personality.tags.map((t) => (
          <span key={t} className="chip chip-muted text-xs">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Population" value={people.population?.toLocaleString() ?? "—"} />
        <Stat label="Median age" value={people.median_age != null ? String(people.median_age) : "—"} />
        <Stat
          label="Median income"
          value={people.median_household_income != null ? `$${people.median_household_income.toLocaleString()}` : "—"}
        />
        <Stat
          label="Bachelor's+"
          value={
            people.educational_attainment_bachelors_plus_pct != null
              ? `${people.educational_attainment_bachelors_plus_pct}%`
              : "—"
          }
        />
        <Stat
          label="Unemployment"
          value={people.unemployment_rate != null ? `${people.unemployment_rate}%` : "—"}
        />
        <Stat
          label="Labor force"
          value={people.labor_force_participation != null ? `${people.labor_force_participation}%` : "—"}
        />
      </div>

      {"traditions" in dna && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-ark-pine">Traditions & calendar density</h3>
          <p className="text-sm text-muted mt-1">
            {isCity
              ? `${(dna.traditions as { events_this_year_in_city?: number }).events_this_year_in_city ?? 0} public events indexed in ${placeLabel}`
              : `${(dna.traditions as { public_events_count?: number }).public_events_count ?? 0} county events indexed`}
          </p>
        </div>
      )}

      {"economy" in dna && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-ark-pine">Economy</h3>
          <p className="text-sm text-muted mt-1">
            {((dna.economy as { top_sectors?: string[] }).top_sectors ?? []).join(" · ") || "Sector mix — verify with BLS QCEW"}
          </p>
        </div>
      )}

      {people.source_vintage && <p className="text-caption mt-4">{people.source_vintage}</p>}

      {dna.source_links && dna.source_links.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2 text-xs">
          {dna.source_links.slice(0, 4).map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-ark-rust hover:underline">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
