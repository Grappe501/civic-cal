import type { CivicEvent } from "../types";
import { isDemocraticCountyPartyMeeting } from "../calendar/calendarDisplayPriority";
import { isFairFestivalEvent } from "./festivalUtils";
import { getEventStudentServiceOpportunity } from "../student-service/studentServiceEngine";

export type PublicEventPriorityLabel =
  | "Essential local tradition"
  | "Major community gathering"
  | "Strong volunteer opportunity"
  | "Family-friendly event"
  | "Civic meeting"
  | "Niche/special interest"
  | "Routine meeting";

export interface PublicEventPriority {
  label: PublicEventPriorityLabel;
  /** Short public explanation — no campaign PO/RD language */
  summary: string;
  bestFor: string[];
}

function titleText(event: CivicEvent): string {
  return `${event.title} ${event.description ?? ""}`.toLowerCase();
}

export function inferPublicEventPriority(event: CivicEvent): PublicEventPriority {
  const bestFor: string[] = [];
  const t = titleText(event);

  if (event.category === "public_party_meeting" || event.category === "civic_meeting" || event.isPublicGovernmentMeeting) {
    if (isDemocraticCountyPartyMeeting(event)) bestFor.push("voters & civic watchers");
    else bestFor.push("civic watchers");
    return {
      label: "Civic meeting",
      summary: "Public meeting where residents can learn about local civic and community affairs.",
      bestFor: bestFor.length ? bestFor : ["voters & civic watchers"],
    };
  }

  if (event.category === "volunteer" || /volunteer|cleanup|fundraiser/i.test(t)) {
    bestFor.push("volunteers");
    return {
      label: "Strong volunteer opportunity",
      summary: "Community event where volunteers and helpers can make a direct local impact.",
      bestFor,
    };
  }

  if (isFairFestivalEvent(event) || /county fair|festival|jubilee|parade/i.test(t)) {
    if (event.isFamilyFriendly !== false) bestFor.push("families");
    if (/livestock|4-?h|ffa|farm|ag/i.test(t)) bestFor.push("agriculture community");
    if (/music|concert|band/i.test(t)) bestFor.push("music fans");
    bestFor.push("vendors");
    const essential = event.isRecurring && (event.highCivicValue || event.featured);
    return {
      label: essential ? "Essential local tradition" : "Major community gathering",
      summary: essential
        ? "Recurring community tradition that draws residents from across the county."
        : "Large community gathering with local food, entertainment, or traditions.",
      bestFor: bestFor.length ? bestFor : ["families"],
    };
  }

  if (event.category === "faith_meal" || event.category === "community_church" || /fish fry|spaghetti|church/i.test(t)) {
    bestFor.push("faith community", "families");
    return {
      label: "Major community gathering",
      summary: "Faith-community meal or gathering open to the public.",
      bestFor,
    };
  }

  if (event.category === "school" || /school|graduation|game|athletic/i.test(t)) {
    bestFor.push("families", "students");
    return {
      label: "Family-friendly event",
      summary: "School or student-community event on the public calendar.",
      bestFor,
    };
  }

  if (getEventStudentServiceOpportunity(event)) {
    bestFor.push("students");
  }

  if (event.isFamilyFriendly) bestFor.push("families");
  if (/vendor|booth|market/i.test(t)) bestFor.push("vendors");

  if (bestFor.length === 0) {
    return {
      label: "Routine meeting",
      summary: "Community event on the Arkansas calendar — confirm details with the host before attending.",
      bestFor: ["general public"],
    };
  }

  return {
    label: event.isFamilyFriendly ? "Family-friendly event" : "Niche/special interest",
    summary: "Local event worth checking if you care about this part of community life.",
    bestFor,
  };
}
