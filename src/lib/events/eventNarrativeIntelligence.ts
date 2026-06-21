import type { CivicEvent } from "../types";
import type { EventIntelligenceDossier } from "../intelligence/eventDossierTypes";
import { getNarrativeForEvent } from "../narratives/narrativeRegistry";
import { getHistoricPoliticalEventHistory } from "../political-events/historicPoliticalEvents";
import { getCityDossier, getCountyDossier } from "../local-intelligence/registry";
import { inferPublicEventPriority } from "./publicEventPriority";
import { isFairFestivalEvent } from "./festivalUtils";
import { getEventStudentServiceOpportunity } from "../student-service/studentServiceEngine";

export interface EventNarrativeBlock {
  id: string;
  title: string;
  body: string | null;
  verified: boolean;
  prompt?: string;
}

export interface EventNarrativeIntelligence {
  blocks: EventNarrativeBlock[];
  missingFields: string[];
  helpCompletePrompt: string | null;
}

function block(id: string, title: string, body: string | null, verified = false, prompt?: string): EventNarrativeBlock {
  return { id, title, body, verified, prompt };
}

export function buildEventNarrativeIntelligence(
  event: CivicEvent,
  dossier: EventIntelligenceDossier,
): EventNarrativeIntelligence {
  const narrative = getNarrativeForEvent(event);
  const politicalHistory = getHistoricPoliticalEventHistory(event);
  const cityDossier = event.city ? getCityDossier(event.city) : undefined;
  const countyDossier = event.county ? getCountyDossier(event.county) : undefined;
  const priority = inferPublicEventPriority(event);
  const studentOpp = getEventStudentServiceOpportunity(event);
  const blocks: EventNarrativeBlock[] = [];
  const missingFields: string[] = [];

  const aboutParts = [
    event.description?.trim(),
    narrative?.about,
    `${event.title} is a ${priority.label.toLowerCase()} in ${event.city ? `${event.city}, ` : ""}${event.county} County, Arkansas.`,
    priority.summary,
  ].filter(Boolean);
  blocks.push(block("about", "About this event", aboutParts.join("\n\n") || null, Boolean(event.description || narrative?.about)));

  const historyParts = [
    dossier.historicalNotes,
    politicalHistory?.historicSignificance,
    politicalHistory?.firstYearHeld ? `First held around ${politicalHistory.firstYearHeld}.` : null,
    dossier.yearsRunning ? `Community reports ~${dossier.yearsRunning} years.` : null,
    dossier.recurringPattern,
    politicalHistory?.recurringPattern,
    narrative?.history,
    narrative?.originStory,
  ].filter(Boolean);
  blocks.push(block("history", "History and tradition", historyParts.join(" ") || null, Boolean(dossier.yearsRunning || politicalHistory?.historyAvailable)));

  const expectParts = [
    narrative?.interestingFacts?.length ? narrative.interestingFacts.slice(0, 2).join(" ") : null,
    dossier.eventFormat ? `Format: ${dossier.eventFormat.replace(/_/g, " ")}.` : null,
    dossier.localCustoms,
    isFairFestivalEvent(event) ? "Expect local food, community booths, and county traditions — confirm schedule at official source." : null,
  ].filter(Boolean);
  blocks.push(block("expect", "What to expect", expectParts.join(" ") || null, Boolean(dossier.eventFormat || dossier.localCustoms)));

  const contextParts = [
    cityDossier ? `${event.city} is a priority community in local calendar coverage.` : null,
    countyDossier?.recurringTraditions?.length
      ? `County traditions include: ${countyDossier.recurringTraditions.slice(0, 3).join("; ")}.`
      : null,
    narrative?.originStory,
    narrative?.researchNotes,
  ].filter(Boolean);
  blocks.push(block("context", "Local context", contextParts.join(" ") || null, Boolean(cityDossier || countyDossier)));

  const directions = [
    event.locationName,
    event.address,
    event.city,
    `${event.county} County, AR`,
    dossier.arrivalAdvice,
    dossier.bestTimeToArrive ? `Best arrival: ${dossier.bestTimeToArrive}` : null,
  ].filter(Boolean);
  blocks.push(
    block("directions", "Directions and arrival tips", directions.join(" · ") || null, Boolean(event.address || event.locationName)),
  );

  const parkingAccess = [dossier.parkingInfo, dossier.accessibilityInfo, dossier.restroomInfo].filter(Boolean).join(" · ");
  blocks.push(block("parking", "Parking and accessibility", parkingAccess || null, Boolean(dossier.parkingInfo || dossier.accessibilityInfo)));

  const foodVendor = [dossier.foodAvailable, dossier.ticketCost, dossier.vendorOptions, dossier.sponsorOptions]
    .filter(Boolean)
    .join(" · ");
  blocks.push(block("food", "Food, vendors, and tickets", foodVendor || null, Boolean(dossier.ticketCost || dossier.foodAvailable)));

  const volunteerParts = [
    dossier.volunteerGuidance,
    studentOpp ? `Student service eligible: ${studentOpp.title}` : null,
  ].filter(Boolean);
  blocks.push(block("volunteer", "Volunteer and student-service opportunities", volunteerParts.join(" ") || null, Boolean(studentOpp)));

  const verifyParts = (dossier.unansweredQuestions ?? []).slice(0, 6);
  blocks.push(
    block(
      "verify",
      "What we still need to verify",
      verifyParts.length ? verifyParts.map((q) => `• ${q}`).join("\n") : null,
      false,
      verifyParts.length ? undefined : "Help us complete parking, cost, or history details.",
    ),
  );

  if (!event.description) missingFields.push("description");
  if (!dossier.parkingInfo) missingFields.push("parking");
  if (!dossier.accessibilityInfo) missingFields.push("accessibility");
  if (!dossier.ticketCost && event.isFree == null) missingFields.push("cost");
  if (!event.websiteUrl && !dossier.officialWebsite) missingFields.push("official_link");
  if (!dossier.historicalNotes && !dossier.yearsRunning) missingFields.push("history");
  if (!event.hostOrganization) missingFields.push("host");

  const helpCompletePrompt =
    missingFields.length >= 3
      ? "Help us complete this event page — do you know parking, cost, or local history?"
      : missingFields.length > 0
        ? `Do you know ${missingFields.slice(0, 2).join(" or ")} for this event?`
        : null;

  return { blocks, missingFields, helpCompletePrompt };
}

