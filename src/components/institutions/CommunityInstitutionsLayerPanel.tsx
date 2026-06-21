import type { CountyCommunityInstitutionsLayer } from "../../lib/institutions/types";
import type { ChurchDirectoryEntry, SchoolDirectoryEntry } from "../../lib/institutions/types";

interface Props {
  layer: CountyCommunityInstitutionsLayer;
}

function ChurchRow({ c }: { c: ChurchDirectoryEntry }) {
  return (
    <li className="text-sm border-b border-ark-pine/5 py-2 last:border-0">
      <p className="font-medium text-ark-pine">{c.churchName}</p>
      <p className="text-xs text-muted">{c.city}{c.denomination ? ` · ${c.denomination}` : ""}</p>
      <div className="flex flex-wrap gap-1 mt-1">
        {c.fishFry && <span className="chip chip-muted text-[9px]">Fish fry</span>}
        {c.spaghettiDinner && <span className="chip chip-muted text-[9px]">Spaghetti</span>}
        {c.communityMeals && <span className="chip chip-muted text-[9px]">Community meals</span>}
        {c.sizeCategory && <span className="chip chip-muted text-[9px] capitalize">{c.sizeCategory}</span>}
        {!c.verified && <span className="chip chip-muted text-[9px] opacity-60">Unverified</span>}
      </div>
    </li>
  );
}

function SchoolRow({ s }: { s: SchoolDirectoryEntry }) {
  const sports = s.activities
    ? Object.entries(s.activities).filter(([, v]) => v).map(([k]) => k)
    : [];
  return (
    <li className="text-sm border-b border-ark-pine/5 py-2 last:border-0">
      <p className="font-medium text-ark-pine">{s.schoolName}</p>
      <p className="text-xs text-muted">{s.district ?? s.city}{s.mascot ? ` · ${s.mascot}` : ""}</p>
      {sports.length > 0 && (
        <p className="text-[10px] text-muted mt-1">Activities: {sports.join(", ")}</p>
      )}
    </li>
  );
}

export function CommunityInstitutionsLayerPanel({ layer }: Props) {
  const orgByType = (type: string) => layer.organizations.filter((o) => o.orgType === type);

  return (
    <div className="space-y-6">
      <section className="card card-elevated">
        <h2 className="intel-section-title">Community institutions</h2>
        <p className="text-xs text-muted mt-1">Who shapes community life in {layer.county} County</p>
        <div className="grid gap-6 lg:grid-cols-2 mt-4">
          <div>
            <h3 className="text-xs font-bold uppercase text-ark-sage mb-2">Churches ({layer.churches.length})</h3>
            <ul className="max-h-48 overflow-y-auto">{layer.churches.slice(0, 8).map((c) => <ChurchRow key={c.id} c={c} />)}</ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-ark-sage mb-2">Schools ({layer.schools.length})</h3>
            <ul className="max-h-48 overflow-y-auto">{layer.schools.slice(0, 8).map((s) => <SchoolRow key={s.id} s={s} />)}</ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-ark-sage mb-2">Colleges ({layer.colleges.length})</h3>
            <ul className="text-sm space-y-1">
              {layer.colleges.map((c) => (
                <li key={c.id}>{c.institutionName} · {c.city}</li>
              ))}
              {layer.colleges.length === 0 && <li className="intel-data-unknown">No college in registry</li>}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-ark-sage mb-2">Libraries · Hospitals · VFDs</h3>
            <ul className="text-sm space-y-1 text-ark-pine/85">
              {orgByType("library").slice(0, 3).map((o) => <li key={o.id}>📚 {o.name}</li>)}
              {orgByType("hospital").slice(0, 2).map((o) => <li key={o.id}>🏥 {o.name}</li>)}
              {orgByType("vfd").slice(0, 4).map((o) => <li key={o.id}>🚒 {o.name}</li>)}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
