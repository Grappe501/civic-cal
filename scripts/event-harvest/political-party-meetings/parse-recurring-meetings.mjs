/**
 * Parse recurrence phrases like "4th Thursday 6:00 PM" into structured rules.
 * Does not invent dates when ambiguous.
 */

const MONTH_NAMES = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const ORDINALS = { first: 1, "1st": 1, second: 2, "2nd": 2, third: 3, "3rd": 3, fourth: 4, "4th": 4, last: -1 };

export function parseRecurrenceRule(text) {
  const raw = String(text || "").replace(/\s*#+\s*$/g, "").replace(/\s+/g, " ").trim();
  const lower = raw.toLowerCase();

  if (!raw || /awaiting committee confirmation/i.test(raw)) {
    return { recurrence: null, time: null, confidence: 0, ambiguous: true, reason: "awaiting_confirmation" };
  }

  if (/^monthly\b/i.test(raw)) {
    const rest = raw.replace(/^monthly\s+/i, "");
    const inner = parseRecurrenceRule(rest);
    return { ...inner, recurrence: inner.recurrence ?? "monthly", confidence: Math.max(inner.confidence, 55) };
  }

  const timeMatch = raw.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  const time = timeMatch ? timeMatch[1].trim() : null;

  const lastMatch = lower.match(/last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (lastMatch) {
    return {
      recurrence: "monthly",
      weekday: lastMatch[1],
      weekOfMonth: -1,
      time,
      confidence: 75,
      ambiguous: false,
      rawRule: raw,
    };
  }

  const ordMatch = lower.match(/(1st|2nd|3rd|4th|first|second|third|fourth)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (ordMatch) {
    return {
      recurrence: "monthly",
      weekday: ordMatch[2],
      weekOfMonth: ORDINALS[ordMatch[1]] ?? null,
      time,
      confidence: 80,
      ambiguous: false,
      rawRule: raw,
    };
  }

  if (lower.includes("monthly")) {
    return { recurrence: "monthly", time, confidence: 45, ambiguous: true, rawRule: raw, reason: "monthly_without_weekday" };
  }

  return { recurrence: null, time, confidence: 20, ambiguous: true, rawRule: raw, reason: "unparsed" };
}

export function expandRecurrenceDates(rule, { start = "2026-06-20", end = "2026-11-01" } = {}) {
  if (!rule || rule.ambiguous || !rule.recurrence || rule.weekOfMonth == null || !rule.weekday) return [];

  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T23:59:59`);
  const weekdayIndex = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(rule.weekday);
  if (weekdayIndex < 0) return [];

  const out = [];
  let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (cursor <= endDate) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const date = nthWeekdayOfMonth(year, month, weekdayIndex, rule.weekOfMonth);
    if (date && date >= startDate && date <= endDate) {
      out.push(date.toISOString().slice(0, 10));
    }
    cursor = new Date(year, month + 1, 1);
  }

  return [...new Set(out)];
}

function nthWeekdayOfMonth(year, month, weekday, n) {
  if (n === -1) {
    const last = new Date(year, month + 1, 0);
    while (last.getDay() !== weekday) last.setDate(last.getDate() - 1);
    return last;
  }
  const first = new Date(year, month, 1);
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const dt = new Date(year, month, d);
    if (dt.getMonth() !== month) break;
    if (dt.getDay() === weekday) {
      count++;
      if (count === n) return dt;
    }
  }
  return null;
}

export function parseTimeTo24(timeStr) {
  if (!timeStr) return null;
  const m = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const pm = m[3].toLowerCase() === "pm";
  if (pm && h < 12) h += 12;
  if (!pm && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
}

export { MONTH_NAMES };
