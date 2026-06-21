/**
 * Pass 37 — Expand weekly / biweekly recurrence into dated occurrences.
 */

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function parseWeeklyRule(text) {
  const raw = String(text || "").trim();
  const lower = raw.toLowerCase();

  const timeMatch = raw.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  const time = timeMatch ? timeMatch[1].trim() : null;

  const weeklyMatch = lower.match(
    /(?:every|each)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|weekly\s+(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/,
  );
  if (weeklyMatch) {
    const weekday = weeklyMatch[1] || weeklyMatch[2];
    return { recurrence: "weekly", weekday, time, confidence: 78, rawRule: raw };
  }

  const bareDay = lower.match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\b/);
  if (bareDay) {
    return { recurrence: "weekly", weekday: bareDay[1], time, confidence: 70, rawRule: raw };
  }

  if (/bi-?weekly/.test(lower)) {
    const day = lower.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
    if (day) return { recurrence: "biweekly", weekday: day[1], time, confidence: 65, rawRule: raw };
  }

  return { recurrence: null, weekday: null, time, confidence: 0, rawRule: raw, ambiguous: true };
}

export function expandWeeklyDates(rule, { start = "2026-06-20", end = "2026-11-03" } = {}) {
  if (!rule?.weekday || !rule.recurrence) return [];
  const weekdayIndex = WEEKDAYS.indexOf(rule.weekday);
  if (weekdayIndex < 0) return [];

  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T23:59:59`);
  const out = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    if (cursor.getDay() === weekdayIndex) {
      out.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + (rule.recurrence === "biweekly" ? 14 : 7));
    } else {
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return out;
}

export function parseTimeTo24(timeStr, fallback = "09:00") {
  if (!timeStr) return `${fallback}:00`.slice(0, 8);
  const m = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!m) return `${fallback}:00`.slice(0, 8);
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const pm = m[3].toLowerCase() === "pm";
  if (pm && h < 12) h += 12;
  if (!pm && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
}
