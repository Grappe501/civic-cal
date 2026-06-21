const base = process.argv[2] ?? "http://127.0.0.1:4174";
const paths = [
  "/",
  "/calendar/month",
  "/calendar/week",
  "/calendar/day?date=2026-06-21",
  "/admin/data-health",
  "/admin/school-calendars",
];

for (const p of paths) {
  const r = await fetch(base + p);
  const t = await r.text();
  const spa = t.includes('id="root"');
  console.log(r.status, spa ? "SPA" : "NO-SPA", p);
}
