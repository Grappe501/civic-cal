import { Link } from "react-router-dom";
import {
  AlertCircle,
  Car,
  Clock,
  ExternalLink,
  HelpCircle,
  MapPin,
  Shield,
  Sparkles,
  Users,
  Utensils,
} from "lucide-react";
import type { CivicEvent } from "../../lib/types";
import type { EventDossierBundle } from "../../lib/intelligence/eventDossierTypes";
import { getNarrativeForEvent } from "../../lib/narratives/narrativeRegistry";
import { CommunityNarrativePanel } from "../narratives/CommunityNarrativePanel";
import { countySlug } from "../../lib/counties";
import type { EventPresence } from "../../lib/campaigns/presenceLayer";
import { CategoryBadge } from "../CategoryBadge";
import { PresenceBadges } from "../campaigns/PresenceBadges";
import { EventDetailMap } from "../maps/EventDetailMap";
import { HostVolunteerControls } from "../hosts/HostVolunteerBadge";
import { StudentServiceBadge } from "../student-service/StudentServiceBadge";
import { getEventStudentServiceOpportunity } from "../../lib/student-service/studentServiceEngine";
import { EventFeedbackForm } from "../EventFeedbackForm";
import { formatEventRange } from "../../lib/format";
import { getHistoricPoliticalEventHistory } from "../../lib/political-events/historicPoliticalEvents";
import { PoliticalEventHistorySection } from "./PoliticalEventHistorySection";
import { getPartyMeetingPresentation } from "../../lib/events/partyMeetingStyles";
import { inferPublicEventPriority } from "../../lib/events/publicEventPriority";
import { buildEventNarrativeIntelligence, buildEventFaqs } from "../../lib/events/eventNarrativeIntelligence";
import { EventPageActions } from "./EventPageActions";
import { EventFaqSection } from "./EventFaqSection";
import { EventRelatedLinks } from "./EventRelatedLinks";
import { CampaignEventIntelPanel } from "./CampaignEventIntelPanel";
import { cn } from "../../lib/cn";

interface Props {
  event: CivicEvent;
  bundle: EventDossierBundle;
  presence: EventPresence;
  onShare: () => void;
  campaignSlug?: string;
  relatedEvents?: CivicEvent[];
  /** When true (default), hide campaign intelligence from public visitors. */
  publicMode?: boolean;
}

function Fact({ label, value, unknown = "Not yet verified" }: { label: string; value?: string | null; unknown?: string }) {
  const display = value?.trim() ? value : unknown;
  const isUnknown = !value?.trim();
  return (
    <div className="dossier-fact">
      <dt className="dossier-fact-label">{label}</dt>
      <dd className={isUnknown ? "dossier-fact-unknown" : "dossier-fact-value"}>{display}</dd>
    </div>
  );
}

