import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CivicGlyph } from "../components/glyphs/CivicGlyph";
import { CIVIC_GLYPHS } from "../lib/glyphs/civicGlyphs";
import { listPublicOrganizations, organizationPath } from "../lib/organizations/publicOrganizationDirectory";
import { countyFromSlug, ARKANSAS_COUNTIES } from "../lib/counties";

export function OrganizationsIndexPage() {
  const [params] = useSearchParams();
  const countyFilter = params.get("county");
  const county = countyFilter ? countyFromSlug(countyFilter) : undefined;

  const orgs = useMemo(() => listPublicOrganizations(county).slice(0, 200), [county]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="section-kicker">Arkansas organization directory</p>
      <h1 className="page-header">Community organizations</h1>
      <p className="text-muted mt-2 max-w-2xl">
        Churches, schools, VFDs, Extension offices, chambers, Rotary, Farm Bureau, and more — each with a public profile for SEO and AI discoverability.
      </p>

      <div className="flex flex-wrap gap-2 mt-6">
        <Link to="/organizations" className={`chip ${!county ? "bg-ark-pine text-white" : "chip-muted"}`}>All Arkansas</Link>
        {ARKANSAS_COUNTIES.slice(0, 20).map((c) => (
          <Link
            key={c}
            to={`/organizations?county=${c.toLowerCase().replace(/\s+/g, "-")}`}
            className={`chip text-xs ${county === c ? "bg-ark-pine text-white" : "chip-muted"}`}
          >
            {c}
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted mt-4">{orgs.length} organizations {county ? `in ${county} County` : "indexed"}</p>

      <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {orgs.map((o) => (
          <li key={o.id}>
            <Link to={organizationPath(o.slug)} className="card flex items-center gap-3 hover:border-ark-sage py-3">
              <CivicGlyph glyph={CIVIC_GLYPHS[o.glyphKind]} size="sm" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{o.name.replace(/\s*—\s*verify.*$/i, "")}</p>
                <p className="text-[10px] text-muted">{o.city ? `${o.city} · ` : ""}{o.county} County</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 text-center">
        <Link to="/host" className="btn-primary">Claim your organization → Host Portal</Link>
      </div>
    </div>
  );
}
