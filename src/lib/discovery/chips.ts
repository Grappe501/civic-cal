import type { DiscoveryChipDef, PersonalityMode } from "./types";

export const DISCOVERY_CHIPS: DiscoveryChipDef[] = [
  { id: "government", emoji: "🏛", label: "Government", modes: ["citizen", "organizer"], categories: ["civic_meeting"], keywords: /council|quorum|commission|board meeting/i },
  { id: "festivals", emoji: "🎪", label: "Festivals", modes: ["citizen", "organizer", "volunteer_seeker"], categories: ["community"], keywords: /festival|fair|parade|rodeo|heritage/i },
  { id: "church", emoji: "⛪", label: "Church Events", modes: ["citizen"], categories: ["community_church", "faith_meal"], keywords: /church|fish fry|spaghetti|bbq dinner/i },
  { id: "sports", emoji: "🏈", label: "Sports", modes: ["citizen"], categories: ["school"], keywords: /football|basketball|game|rivalry|homecoming/i },
  { id: "races", emoji: "🏃", label: "Races", modes: ["citizen", "candidate", "organizer"], keywords: /5k|10k|marathon|half marathon|turkey trot|color run|mud run|triathlon|fun run/i },
  { id: "music", emoji: "🎵", label: "Live music", modes: ["citizen"], categories: ["culture"], keywords: /concert|festival|music|bluegrass|jazz|live band|outdoor stage|county fair.*concert|symphony|open mic/i },
  { id: "young_arkansas", emoji: "🎸", label: "Young Arkansas", tagline: "Concerts, gaming, college nights", modes: ["citizen", "organizer"], keywords: /concert|music festival|food truck|open mic|college|intramural|esports|gaming|comic con|anime|community theater|youth/i },
  { id: "family", emoji: "👨‍👩‍👧", label: "Family", modes: ["citizen"], keywords: /family|kids|children|youth/i },
  { id: "volunteer", emoji: "🤝", label: "Volunteer", modes: ["citizen", "organizer", "volunteer_seeker"], categories: ["volunteer"], keywords: /volunteer|cleanup|food bank|mutual aid/i },
  { id: "schools", emoji: "🎓", label: "Schools", modes: ["citizen", "organizer"], categories: ["school"], keywords: /school|pta|booster|graduation/i },
  { id: "food", emoji: "🍔", label: "Food", modes: ["citizen"], categories: ["faith_meal", "community"], keywords: /dinner|bbq|fish fry|chili|cookoff|meal/i },
  { id: "food_trail", emoji: "🍽", label: "Arkansas Food Trail", tagline: "Fish fries, church suppers, cookoffs", modes: ["citizen", "organizer", "candidate"], categories: ["faith_meal", "community"], keywords: /fish fry|spaghetti|wild game|chili cook|bbq cook|pancake breakfast|catfish|crawfish|pie contest|church supper|community meal/i },
  { id: "parades", emoji: "🎉", label: "Parades", modes: ["citizen", "candidate", "organizer"], categories: ["community"], keywords: /parade|homecoming parade|christmas parade|veterans day parade|festival parade/i },
  { id: "community_anchors", emoji: "⚓", label: "Community anchors", modes: ["candidate", "organizer"], keywords: /cooperative extension|4-h|homemaker|volunteer fire|farm bureau|master gardener|livestock show/i },
  { id: "markets", emoji: "🛍", label: "Markets", modes: ["citizen"], categories: ["small_business", "community"], keywords: /market|farmers|vendor|craft fair/i },
  { id: "holidays", emoji: "🎄", label: "Holidays", modes: ["citizen"], keywords: /christmas|fourth of july|july 4|memorial day|labor day|thanksgiving|halloween|easter/i },
  { id: "highest_attendance", emoji: "👥", label: "Biggest crowds", modes: ["candidate"], keywords: /fair|festival|homecoming|parade/i },
  { id: "highest_rd", emoji: "🤝", label: "Best relationship rooms", modes: ["candidate"], keywords: /church|fair|chamber|fish fry|county fair/i },
  { id: "church_meals", emoji: "⛪", label: "Church / community meals", modes: ["candidate"], categories: ["faith_meal", "community_church"], keywords: /fish fry|spaghetti|church dinner/i },
  { id: "gov_meetings", emoji: "🏛", label: "Government meetings", modes: ["candidate"], categories: ["civic_meeting"], keywords: /quorum|council|school board/i },
  { id: "volunteer_ops", emoji: "📣", label: "Volunteer opportunities", modes: ["candidate", "volunteer_seeker"], categories: ["volunteer"], keywords: /volunteer|needs help|sign up/i },
  { id: "campaign_volunteer_opportunities", emoji: "📣", label: "Campaign volunteer opportunities", modes: ["citizen", "candidate", "volunteer_seeker", "organizer"], keywords: /volunteer|help|sign up|mobilize/i },
  { id: "candidate_presence", emoji: "🗳", label: "Who's showing up?", modes: ["citizen", "candidate"], keywords: /town hall|forum|candidate|meet and greet/i },
];

export function chipsForMode(mode: PersonalityMode): DiscoveryChipDef[] {
  return DISCOVERY_CHIPS.filter((c) => c.modes.includes(mode));
}

export function chipById(id: string): DiscoveryChipDef | undefined {
  return DISCOVERY_CHIPS.find((c) => c.id === id);
}