function Section({ id, title, icon: Icon, children }: { id?: string; title: string; icon?: typeof MapPin; children: React.ReactNode }) {
  return (
    <section id={id} className="dossier-section card card-elevated">
      <h2 className="dossier-section-title">
        {Icon && <Icon className="h-5 w-5 text-ark-sage shrink-0" />}
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function EventIntelligenceDossierView({
  event,
  bundle,
  presence,
  onShare,
  campaignSlug,
  relatedEvents = [],
  publicMode = true,
}: Props) {
  const { dossier } = bundle;
  const showCampaignIntel = !publicMode || Boolean(campaignSlug);
  const narrative = getNarrativeForEvent(event);
  const intelligence = buildEventNarrativeIntelligence(event, dossier);
  const priority = inferPublicEventPriority(event);
  const faqs = buildEventFaqs(event, dossier);
  const partyStyle = getPartyMeetingPresentation(event);
  const studentServiceOpp = getEventStudentServiceOpportunity(event);
  const politicalHistory = getHistoricPoliticalEventHistory(event);

  const confidenceLabel =
    dossier.confidenceScore >= 70 ? "Source verified" : dossier.confidenceScore >= 40 ? "Partially verified" : "Needs research";

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 pb-16">
      <Link to="/calendar/month" className="text-sm text-ark-sage hover:underline font-medium">
        ← Community calendar
      </Link>

      <header className="dossier-hero mt-6 relative">
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <CategoryBadge category={event.category} />
          {partyStyle && (
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded", partyStyle.badgeClassName)}>
              {partyStyle.label}
            </span>
          )}
          <span className="chip chip-active text-xs">{priority.label}</span>
          <span className={`chip text-xs ${dossier.verificationStatus === "verified" ? "chip-active" : "chip-muted"}`}>
            {confidenceLabel}
          </span>
        </div>
        <h1 className="page-header">{event.title}</h1>
        <p className="text-lg text-muted mt-2">{formatEventRange(event)}</p>
        <p className="text-sm text-muted mt-1 flex items-center gap-1">
          <MapPin className="h-4 w-4 text-ark-sage" />
          {[event.city, `${event.county} County, AR`].filter(Boolean).join(" · ")}
        </p>
        <p className="text-sm text-[var(--text-primary)] mt-3 max-w-2xl">{priority.summary}</p>
        <div className="mt-4">
          <EventPageActions event={event} onShare={onShare} ticketUrl={dossier.officialWebsite} />
        </div>
      </header>

      {/* Priority quick panel */}
      <section className="mt-8 card-readable border-l-4 border-ark-sage">
        <h2 className="font-semibold flex items-center gap-2 text-[var(--text-secondary)]">
          <Sparkles className="h-5 w-5 text-ark-sage" /> At a glance
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="What is it?" value={intelligence.blocks.find((b) => b.id === "about")?.body?.slice(0, 120)} />
          <Fact label="Why go?" value={priority.summary} />
          <Fact label="Cost" value={dossier.ticketCost ?? (event.isFree ? "Free (listed)" : null)} />
          <Fact label="Best arrival" value={dossier.bestTimeToArrive || dossier.arrivalAdvice} />
          <Fact label="Parking" value={dossier.parkingInfo} />
          <Fact label="Indoor / outdoor" value={dossier.indoorOutdoor} />
          <Fact label="Food" value={dossier.foodAvailable} />
          <Fact label="Accessibility" value={dossier.accessibilityInfo} />
        </div>
        <div className="mt-4">
          <p className="text-kicker">Best for</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {priority.bestFor.map((b) => (
              <span key={b} className="chip chip-muted text-xs capitalize">
                {b}
              </span>
            ))}
          </div>
        </div>
        {(dossier.officialWebsite || event.websiteUrl) && (
          <a
            href={dossier.officialWebsite ?? event.websiteUrl!}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-ark-rust hover:underline mt-4"
          >
            Official website <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {studentServiceOpp && (
          <div className="mt-3">
            <StudentServiceBadge opportunity={studentServiceOpp} />
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {politicalHistory?.historyAvailable && <PoliticalEventHistorySection dossier={politicalHistory} />}

          {intelligence.blocks
            .filter((b) => b.id !== "verify" && b.body)
            .map((b) => (
              <Section key={b.id} id={b.id} title={b.title} icon={Shield}>
                <p className="text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{b.body}</p>
              </Section>
            ))}

          {intelligence.helpCompletePrompt && (
            <section className="card border-dashed border-ark-sage/50 bg-ark-wheat/40 p-4">
              <h3 className="font-semibold text-ark-pine">Help us complete this event page</h3>
              <p className="text-sm text-muted mt-1">{intelligence.helpCompletePrompt}</p>
              <Link to={`/submit?event=${event.slug}`} className="btn-secondary text-xs mt-3 inline-flex">
                Submit an update
              </Link>
            </section>
          )}

          {narrative && <CommunityNarrativePanel narrative={narrative} compact />}

          {showCampaignIntel && <CampaignEventIntelPanel event={event} bundle={bundle} campaignSlug={campaignSlug} />}

          <Section title="Location & map" icon={MapPin}>
            <EventDetailMap event={event} />
            <p className="mt-3 text-sm text-muted">
              {[event.locationName, event.address, event.city, `${event.county} County, AR`].filter(Boolean).join(" · ")}
            </p>
            {event.county && (
              <Link to={`/county/${countySlug(event.county)}`} className="text-xs text-ark-rust hover:underline mt-2 inline-block">
                More in {event.county} County →
              </Link>
            )}
          </Section>

          <Section title="Logistics" icon={Car}>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Fact label="Parking" value={dossier.parkingInfo} />
              <Fact label="Accessibility" value={dossier.accessibilityInfo} />
              <Fact label="Restrooms" value={dossier.restroomInfo} />
              <Fact label="What to wear" value={dossier.whatToWear} />
              <Fact label="Arrival advice" value={dossier.arrivalAdvice} />
              <Fact label="Food & drink" value={dossier.foodAvailable} />
            </dl>
          </Section>

          {(dossier.vendorOptions || dossier.sponsorOptions) && (
            <Section title="Vendors & sponsors" icon={Utensils}>
              {dossier.vendorOptions && <p className="text-sm"><strong>Vendors:</strong> {dossier.vendorOptions}</p>}
              {dossier.sponsorOptions && <p className="text-sm mt-2"><strong>Sponsors:</strong> {dossier.sponsorOptions}</p>}
            </Section>
          )}

          {(dossier.yearsRunning || dossier.recurringPattern) && (
            <Section title="History & tradition" icon={Clock}>
              {dossier.yearsRunning && <p className="text-sm">Running ~{dossier.yearsRunning} years (community report — verify)</p>}
              {dossier.recurringPattern && <p className="text-sm mt-1 text-muted">{dossier.recurringPattern}</p>}
            </Section>
          )}

          <EventFaqSection faqs={faqs} />
          <EventRelatedLinks event={event} relatedEvents={relatedEvents} />
        </div>

        <aside className="space-y-6">
          <Section title="Who plans to attend" icon={Users}>
            {presence.attendingCampaigns.length === 0 && presence.surrogatePlans.length === 0 ? (
              <p className="text-sm dossier-fact-unknown">No public campaign presence announced yet.</p>
            ) : (
              <>
                <PresenceBadges presence={presence} eventTitle={event.title} />
                <ul className="text-sm space-y-2 mt-2">
                  {presence.attendingCampaigns.map((p) => (
                    <li key={p.slug} className="chip chip-muted text-xs">{p.publicNote || `${p.candidateName} attending`}</li>
                  ))}
                </ul>
              </>
            )}
          </Section>

          <Section title="Host & sources" icon={ExternalLink}>
            {dossier.hostOrganization && <p className="text-sm font-medium text-ark-pine">{dossier.hostOrganization}</p>}
            {dossier.sourceLinks && dossier.sourceLinks.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {dossier.sourceLinks.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-ark-rust hover:underline">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[10px] text-muted mt-3">Source confidence: {dossier.confidenceScore}%</p>
          </Section>

          <Section title="Still need to verify" icon={AlertCircle}>
            <ul className="text-xs space-y-1.5 text-muted">
              {(intelligence.missingFields.length ? intelligence.missingFields : ["parking", "cost", "history"]).map((q) => (
                <li key={q} className="flex gap-2">
                  <span className="text-ark-rust">?</span>
                  {q}
                </li>
              ))}
            </ul>
          </Section>

          {dossier.confirmedFacts && dossier.confirmedFacts.length > 0 && (
            <Section title="Verified facts" icon={HelpCircle}>
              <ul className="text-sm space-y-1">
                {dossier.confirmedFacts.map((f) => (
                  <li key={f} className="flex gap-2"><span className="text-ark-sage">✓</span>{f}</li>
                ))}
              </ul>
            </Section>
          )}
        </aside>
      </div>

      {event.description && (
        <Section title="Original listing">
          <p className="text-muted whitespace-pre-wrap">{event.description}</p>
        </Section>
      )}

      <HostVolunteerControls eventId={event.id} />
      <EventFeedbackForm eventId={event.id} eventSlug={event.slug} eventCounty={event.county} eventCity={event.city} expanded />
    </article>
  );
}
