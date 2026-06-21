import { Link } from "react-router-dom";
import { BookOpen, Clock, HelpCircle, Link2 } from "lucide-react";
import type { CommunityNarrative } from "../../lib/narratives/narrativeTypes";
import { profilePath } from "../../lib/profiles/profileLinks";
import type { ProfileEntityType } from "../../lib/profiles/profileTypes";

interface Props {
  narrative: CommunityNarrative;
  compact?: boolean;
}

function entityHref(entityType: ProfileEntityType | "event", slug: string): string {
  if (entityType === "event") return `/event/${slug}`;
  return profilePath(entityType, slug);
}

export function CommunityNarrativePanel({ narrative, compact = false }: Props) {
  const hasBody =
    narrative.about ||
    narrative.history ||
    narrative.originStory ||
    (narrative.timeline?.length ?? 0) > 0 ||
    (narrative.interestingFacts?.length ?? 0) > 0 ||
    (narrative.faqs?.length ?? 0) > 0;

  if (!hasBody) return null;

  return (
    <div className={`space-y-6 ${compact ? "" : "mt-8"}`}>
      {(narrative.about || narrative.history || narrative.originStory) && (
        <section className="card-readable">
          <h2 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-ark-sage" aria-hidden />
            About {narrative.title}
          </h2>
          {narrative.about && <p className="mt-3 text-sm text-[var(--text-primary)] leading-relaxed">{narrative.about}</p>}
          {narrative.originStory && (
            <p className="mt-3 text-sm text-muted">
              <span className="font-medium text-[var(--text-secondary)]">Origin: </span>
              {narrative.originStory}
            </p>
          )}
          {narrative.history && <p className="mt-3 text-sm text-muted leading-relaxed">{narrative.history}</p>}
        </section>
      )}

      {narrative.timeline && narrative.timeline.length > 0 && (
        <section className="card-readable">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-ark-sage" aria-hidden />
            Timeline
          </h2>
          <ol className="mt-3 space-y-2 border-l-2 border-ark-sage/30 pl-4">
            {narrative.timeline.map((t) => (
              <li key={`${t.year}-${t.label}`} className="text-sm">
                {t.year && <span className="font-semibold text-ark-pine mr-2">{t.year}</span>}
                <span>{t.label}</span>
                {t.note && <p className="text-xs text-muted mt-0.5">{t.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {narrative.interestingFacts && narrative.interestingFacts.length > 0 && (
        <section className="card-readable">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted">Interesting facts</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-[var(--text-primary)]">
            {narrative.interestingFacts.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-ark-sage">•</span>
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {narrative.faqs && narrative.faqs.length > 0 && (
        <section className="card-readable" id="faqs">
          <h2 className="font-semibold flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-ark-sage" aria-hidden />
            Frequently asked questions
          </h2>
          <dl className="mt-4 space-y-4">
            {narrative.faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="font-medium text-[var(--text-primary)]">{faq.question}</dt>
                <dd className="mt-1 text-sm text-muted leading-relaxed">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {narrative.relatedEntitySlugs && narrative.relatedEntitySlugs.length > 0 && (
        <section className="card-readable">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <Link2 className="h-4 w-4 text-ark-sage" aria-hidden />
            Related in Arkansas Everywhere
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {narrative.relatedEntitySlugs.map((rel) => (
              <li key={`${rel.entityType}-${rel.slug}`}>
                <Link
                  to={entityHref(rel.entityType, rel.slug)}
                  className="chip chip-muted hover:border-ark-sage text-xs"
                >
                  {rel.label ?? rel.slug}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {narrative.sources && narrative.sources.length > 0 && (
        <section className="text-sm">
          <p className="text-xs font-semibold uppercase text-muted mb-2">Sources</p>
          <ul className="space-y-1">
            {narrative.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-ark-rust hover:underline">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {narrative.lastRefreshedAt && (
        <p className="text-xs text-muted">Narrative last refreshed {narrative.lastRefreshedAt}</p>
      )}
    </div>
  );
}
