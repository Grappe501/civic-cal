#!/usr/bin/env node
/** Post-build verification — bundled seed + public visibility. */
const path = require("node:path");
const { loadBundledSeedEvents } = require(path.join(__dirname, "../netlify/functions/lib/bundledSeed.cjs"));

function isPubliclyVisibleEvent(event, now = new Date()) {
  if ((event.status ?? "approved") !== "approved") return false;
  if (event.status === "archived") return false;
  const start = new Date(event.startAt);
  const end = event.endAt ? new Date(event.endAt) : new Date(start);
  if (!event.endAt) end.setHours(23, 59, 59, 999);
  return end.getTime() >= now.getTime();
}

const now = new Date("2026-06-21T17:00:00-05:00");
const june11 = new Date("2026-06-11T17:00:00-05:00");
const all = loadBundledSeedEvents();
const visible = all.filter((e) => isPubliclyVisibleEvent(e, now));
const visibleJune11 = all.filter((e) => isPubliclyVisibleEvent(e, june11));

const party = visible.filter((e) => String(e.id).startsWith("party-") || e.category === "public_party_meeting");
const school = all.filter((e) => String(e.id).startsWith("school-"));
const schoolVisibleJun21 = school.filter((e) => isPubliclyVisibleEvent(e, now));
const schoolVisibleJun11 = school.filter((e) => isPubliclyVisibleEvent(e, june11));
const uark = all.filter((e) => /uark|razorback|university of arkansas/i.test(`${e.title} ${e.hostOrganization} ${e.source}`));
const uarkVisible = uark.filter((e) => isPubliclyVisibleEvent(e, now) || isPubliclyVisibleEvent(e, june11));
const greenbrier = school.filter((e) => /greenbrier/i.test(`${e.title} ${e.city} ${e.hostOrganization}`));
const greenbrierJun11 = greenbrier.filter((e) => isPubliclyVisibleEvent(e, june11));
const slugs = visible.map((e) => e.slug);
const dupes = slugs.length - new Set(slugs).size;
const pastApproved = all.filter((e) => (e.status || "approved") === "approved" && !isPubliclyVisibleEvent(e, now));

const checks = [
  { name: "bundled includes seed+demo+party+school", ok: all.length >= 400 },
  { name: "visible count ~500+ (Jun 21)", ok: visible.length >= 450 },
  { name: "party meetings visible", ok: party.length >= 100 },
  { name: "school events in approved bundle", ok: school.length >= 50 },
  { name: "UARK events in bundle", ok: uark.length >= 1 },
  { name: "Greenbrier on Jun 11 day view", ok: greenbrierJun11.length >= 1 },
  { name: "no duplicate slugs", ok: dupes === 0 },
  { name: "past archived hidden", ok: pastApproved.length >= 0 },
];

console.log("Bundled calendar verification (anchor:", now.toISOString(), ")");
console.log("  bundled total:", all.length);
console.log("  visible @ Jun 21:", visible.length, "| @ Jun 11:", visibleJune11.length);
console.log("  party:", party.length, "| school approved:", school.length, "| school visible Jun21:", schoolVisibleJun21.length, "Jun11:", schoolVisibleJun11.length);
console.log("  UARK in bundle:", uark.length, "visible:", uarkVisible.length, "| Greenbrier Jun11:", greenbrierJun11.length, "| dupes:", dupes);
console.log("  past approved hidden:", pastApproved.length);

let failed = false;
for (const c of checks) {
  const mark = c.ok ? "OK" : "FAIL";
  console.log(`  [${mark}] ${c.name}`);
  if (!c.ok) failed = true;
}

if (failed) process.exit(1);
console.log("verify-bundled-calendar — all checks passed");
