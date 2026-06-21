import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { PageMeta } from "../components/seo/PageMeta";
import { listProfiles } from "../lib/profiles/profileRegistry";
import type { ProfileEntityType } from "../lib/profiles/profileTypes";
import { ENTITY_TYPE_LABELS } from "../lib/profiles/profileTypes";
import { profilePath } from "../lib/profiles/profileLinks";
import { ARKANSAS_COUNTIES, countyFromSlug } from "../lib/counties";
import { staleLabel } from "../lib/freshness/staleData";

interface Props {
  entityType: ProfileEntityType;
  title: string;
  description: string;
  canonicalPath: string;
}

export function EntityDirectoryPage({ entityType, title, description, canonicalPath }: Props) {
  const [params, setParams] = useSearchParams();
  const countyFilter = params.get("county");
  const cityFilter = params.get("city")?.toLowerCase() ?? "";
  const [query, setQuery] = useState(params.get("q") ?? "");

  const county = countyFilter ? countyFromSlug(countyFilter) : undefined;

  const profiles = useMemo(() => {
    let list = listProfiles(entityType);
    if (county) list = list.filter((p) => p.county?.toLowerCase() === county.toLowerCase());
    if (cityFilter) list = list.filter((p) => p.city?.toLowerCase().includes(cityFilter));
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q));
    return list.sort((a, b) => a.title.localeCompare(b.title));
  }, [entityType, county, cityFilter, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageMeta title={title} description={description} canonicalPath={canonicalPath} />
      <p className="section-kicker">Arkansas community directory</p>
      <h1 className="page-header">{title}</h1>
      <p className="text-muted mt-2 max-w-2xl">{description}</p>

      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <label className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" aria-hidden />
          <input
            type="search"
            className="input-readable pl-9 w-full"
            placeholder={`Search ${ENTITY_TYPE_LABELS[entityType].toLowerCase()}s…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <input
          type="text"
          className="input-readable max-w-[160px]"
          placeholder="City filter"
          value={params.get("city") ?? ""}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set("city", e.target.value);
            else next.delete("city");
            setParams(next);
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <Link
          to={canonicalPath}
          className={`chip ${!county ? "bg-ark-pine text-white" : "chip-muted"}`}
          onClick={() => setParams(new URLSearchParams())}
        >
          All Arkansas
        </Link>
        {ARKANSAS_COUNTIES.slice(0, 24).map((c) => (
          <Link
            key={c}
            to={`${canonicalPath}?county=${c.toLowerCase().replace(/\s+/g, "-")}`}
            className={`chip text-xs ${county === c ? "bg-ark-pine text-white" : "chip-muted"}`}
          >
            {c}
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted mt-4">
        {profiles.length} {ENTITY_TYPE_LABELS[entityType].toLowerCase()}
        {county ? ` in ${county} County` : ""} indexed
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => (
          <li key={p.slug}>
            <Link to={profilePath(entityType, p.slug)} className="card block hover:border-ark-sage py-3 h-full">
              <p className="font-medium text-sm">{p.title}</p>
              <p className="text-[10px] text-muted mt-1">
                {p.city ? `${p.city} · ` : ""}
                {p.county ? `${p.county} County` : "Arkansas"}
              </p>
              <p className="text-xs text-muted mt-2 line-clamp-2">{p.summary}</p>
              <span
                className={`mt-2 inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  p.freshness.sourceConfidence === "high"
                    ? "badge-success"
                    : p.freshness.sourceConfidence === "medium"
                      ? "badge-info"
                      : "badge-warning"
                }`}
              >
                {p.freshness.sourceConfidence} · {staleLabel(p.freshness)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {profiles.length === 0 && (
        <div className="card text-center py-12 mt-6">
          <p className="text-muted">No profiles match your filters yet.</p>
          <Link to="/help-build-the-calendar" className="btn-primary mt-4 inline-flex">
            Add or update this listing
          </Link>
        </div>
      )}

      <div className="mt-10 text-center">
        <Link to="/help-build-the-calendar" className="btn-secondary">
          Add / update a listing
        </Link>
      </div>
    </div>
  );
}
