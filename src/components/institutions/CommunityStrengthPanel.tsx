import type { CommunityStrengthIndicators } from "../../lib/institutions/types";

interface Props {
  strength: CommunityStrengthIndicators;
}

export function CommunityStrengthPanel({ strength }: Props) {
  const items = [
    { label: "Churches indexed", value: strength.churchCount },
    { label: "Schools indexed", value: strength.schoolCount },
    { label: "Colleges", value: strength.collegePresence ? strength.collegeCount : "—" },
    { label: "Festivals (calendar)", value: strength.festivalCount },
    { label: "Volunteer orgs", value: strength.volunteerOrganizationCount },
    { label: "Recurring traditions", value: strength.recurringTraditionCount },
    { label: "Annual events", value: strength.annualEventCount },
    { label: "Libraries", value: strength.libraryCount },
    { label: "Hospitals", value: strength.hospitalCount },
    { label: "VFD districts", value: strength.vfdCount },
  ];

  return (
    <section className="card card-elevated bg-ark-wheat/20">
      <h2 className="intel-section-title">Community strength</h2>
      <p className="text-xs text-muted mt-1 mb-3">Not political — community life indicators</p>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map(({ label, value }) => (
          <div key={label} className="intel-data-card">
            <dt className="intel-data-label">{label}</dt>
            <dd className="intel-data-value text-lg">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
