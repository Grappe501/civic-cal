/** Harvest date horizon — default now through election calendar last day (Nov 3, 2026). */
export function getHarvestWindow() {
  const start = process.env.EVENT_HARVEST_START_DATE || "2026-06-20";
  const end = process.env.EVENT_HARVEST_END_DATE || "2026-11-03";
  return { start, end, label: `${start} → ${end}` };
}

export function isDateInHarvestWindow(dateStr, window = getHarvestWindow()) {
  if (!dateStr) return true;
  const d = dateStr.slice(0, 10);
  return d >= window.start && d <= window.end;
}

export function harvestBatchId() {
  return process.env.HARVEST_BATCH_ID || `top200-${getHarvestWindow().end.slice(0, 7)}`;
}