export interface EventFaqItem {
  question: string;
  answer: string;
}

export function buildEventFaqs(event: CivicEvent, dossier: EventIntelligenceDossier): EventFaqItem[] {
  const faqs: EventFaqItem[] = [];
  const narrative = getNarrativeForEvent(event);

  if (event.startAt) {
    faqs.push({
      question: "When is it?",
      answer: new Date(event.startAt).toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: event.timezone || "America/Chicago",
      }),
    });
  }

  const where = [event.locationName, event.address, event.city, `${event.county} County, AR`].filter(Boolean).join(", ");
  if (where) faqs.push({ question: "Where is it?", answer: where });

  if (dossier.ticketCost) faqs.push({ question: "Is it free?", answer: dossier.ticketCost });
  else if (event.isFree === true) faqs.push({ question: "Is it free?", answer: "Listed as free on the community calendar." });

  if (dossier.familyFriendly != null || event.isFamilyFriendly != null) {
    const ff = dossier.familyFriendly ?? event.isFamilyFriendly;
    faqs.push({ question: "Is it family-friendly?", answer: ff ? "Yes — listed as family-friendly." : "Confirm with host before bringing children." });
  }

  if (dossier.parkingInfo) faqs.push({ question: "Where do I park?", answer: dossier.parkingInfo });

  if (dossier.vendorOptions) faqs.push({ question: "Are vendors allowed?", answer: dossier.vendorOptions });

  if (dossier.hostOrganization || event.hostOrganization) {
    faqs.push({ question: "Who hosts it?", answer: dossier.hostOrganization ?? event.hostOrganization ?? "" });
  }

  if (event.isRecurring || dossier.recurringPattern) {
    faqs.push({
      question: "Is it recurring?",
      answer: dossier.recurringPattern ?? "Marked as recurring — confirm annual dates with official source.",
    });
  }

  for (const f of narrative?.faqs ?? []) {
    if (f.question && f.answer && !faqs.some((x) => x.question === f.question)) {
      faqs.push({ question: f.question, answer: f.answer });
    }
  }

  return faqs.filter((f) => f.answer.trim().length > 0);
}
