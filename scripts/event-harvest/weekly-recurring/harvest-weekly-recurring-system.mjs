#!/usr/bin/env node
/**
 * Pass 37 — Harvest Arkansas Weekly Recurring Life institutions + staged occurrences.
 */
import { getHarvestWindow, isDateInHarvestWindow } from "../lib/harvest-window.mjs";
import { expandWeeklyDates, parseTimeTo24, parseWeeklyRule } from "./lib/parse-weekly-recurrence.mjs";
import { classifyWeeklyLane } from "./lib/weekly-lane-classifier.mjs";
import { seriesTemplatesForCity } from "./lib/weekly-series-templates.mjs";
import {
  loadCivicOrganizations,
  loadPriorityCities,
  orgForCity,
  saveJson,
  slugify,
  loadJson,
} from "./lib/wr-base.mjs";

const CITY_LIMIT = Number(process.env.WR_CITY_LIMIT ?? 100);

function main() {
  const window = getHarvestWindow();
  const cities = loadPriorityCities(CITY_LIMIT);
  const orgs = loadCivicOrganizations();
  const institutions = [];
  const seriesRegistry = [];
  const staged = [];
  const researchTasks = [];

  for (const cityRow of cities) {
    const { city, county } = cityRow;
    const templates = seriesTemplatesForCity(cityRow, orgs, orgForCity);

    for (const tpl of templates) {
      const rule = parseWeeklyRule(tpl.recurrence_text);
      if (rule.ambiguous || !rule.weekday) {
        researchTasks.push({
          id: `wr-research-${slugify(city)}-${tpl.sub_lane}`,
          city,
          county,
          lane: "weekly_recurring_pass37",
          sub_lane: tpl.sub_lane,
          topic: `Parse recurrence: ${tpl.recurrence_text}`,
          priority: "medium",
          status: "open",
          suggested_sources: [tpl.source_url],
          created_at: new Date().toISOString(),
        });
        continue;
      }

      const seriesKey = slugify(`${city}-${tpl.sub_lane}-${rule.weekday}`);
      const instId = `wr-inst-${slugify(city)}-${tpl.sub_lane}`;

      institutions.push({
        id: instId,
        name: tpl.host,
        city,
        county,
        sub_lane: tpl.sub_lane,
        recurrence: rule.recurrence,
        weekday: rule.weekday,
        source_confidence: tpl.source_confidence,
        source_url: tpl.source_url,
      });

      seriesRegistry.push({
        series_key: seriesKey,
        title: tpl.title,
        city,
        county,
        sub_lane: tpl.sub_lane,
        recurrence_rule: tpl.recurrence_text,
        weekday: rule.weekday,
        recurrence: rule.recurrence,
        host: tpl.host,
        source_url: tpl.source_url,
        source_type: tpl.source_type,
        source_confidence: tpl.source_confidence,
        institution_id: instId,
      });

      const dates = expandWeeklyDates(rule, window);
      const laneInfo = classifyWeeklyLane(tpl.title, tpl.sub_lane);
      const time24 = parseTimeTo24(rule.time, tpl.recurrence_text.includes("PM") ? "17:00" : "09:00");

      for (const event_date of dates) {
        if (!isDateInHarvestWindow(event_date, window)) continue;
        staged.push({
          id: slugify(`${seriesKey}-${event_date}`),
          series_key: seriesKey,
          title: tpl.title,
          city,
          county,
          event_date,
          start_time: time24.slice(0, 5),
          description: tpl.description,
          source_url: tpl.source_url,
          source_type: tpl.source_type,
          source_confidence: tpl.source_confidence,
          sub_lane: tpl.sub_lane,
          category: laneInfo.category,
          host_organization: tpl.host,
          is_recurring_series: true,
          recurrence_rule: tpl.recurrence_text,
          harvest_batch: "weekly_recurring_pass37",
          relationship_density_score: 62,
          review_status: "staged",
        });
      }
    }
  }

  saveJson("data/weekly-recurring/weekly-recurring-institution-registry.json", {
    pass: "37",
    label: "Arkansas Weekly Recurring Life",
    generatedAt: new Date().toISOString(),
    harvestWindow: window.label,
    cityCount: cities.length,
    institutionCount: institutions.length,
    institutions,
  });

  saveJson("data/weekly-recurring/weekly-recurring-series-registry.json", {
    pass: "37",
    generatedAt: new Date().toISOString(),
    seriesCount: seriesRegistry.length,
    series: seriesRegistry,
  });

  saveJson("data/ingestion/weekly-recurring-staged.json", {
    pass: "37",
    generatedAt: new Date().toISOString(),
    harvestWindow: window.label,
    candidates: staged,
  });

  const prevTasks = loadJson("data/weekly-recurring/weekly-recurring-research-tasks.json", { tasks: [] });
  const taskById = new Map((prevTasks.tasks ?? []).map((t) => [t.id, t]));
  for (const t of researchTasks) taskById.set(t.id, t);

  saveJson("data/weekly-recurring/weekly-recurring-research-tasks.json", {
    pass: "37",
    generatedAt: new Date().toISOString(),
    openCount: [...taskById.values()].filter((t) => t.status === "open").length,
    tasks: [...taskById.values()],
  });

  console.log(
    `[harvest:weekly-recurring] cities:${cities.length} institutions:${institutions.length} series:${seriesRegistry.length} staged:${staged.length} research:${taskById.size}`,
  );
}

main();
