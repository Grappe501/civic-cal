/**
 * Pass 28 — recurring school board meeting schedule → dated instances.
 */
import { platformConfidence } from "../platform-detector.mjs";

const ORDINALS = {
  first: 1, second: 2, third: 3, fourth: 4, last: -1,
  "1st": 1, "2nd": 2, "3rd": 3, "4th": 4,
};

const WEEKDAYS = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

function nthWeekdayOfMonth(year, month, weekday, nth) {
  if (nth === -1) {
    const d = new Date(Date.UTC(year, month + 1, 0));
    while (d.getUTCDay() !== weekday) d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const d = new Date(Date.UTC(year, month, day));
    if (d.getUTCMonth() !== month) break;
    if (d.getUTCDay() === weekday) {
      count++;
      if (count === nth) return d.toISOString().slice(0, 10);
    }
  }
  return null;
}

function expandRecurrence(rule, until = "2026-11-30") {
  const dates = [];
  const m = rule.match(/(first|second|third|fourth|last|1st|2nd|3rd|4th)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (!m) return dates;

  const nth = ORDINALS[m[1].toLowerCase()];
  const wd = WEEKDAYS[m[2].toLowerCase()];
  if (nth == null || wd == null) return dates;

  for (let month = 5; month <= 10; month++) {
    const y = 2026;
    const d = nthWeekdayOfMonth(y, month, wd, nth);
    if (d && d >= "2026-06-01" && d <= until) dates.push(d);
  }
  return dates;
}

export function parseSchoolBoardRecurring(html, sourceUrl, institutionName) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const patterns = [
    /school board[^.]{0,120}?(first|second|third|fourth|last|1st|2nd|3rd|4th)\s+(monday|tuesday|wednesday|thursday|friday)/i,
    /board of education[^.]{0,120}?(first|second|third|fourth|last|1st|2nd|3rd|4th)\s+(monday|tuesday|wednesday|thursday|friday)/i,
    /board meeting[^.]{0,80}?(first|second|third|fourth|last|1st|2nd|3rd|4th)\s+(monday|tuesday|wednesday|thursday|friday)/i,
  ];

  for (const re of patterns) {
    const hit = text.match(re);
    if (!hit) continue;
    const rule = `${hit[1]} ${hit[2]}`;
    const dates = expandRecurrence(rule);
    if (!dates.length) continue;

    return dates.map((event_date) => ({
      title: `${institutionName ?? "School district"} — School board meeting`,
      event_date,
      source_url: sourceUrl,
      confidence_score: platformConfidence("school_board_recurring"),
      platform: "school_board_recurring",
      raw_text: hit[0].slice(0, 200),
      lane_id: "school_board",
    }));
  }

  return [];
}
