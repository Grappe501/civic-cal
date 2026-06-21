import { Link } from "react-router-dom";
import { listDistrictBoundaries } from "../lib/campaigns/districtRegistry";

export function DistrictEnginePage() {
  const districts = listDistrictBoundaries();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-ark-sage">Pass 7 — District Boundary Engine</p>
      <h1 className="font-display text-3xl font-bold text-ark-pine mt-1">Inside · Near · Worth the trip</h1>
      <p className="mt-3 text-ark-pine/70 max-w-2xl">
        Campaign dashboards classify every event into three zones: inside your district, near your district, and
        high-value statewide exceptions worth travel. Partial counties use statutory lists today; precinct GeoJSON loads next.
      </p>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { title: "Inside district", desc: "Whole county, city match, or point-in-polygon when GeoJSON available." },
          { title: "Near district", desc: "Adjacent counties, partial counties, or within radius of district centroid." },
          { title: "Worth the trip", desc: "Outside but PO/RD high enough to consider (festivals, flagship traditions)." },
        ].map(({ title, desc }) => (
          <div key={title} className="card">
            <h2 className="font-semibold text-ark-pine">{title}</h2>
            <p className="text-sm text-ark-pine/60 mt-1">{desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold mb-4">Seeded boundaries</h2>
        <div className="space-y-2">
          {districts.map((d) => (
            <div key={d.slug} className="card flex flex-wrap justify-between gap-2 text-sm">
              <div>
                <strong>{d.districtCode}</strong> — {d.name}
              </div>
              <span className="chip bg-ark-wheat text-xs capitalize">{d.boundaryPrecision.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      </section>

      <Link to="/campaigns" className="btn-primary mt-8 inline-flex">Open campaign dashboards</Link>
    </div>
  );
}
