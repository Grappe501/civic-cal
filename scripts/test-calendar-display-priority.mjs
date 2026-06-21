#!/usr/bin/env node
/**
 * QA — compact calendar display priority (crowded day cells).
 * Standalone runner (no TS import) — mirrors src/lib/calendar/calendarDisplayPriority.ts contract.
 */

const day = "2026-07-15T";
const fixtures = [
  { id: "qa-gop", title: "Pulaski County Republican Committee Meeting", category: "public_party_meeting", partyLabel: "Republican", startAt: `${day}18:00:00.000Z` },
  { id: "qa-dem", title: "Pulaski County Democratic Central Committee", category: "public_party_meeting", partyLabel: "Democratic", startAt: `${day}19:00:00.000Z` },
  { id: "qa-fair", title: "Pulaski County Fair", harvestBatch: "county_fair", startAt: `${day}10:00:00.000Z` },
  { id: "qa-festival", title: "Hope Watermelon Festival", festivalCategory: "watermelon", startAt: `${day}11:00:00.000Z` },
  { id: "qa-book-club", title: "Library book club", startAt: `${day}14:00:00.000Z` },
  { id: "qa-yoga", title: "Community yoga", startAt: `${day}15:00:00.000Z` },
  { id: "qa-cleanup", title: "Neighborhood cleanup", startAt: `${day}16:00:00.000Z` },
];

function isDem(e) {
  return e.category === "public_party_meeting" && String(e.partyLabel ?? "").toLowerCase() === "democratic";
}
function isFair(e) {
  return e.harvestBatch?.includes("county_fair") || /county fair|fairgrounds/i.test(e.title);
}
function isFest(e) {
  return !isFair(e) && (Boolean(e.festivalCategory) || /festival|watermelon/i.test(e.title));
}
function tier(e) {
  if (isDem(e)) return 1;
  if (isFair(e)) return 2;
  if (isFest(e)) return 3;
  return 8;
}
function selectVisible(events, limit = 3) {
  const sorted = [...events].sort((a, b) => tier(a) - tier(b) || a.startAt.localeCompare(b.startAt));
  const visible = [];
  const seen = new Set();
  const push = (e) => {
    if (visible.length >= limit || seen.has(e.id)) return;
    seen.add(e.id);
    visible.push(e);
  };
  for (const e of sorted) if (tier(e) <= 3) push(e);
  for (const e of sorted) {
    push(e);
    if (visible.length >= limit) break;
  }
  return visible;
}

const errors = [];
const visible = selectVisible(fixtures, 3);
if (visible.length !== 3) errors.push(`Expected 3 visible, got ${visible.length}`);
if (visible[0]?.id !== "qa-dem") errors.push(`Slot 1 should be Dem, got ${visible[0]?.title}`);
if (visible[1]?.id !== "qa-fair") errors.push(`Slot 2 should be fair, got ${visible[1]?.title}`);
if (visible[2]?.id !== "qa-festival") errors.push(`Slot 3 should be festival, got ${visible[2]?.title}`);
if (visible.some((e) => e.id === "qa-gop")) errors.push("GOP meeting should not be in top 3");

if (errors.length) {
  console.error("FAIL:", errors.join("; "));
  process.exit(1);
}

console.log("QA crowded day visible order:");
visible.forEach((e, i) => console.log(`  ${i + 1}. ${e.title}`));
console.log("PASS: calendar display priority self-test");
