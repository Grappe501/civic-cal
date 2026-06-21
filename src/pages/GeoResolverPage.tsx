import { Navigate, useParams } from "react-router-dom";
import { cityFromSlug } from "../lib/local-intelligence/registry";
import { countyFromSlug } from "../lib/counties";
import { CityPage } from "./CityPage";
import { CountyPublicPage } from "./CountyPublicPage";

/** Resolves SEO-friendly flat URLs: /conway, /conway-county */
export function GeoResolverPage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/" replace />;

  if (slug.endsWith("-county")) {
    const countySlugPart = slug.slice(0, -"-county".length);
    const county = countyFromSlug(countySlugPart) ?? countyFromSlug(slug.replace(/-county$/, ""));
    if (county) return <CountyPublicPage county={county} slug={slug} />;
  }

  const city = cityFromSlug(slug);
  if (city) return <CityPage slug={slug} />;

  return <Navigate to="/" replace />;
}
