import { Link } from "react-router-dom";
import type { RelatedProfileLink } from "../../lib/profiles/profileTypes";
import { ENTITY_TYPE_LABELS } from "../../lib/profiles/profileTypes";
import { dedupeRelatedLinks } from "../../lib/dedupe/dedupeRecords";

interface Props {
  links: RelatedProfileLink[];
  title?: string;
}

function RelatedCard({ link }: { link: RelatedProfileLink }) {
  const inner = (
    <>
      <span className="text-[10px] uppercase font-bold text-muted">{ENTITY_TYPE_LABELS[link.entityType]}</span>
      <p className="font-medium text-sm text-[var(--text-primary)]">{link.title}</p>
      {link.note && <p className="text-xs text-muted mt-0.5">{link.note}</p>}
    </>
  );

  const className =
    "block rounded-lg border border-ark-sage/30 px-3 py-2 hover:border-ark-sage hover:bg-ark-porch/40 transition-colors";

  if (link.href.startsWith("http")) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link to={link.href} className={className}>
      {inner}
    </Link>
  );
}

export function RelatedCommunityPages({ links, title = "Related community pages" }: Props) {
  const unique = dedupeRelatedLinks(links);
  if (unique.length === 0) return null;

  return (
    <section className="card-readable mt-8">
      <h2 className="font-semibold text-[var(--text-secondary)]">{title}</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {unique.map((l) => (
          <li key={`${l.entityType}:${l.slug}`}>
            <RelatedCard link={l} />
          </li>
        ))}
      </ul>
    </section>
  );
}
