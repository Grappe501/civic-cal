import type { EventFaqItem } from "../../lib/events/eventNarrativeIntelligence";

interface Props {
  faqs: EventFaqItem[];
}

export function EventFaqSection({ faqs }: Props) {
  if (faqs.length === 0) return null;

  return (
    <section className="dossier-section card card-elevated" id="event-faqs">
      <h2 className="dossier-section-title">Frequently asked questions</h2>
      <dl className="mt-4 space-y-4">
        {faqs.map((faq) => (
          <div key={faq.question}>
            <dt className="font-semibold text-[var(--text-primary)]">{faq.question}</dt>
            <dd className="mt-1 text-sm text-muted leading-relaxed">{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
