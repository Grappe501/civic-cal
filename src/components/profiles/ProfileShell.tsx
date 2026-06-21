import { Link } from "react-router-dom";
import { MapPin, AlertCircle } from "lucide-react";
import { FreshnessFooter } from "../FreshnessFooter";
import { RelatedCommunityPages } from "./RelatedCommunityPages";
import type { CommunityProfile } from "../../lib/profiles/profileTypes";
import { ENTITY_DIRECTORY_ROUTES, ENTITY_TYPE_LABELS } from "../../lib/profiles/profileTypes";
import { staleLabel } from "../../lib/freshness/staleData";

interface Props {
  profile: CommunityProfile;
  children?: React.ReactNode;
  heroExtra?: React.ReactNode;
}

export function ProfileShell({ profile, children, heroExtra }: Props) {
  const dirRoute = ENTITY_DIRECTORY_ROUTES[profile.entityType];
  const isPlaceholder =
    profile.freshness.sourceConfidence === "placeholder" || profile.freshness.verificationStatus === "placeholder";

  return (
    <article className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p className="section-kicker">Arkansas community knowledge graph</p>
        <p className="text-xs uppercase tracking-wide text-muted">{ENTITY_TYPE_LABELS[profile.entityType]}</p>
        <h1 className="page-header">{profile.title}</h1>
        {(profile.city || profile.county) && (
          <p className="text-sm text-muted mt-2 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {profile.city ? `${profile.city} · ` : ""}
            {profile.county ? `${profile.county} County` : ""}
          </p>
        )}
        <p className="mt-4 max-w-3xl text-muted">{profile.summary}</p>
        <p className="mt-2 text-xs text-muted ai-readable-summary">{profile.aiSummary}</p>

        {isPlaceholder && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="font-semibold">Help us complete this profile</p>
              <p className="mt-1">
                {staleLabel(profile.freshness)}. We only publish verified community facts — share an official source to improve this page.
              </p>
              <Link to="/help-build-the-calendar" className="btn-secondary text-xs mt-2 inline-flex">
                Add or update this listing
              </Link>
            </div>
          </div>
        )}

        {heroExtra}
      </header>

      {children}

      <RelatedCommunityPages links={profile.relatedLinks} />

      {dirRoute && (
        <p className="mt-6 text-sm text-muted">
          Browse all{" "}
          <Link to={dirRoute} className="text-ark-rust font-medium hover:underline">
            {ENTITY_TYPE_LABELS[profile.entityType].toLowerCase()}s
          </Link>
          .
        </p>
      )}

      <FreshnessFooter freshness={profile.freshness} entityLabel={profile.title} />
    </article>
  );
}
