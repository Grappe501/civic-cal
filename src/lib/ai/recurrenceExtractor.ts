import type { RecurrenceExtractionResult } from "./eventCoverageTypes";

const ORDINALS: Record<string, number> = { first: 1, "1st": 1, second: 2, "2nd": 2, third: 3, "3rd": 3, fourth: 4, "4th": 4, last: -1 };

function parseRule(raw: string) {
  const text = raw.replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();
  if (!text || /awaiting committee confirmation/i.test(text)) {
    return { confidence: 0, ambiguous: true, reason: "awaiting_confirmation" as const };
  }
  const timeMatch = text.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  const time = timeMatch ? timeMatch[1].trim() : null;
  const lastMatch = lower.match(/last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (lastMatch) {
    return { recurrence: "monthly", weekday: lastMatch[1], weekOfMonth: -1, time, confidence: 75, ambiguous: false, rawRule: text };
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
      rawRule: text,
    };
  }
  if (lower.includes("monthly")) {
    return { recurrence: "monthly", time, confidence: 45, ambiguous: true, rawRule: text, reason: "monthly_without_weekday" as const };
  }
  return { recurrence: null, time, confidence: 20, ambiguous: true, rawRule: text, reason: "unparsed" as const };
}

function expandDates(rule: ReturnType<typeof parseRule>, end = "2026-11-01") {
  if (rule.ambiguous || rule.weekOfMonth == null || !rule.weekday) return [] as string[];
  const weekdayIndex = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(rule.weekday);
  if (weekdayIndex < 0) return [];
  const out: string[] = [];
  const endDate = new Date(`${end}T23:59:59`);
  for (let month = 5; month <= 10; month++) {
    const d = nthWeekday(2026, month, weekdayIndex, rule.weekOfMonth);
    if (d && d <= endDate) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function nthWeekday(year: number, month: number, weekday: number, n: number) {
  if (n === -1) {
    const last = new Date(year, month + 1, 0);
    while (last.getDay() !== weekday) last.setDate(last.getDate() - 1);
    return last;
  }
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const dt = new Date(year, month, d);
    if (dt.getMonth() !== month) break;
    if (dt.getDay() === weekday && ++count === n) return dt;
  }
  return null;
}

export function extractRecurrenceFromText(rawText: string): RecurrenceExtractionResult {
  const rule = parseRule(rawText);
  const suggestedFutureDates = !rule.ambiguous && rule.recurrence ? expandDates(rule) : [];
  const missingFields: string[] = [];
  if (!rule.weekday) missingFields.push("weekday");
  if (!rule.time) missingFields.push("time");
  if (rule.ambiguous) missingFields.push("clear_recurrence_rule");

  return {
    recurrence: rule.recurrence
      ? { pattern: rule.recurrence, weekOfMonth: rule.weekOfMonth ?? null, weekday: rule.weekday ?? null, time: rule.time ?? null }
      : null,
    venue: null,
    address: null,
    city: null,
    county: null,
    confidence: rule.confidence ?? 20,
    uncertainty: rule.reason ? [rule.reason] : rule.ambiguous ? ["ambiguous_recurrence"] : [],
    missingFields,
    suggestedFutureDates,
    facts: rule.rawRule ? [`Recurrence text: ${rule.rawRule}`] : [],
    inferences: suggestedFutureDates.length ? [`Projected ${suggestedFutureDates.length} dates from rule`] : [],
  };
}
