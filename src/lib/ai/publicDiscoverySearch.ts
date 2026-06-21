import type { CivicEvent } from "../types";
import type { PersonalityMode, PublicDiscoveryAnswer } from "../discovery/types";
import {
  busiestTownsThisWeekend,
  exploreByIntent,
  filterByChip,
  filterRaces,
} from "../discovery/eventDiscovery";
import { scoreEventForCampaign } from "../campaigns/eventIntel";
import { isThisWeek, isWeekend } from "date-fns";

function inferPublicIntent(query: string, mode: PersonalityMode): string {
  const q = query.toLowerCase();
  if (/family|kids|children|take my/.test(q)) return "family";
  if (/church|fish fry|dinner within|spaghetti/.test(q)) return "church";
  if (/biggest crowd|largest crowd|most people|everyone/.test(q)) return "crowds";
  if (/hidden gem|off the beaten|secret/.test(q)) return "hidden";
  if (/worth the drive|worth driving|road trip/.test(q)) return "drive";
  if (/race|5k|10k|marathon|turkey trot|run this month/.test(q)) return "races";
  if (/candidate|showing up|who is attending|politician/.test(q)) return "candidates";
  if (/town.*alive|most events|busiest town|next weekend/.test(q)) return "towns";
  if (/north arkansas|northwest|delta|river valley|central arkansas/.test(q)) return "region";
  if (/conway|faulkner|white county|pulaski|benton/.test(q)) return "county";
  if (/saturday|weekend|this week/.test(q)) return "weekend";
  if (/volunteer|help out/.test(q)) return "volunteer";
  if (mode === "candidate" && /where should|statewide candidate|be saturday/.test(q)) return "candidate_plan";
  return "general";
}

function scoreForIntent(e: CivicEvent, intent: string): number {
  const text = `${e.title} ${e.description ?? ""}`.toLowerCase();
  let score = attendanceScore(e);
  if (intent === "family" && (e.isFamilyFriendly || /family|kids/.test(text))) score += 40;
  if (intent === "church" && /church|fish fry|dinner/.test(text)) score += 45;
  if (intent === "crowds" && /fair|festival|parade|homecoming/.test(text)) score += 35;
  if (intent === "races" && /5k|run|marathon/.test(text)) score += 50;
  if (intent === "volunteer" && e.category === "volunteer") score += 40;
  if (intent === "candidate_plan") score += (e.relationshipDensityScore ?? scoreEventForCampaign(e).relationshipDensityScore) * 0.6;
  return score;
}

function attendanceScore(e: CivicEvent): number {
  const band = e.typicalAttendanceBand;
  return band === "massive" ? 100 : band === "large" ? 80 : band === "medium" ? 55 : e.featured ? 50 : 30;
}

function extractCounty(q: string): string | null {
  const m = q.match(/\b([a-z]+)\s+county\b/i);
  return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : null;
}

export function deterministicPublicDiscoverySearch(
  queryText: string,
  events: CivicEvent[],
  mode: PersonalityMode,
): PublicDiscoveryAnswer {
  const intent = inferPublicIntent(queryText, mode);
  const county = extractCounty(queryText);

  let pool = [...events];
  if (county) pool = pool.filter((e) => e.county.toLowerCase() === county.toLowerCase());

  if (intent === "family") pool = filterByChip(pool, "family");
  else if (intent === "church") pool = filterByChip(pool, "church_meals");
  else if (intent === "hidden") pool = exploreByIntent(pool, "hidden_gems");
  else if (intent === "drive") pool = exploreByIntent(pool, "worth_the_drive");
  else if (intent === "races") pool = filterRaces(pool);
  else if (intent === "candidates") pool = filterByChip(pool, "candidate_presence");
  else if (intent === "weekend") {
    pool = pool.filter((e) => isWeekend(new Date(e.startAt)) || isThisWeek(new Date(e.startAt), { weekStartsOn: 0 }));
  }

  const ranked = pool
    .map((e) => ({ event: e, score: scoreForIntent(e, intent) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const towns = busiestTownsThisWeekend(events);
  let headline = "Here's what we found across Arkansas";
  let summary = `Showing ${ranked.length} events matching your question. Discovery uses public calendar data — always verify details locally.`;

  if (intent === "family") {
    headline = "Family-friendly picks";
    summary = "Events flagged family-friendly or commonly draw parents and kids — fairs, school events, community gatherings.";
  } else if (intent === "church") {
    headline = "Church dinners & community meals";
    summary = "Fish fries, spaghetti suppers, and faith-community meals — relationship-rich rooms across the state.";
  } else if (intent === "crowds") {
    headline = "Events that draw the biggest crowds";
    summary = "Festivals, fairs, homecomings, and flagship community traditions tend to pack the room.";
  } else if (intent === "towns" && towns.length) {
    headline = "Towns with the most happening this weekend";
    summary = `Leading towns: ${towns.map((t) => `${t.city} (${t.count} events)`).join(", ")}.`;
  } else if (intent === "candidate_plan") {
    headline = mode === "candidate" ? "Where a statewide candidate should be Saturday" : "High-value civic rooms";
    summary = "Sorted by relationship density and civic significance — handshake rooms beat speeches in Arkansas.";
  } else if (intent === "races") {
    headline = "Arkansas race circuit";
    summary = "5Ks, fun runs, turkey trots, and charity races — high attendance, high community energy.";
  } else if (intent === "candidates") {
    headline = "Where candidates are showing up";
    summary = "Public campaign presence badges and candidate-relevant events in the feed.";
  }

  const followUpPrompts =
    mode === "citizen"
      ? [
          "Where should I take my family this weekend?",
          "Show me church dinners within an hour.",
          "What town has the most events next weekend?",
          "Find every race and 5K this month.",
        ]
      : [
          "Where should a statewide candidate be Saturday?",
          "Show me highest relationship-density events this week.",
          "What counties have no campaign presence planned?",
          "Find church/community meals worth the drive.",
        ];

  return {
    source: "deterministic",
    query: queryText,
    headline,
    summary,
    eventIds: ranked.map((r) => r.event.id),
    followUpPrompts,
    mode,
  };
}

export const PUBLIC_DISCOVERY_EXAMPLES: Record<PersonalityMode, string[]> = {
  citizen: [
    "Where should I take my family this weekend?",
    "Show me church dinners within an hour.",
    "What events draw the biggest crowds?",
    "Find every race and 5K this month.",
    "Show me hidden gems in North Arkansas.",
    "What town has the most events next weekend?",
  ],
  candidate: [
    "Where should a statewide candidate be Saturday?",
    "Show me highest relationship-density events this week.",
    "What is everyone in Conway County talking about?",
    "Find church/community meals worth the drive.",
    "Which fairs draw the biggest crowds?",
    "Where are other campaigns showing up?",
  ],
  organizer: [
    "What volunteer shifts need people this week?",
    "Show me school and community events needing help.",
    "What's happening in Pulaski County this weekend?",
    "Find festivals that need volunteer crews.",
  ],
  volunteer_seeker: [
    "Where can I volunteer this Saturday?",
    "Show me food banks and community cleanups.",
    "What events need volunteer sign-ups?",
    "Find family-friendly volunteer opportunities.",
  ],
};
