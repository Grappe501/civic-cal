import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarPlus,
  Car,
  Clock,
  ExternalLink,
  HelpCircle,
  MapPin,
  Share2,
  Shield,
  Users,
  Utensils,
} from "lucide-react";
import type { CivicEvent } from "../../lib/types";
import type { EventDossierBundle } from "../../lib/intelligence/eventDossierTypes";
import { whyEventMatters } from "../../lib/ai/eventDossierBuilder";
import { scoreEventForCampaign } from "../../lib/campaigns/eventIntel";
import type { EventPresence } from "../../lib/campaigns/presenceLayer";
import { CategoryBadge } from "../CategoryBadge";
import { PresenceBadges } from "../campaigns/PresenceBadges";
import { LayerBadge } from "../intelligence/LayerBadge";
import { DensityBadge } from "../intelligence/LayerBadge";
import { EventDetailMap } from "../maps/EventDetailMap";
import { EventFeedbackForm } from "../EventFeedbackForm";
import { downloadIcs, formatEventRange, mapsUrl } from "../../lib/format";
import type { IntelligenceLayer } from "../../lib/intelligence/eventLayers";

interface Props {
  event: CivicEvent;
  bundle: EventDossierBundle;
  presence: EventPresence;
  onShare: () => void;
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

function formatLabel(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function EventIntelligenceDossierView({ event, bundle, presence, onShare }: Props) {
  const { dossier, tasks } = bundle;
  const scored = scoreEventForCampaign(event);
  const maps = mapsUrl(event);
  const confidenceLabel =
    dossier.confidenceScore >= 70 ? "High confidence" : dossier.confidenceScore >= 40 ? "Partial" : "Needs research";

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 pb-16">
      <Link to="/" className="text-sm text-ark-sage hover:underline font-medium">← All events</Link>

      {/* Hero */}
      <header className="dossier-hero mt-6 relative">
        <PresenceBadges presence={presence} />
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <CategoryBadge category={event.category} />
          <LayerBadge layer={scored.layer as IntelligenceLayer} compact />
          <span className="chip chip-score">PO {scored.politicalOpportunityScore}</span>
          <DensityBadge score={scored.relationshipDensityScore} />
          <span className={`chip ${dossier.verificationStatus === "verified" ? "chip-active" : "chip-muted"}`}>
            {confidenceLabel}
          </span>
        </div>
        <h1 className="page-header">{event.title}</h1>
        <p className="text-lg text-muted mt-2">{formatEventRange(event)}</p>
        <p className="text-sm text-ark-pine/80 mt-1 flex items-center gap-1">
          <MapPin className="h-4 w-4 text-ark-sage" />
          {[event.city, `${event.county} County, AR`].filter(Boolean).join(" · ")}
        </p>
      </header>

      {/* Quick facts */}
      <div className="dossier-quick-facts mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Cost" value={dossier.ticketCost} />
        <Fact
          label="Expected crowd"
          value={
            dossier.expectedAttendanceMin != null
              ? `${dossier.expectedAttendanceMin}–${dossier.expectedAttendanceMax ?? "?"}`
              : null
          }
        />
        <Fact label="Indoor / outdoor" value={dossier.indoorOutdoor} />
        <Fact label="Parking" value={dossier.parkingInfo} />
        <Fact label="Accessibility" value={dossier.accessibilityInfo} />
        <Fact label="Family friendly" value={dossier.familyFriendly == null ? null : dossier.familyFriendly ? "Yes" : "No"} />
        <Fact label="Food" value={dossier.foodAvailable} />
        <Fact label="Best arrival" value={dossier.bestTimeToArrive || dossier.arrivalAdvice} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Why this event matters" icon={Shield}>
            <p className="text-ark-pine/90 leading-relaxed">{whyEventMatters(event)}</p>
            {dossier.historicalNotes && (
              <p className="text-sm text-muted mt-3 border-t border-ark-pine/10 pt-3">{dossier.historicalNotes}</p>
            )}
          </Section>

          <Section title="Candidate opportunity" icon={Users}>
            <p className="text-ark-pine/90">{dossier.candidateGuidance || "Local verification needed before campaign deployment."}</p>
            {dossier.eventFormat && (
              <p className="mt-2 text-sm">
                <span className="font-semibold text-ark-pine">Format:</span>{" "}
                <span className="chip chip-muted">{formatLabel(dossier.eventFormat)}</span>
              </p>
            )}
            {dossier.campaignRiskNotes && (
              <p className="mt-2 text-sm text-amber-900 bg-amber-50 rounded-lg px-3 py-2">{dossier.campaignRiskNotes}</p>
            )}
          </Section>

          {(dossier.localCustoms || dossier.confirmedFacts?.length || dossier.likelyInferences?.length) && (
            <Section title="Local intelligence" icon={HelpCircle}>
              {dossier.localCustoms && <p className="text-sm text-ark-pine/90">{dossier.localCustoms}</p>}
              {dossier.confirmedFacts && dossier.confirmedFacts.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase text-ark-sage mb-1">Confirmed</p>
                  <ul className="text-sm space-y-1 text-ark-pine/85">
                    {dossier.confirmedFacts.map((f) => (
                      <li key={f} className="flex gap-2"><span className="text-ark-sage">✓</span>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {dossier.likelyInferences && dossier.likelyInferences.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase text-amber-700 mb-1">Likely (verify locally)</p>
                  <ul className="text-sm space-y-1 text-ark-pine/75">
                    {dossier.likelyInferences.map((f) => (
                      <li key={f} className="flex gap-2"><span>~</span>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          )}

          <Section title="Location & map" icon={MapPin}>
            <EventDetailMap event={event} />
            <p className="mt-3 text-sm text-ark-pine/85">
              {[event.locationName, event.address, event.city, `${event.county} County, AR`].filter(Boolean).join(" · ")}
            </p>
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
        </div>

        <aside className="space-y-6">
          <Section title="Who plans to attend" icon={Users}>
            {presence.attendingCampaigns.length === 0 && presence.surrogatePlans.length === 0 ? (
              <p className="text-sm dossier-fact-unknown">No public campaign presence announced yet.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {presence.attendingCampaigns.map((p) => (
                  <li key={p.slug} className="rounded-lg px-3 py-2 text-white text-xs font-semibold" style={{ backgroundColor: p.candidateColor }}>
                    {p.publicNote || `${p.candidateName} attending`}
                  </li>
                ))}
                {presence.surrogatePlans.map((p) => (
                  <li key={p.slug} className="chip chip-muted">Surrogate — {p.campaignName}</li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Volunteer needs" icon={Users}>
            {presence.volunteerNeeds.length === 0 ? (
              <p className="text-sm dossier-fact-unknown">No public volunteer call yet.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {presence.volunteerNeeds.map((p) => (
                  <li key={p.slug} className="rounded-lg px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: p.volunteerColor }}>
                    {p.volunteerPublicNote || `Volunteers needed — ${p.campaignName}`}
                  </li>
                ))}
              </ul>
            )}
            {dossier.volunteerGuidance && <p className="text-xs text-muted mt-2">{dossier.volunteerGuidance}</p>}
          </Section>

          <Section title="Host & sources" icon={ExternalLink}>
            {dossier.hostOrganization && <p className="text-sm font-medium text-ark-pine">{dossier.hostOrganization}</p>}
            {dossier.officialWebsite && (
              <a href={dossier.officialWebsite} target="_blank" rel="noreferrer" className="text-sm text-ark-rust hover:underline flex items-center gap-1 mt-2">
                Official site <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {dossier.sourceLinks && dossier.sourceLinks.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {dossier.sourceLinks.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-ark-rust hover:underline flex items-center gap-1">
                      {s.label}
                      <span className="chip chip-muted text-[9px] py-0">{s.trust || "source"}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {!dossier.hostOrganization && !dossier.sourceLinks?.length && (
              <p className="text-sm dossier-fact-unknown">Public sources not linked yet.</p>
            )}
          </Section>

          <Section title="Still need to verify" icon={AlertCircle}>
            <ul className="text-xs space-y-1.5 text-ark-pine/80">
              {(dossier.unansweredQuestions ?? tasks.map((t) => t.taskLabel)).slice(0, 8).map((q) => (
                <li key={q} className="flex gap-2"><span className="text-ark-rust">?</span>{q}</li>
              ))}
            </ul>
            <p className="text-[10px] text-muted mt-3">Source: {bundle.source} · confidence {dossier.confidenceScore}%</p>
          </Section>

          <div className="flex flex-col gap-2">
            {maps && (
              <a href={maps} target="_blank" rel="noreferrer" className="btn-secondary text-sm justify-center">
                Open in Maps
              </a>
            )}
            <button type="button" onClick={() => downloadIcs(event)} className="btn-secondary text-sm justify-center">
              <CalendarPlus className="h-4 w-4" /> Add to calendar
            </button>
            <button type="button" onClick={onShare} className="btn-primary text-sm justify-center">
              <Share2 className="h-4 w-4" /> Share event
            </button>
          </div>
        </aside>
      </div>

      {event.description && (
        <Section title="Event description">
          <p className="text-ark-pine/85 whitespace-pre-wrap">{event.description}</p>
        </Section>
      )}

      <EventFeedbackForm eventId={event.id} eventSlug={event.slug} eventCounty={event.county} eventCity={event.city} expanded />
    </article>
  );
}
