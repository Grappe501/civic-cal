import type { CivicEvent } from "../types";
import { scoreEventForCampaign } from "../campaigns/eventIntel";
import { traditionStrengthEstimate } from "../campaigns/eventIntel";

export interface EventImportanceScores {
  attendanceScore: number;
  relationshipDensityScore: number;
  communityImportanceScore: number;
  traditionScore: number;
  youthEngagementScore: number;
  volunteerOpportunityScore: number;
  mediaVisibilityScore: number;
  candidateFitScore: number;
  fundraisingPotentialScore: number;
  coalitionBuildingScore: number;
}

export interface EventOpportunityTranslation {
  headline: string;
  narrative: string;
  scores: EventImportanceScores;
  influencerRoom: boolean;
}

function attendanceScore(event: CivicEvent): number {
  const band = event.typicalAttendanceBand;
  if (band === "massive") return 95;
  if (band === "large") return 78;
  if (band === "medium") return 55;
  if (band === "small") return 30;
  if (/1200|1,200|1500|thousand|500\+/i.test(`${event.title} ${event.description ?? ""}`)) return 85;
  return event.featured ? 60 : 40;
}

function youthScore(event: CivicEvent): number {
  const text = `${event.title} ${event.description ?? ""}`.toLowerCase();
  if (/concert|music festival|food truck|open mic|college|intramural|esports|gaming|comic|anime|theater/i.test(text)) return 80;
  if (event.isFamilyFriendly) return 45;
  return 15;
}

function volunteerScore(event: CivicEvent): number {
  if (event.category === "volunteer") return 90;
  if (/fair|festival|parade|cleanup|food bank/i.test(`${event.title} ${event.description ?? ""}`)) return 65;
  return 25;
}

function mediaScore(event: CivicEvent): number {
  if (event.featured || event.highCivicValue) return 70;
  if (/debate|forum|rally|press|media/i.test(`${event.title} ${event.description ?? ""}`)) return 75;
  return 30;
}

function fundraisingScore(event: CivicEvent): number {
  if (/fundraiser|bbq|auction|gala|benefit/i.test(`${event.title} ${event.description ?? ""}`)) return 75;
  if (event.category === "faith_meal") return 40;
  return 20;
}

function coalitionScore(event: CivicEvent): number {
  const text = `${event.title} ${event.description ?? ""}`.toLowerCase();
  if (/chamber|rotary|farm bureau|naacp|vfw|union|coalition/i.test(text)) return 80;
  if (/county fair|heritage festival/i.test(text)) return 70;
  return 35;
}

export function scoreEventImportance(event: CivicEvent): EventImportanceScores {
  const scored = scoreEventForCampaign(event);
  const tradition = traditionStrengthEstimate(event) ?? 0;
  const text = `${event.title} ${event.description ?? ""}`.toLowerCase();

  let communityImportance = scored.politicalOpportunityScore;
  if (/football|rivalry|homecoming/i.test(text)) communityImportance = Math.max(communityImportance, 88);
  if (/spaghetti|fish fry|church dinner/i.test(text)) communityImportance = Math.max(communityImportance, 82);
  if (/farm bureau/i.test(text)) communityImportance = Math.max(communityImportance, 75);
  if (/homemaker|extension homemaker/i.test(text)) communityImportance = Math.max(communityImportance, 78);
  if (/cooperative extension|4-h|master gardener/i.test(text)) communityImportance = Math.max(communityImportance, 72);
  if (/volunteer fire|vfd/i.test(text)) communityImportance = Math.max(communityImportance, 70);

  return {
    attendanceScore: attendanceScore(event),
    relationshipDensityScore: scored.relationshipDensityScore,
    communityImportanceScore: communityImportance,
    traditionScore: tradition,
    youthEngagementScore: youthScore(event),
    volunteerOpportunityScore: volunteerScore(event),
    mediaVisibilityScore: mediaScore(event),
    candidateFitScore: Math.round((scored.politicalOpportunityScore + scored.relationshipDensityScore) / 2),
    fundraisingPotentialScore: fundraisingScore(event),
    coalitionBuildingScore: coalitionScore(event),
  };
}

/** Translate raw event into campaign opportunity language */
export function translateEventToOpportunity(event: CivicEvent): EventOpportunityTranslation {
  const scores = scoreEventImportance(event);
  const text = `${event.title} ${event.description ?? ""}`.toLowerCase();
  const influencerRoom =
    scores.relationshipDensityScore >= 85 ||
    (scores.traditionScore >= 70 && scores.relationshipDensityScore >= 65);

  let headline = event.title;
  let narrative = "Community gathering — verify local significance.";

  if (/football|rivalry/i.test(text)) {
    headline = "Largest gathering in county this week?";
    narrative = "High school football draws county-wide attention — handshake density in the parking lot often exceeds formal events.";
  } else if (/spaghetti|fish fry|church dinner/i.test(text)) {
    headline = "Influential community room";
    narrative = scores.traditionScore >= 60
      ? "Long-running church/community meal tradition — county leadership often present even when crowd size looks modest."
      : "Church/community meal — relationship-density room, not a speech venue.";
  } else if (/farm bureau/i.test(text)) {
    headline = "Agricultural influence center";
    narrative = "Farm Bureau rooms aggregate producers and rural civic leaders — high coalition value.";
  } else if (scores.attendanceScore >= 80) {
    headline = "Major county attendance event";
    narrative = "Large crowd expected — visibility and volunteer recruitment opportunity.";
  } else if (influencerRoom) {
    headline = "Small crowd, high influence";
    narrative = "This may not be a large event — but it is one of the most influential rooms in the county.";
  }

  return { headline, narrative, scores, influencerRoom };
}
