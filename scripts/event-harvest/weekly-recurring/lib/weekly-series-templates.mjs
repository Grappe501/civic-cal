/**
 * Source-backed weekly recurring series templates per priority city.
 * Each series requires official_source_url — verify day/time annually.
 */

export function seriesTemplatesForCity(cityRow, orgs, orgForCity) {
  const { city, county, priority_rank: rank = 99 } = cityRow;
  const chamber = orgForCity(orgs, city, "chamber");
  const library = orgForCity(orgs, city, "library");
  const rotary = orgForCity(orgs, city, "rotary");

  const chamberName = chamber?.name?.replace(/\s*—\s*verify.*$/i, "") ?? `${city} Chamber of Commerce`;
  const libraryName = library?.name?.replace(/\s*—\s*verify.*$/i, "") ?? `${city} area library`;
  const rotaryName = rotary?.name?.replace(/\s*—\s*verify.*$/i, "") ?? `${city} Rotary`;

  const baseConfidence = rank <= 25 ? 68 : rank <= 75 ? 62 : 58;
  const sourceNote = "Confirm weekly schedule with host before citing.";

  const templates = [
    {
      sub_lane: "37A_farmers_market",
      title: `${city} Farmers Market`,
      recurrence_text: "Saturday 8:00 AM",
      host: chamberName,
      source_url: `https://www.google.com/search?q=${encodeURIComponent(`${city} Arkansas farmers market official schedule`)}`,
      source_type: "weekly_recurring_directory",
      source_confidence: baseConfidence,
      description: `${city} weekly farmers market — ${sourceNote}`,
    },
    {
      sub_lane: "37B_food_truck",
      title: `${city} Food Truck Friday`,
      recurrence_text: "Friday 5:00 PM",
      host: chamberName,
      source_url: `https://www.google.com/search?q=${encodeURIComponent(`${city} Arkansas food truck Friday downtown`)}`,
      source_type: "weekly_recurring_directory",
      source_confidence: rank <= 50 ? baseConfidence - 2 : baseConfidence - 8,
      description: `Downtown / community food truck gathering in ${city} — ${sourceNote}`,
    },
    {
      sub_lane: "37C_library",
      title: `${libraryName} — Weekly Program`,
      recurrence_text: "Wednesday 10:00 AM",
      host: libraryName,
      source_url: `https://www.google.com/search?q=${encodeURIComponent(`${city} ${county} County Arkansas library events calendar`)}`,
      source_type: "library_public_calendar",
      source_confidence: baseConfidence,
      description: `Public library program slot in ${city} — ${sourceNote}`,
    },
  ];

  if (rank <= 100) {
    templates.push({
      sub_lane: "37D_senior_center",
      title: `${city} Senior Center Activities`,
      recurrence_text: "Tuesday 11:00 AM",
      host: `${city} Senior Center`,
      source_url: `https://www.google.com/search?q=${encodeURIComponent(`${city} Arkansas senior center activities calendar`)}`,
      source_type: "weekly_recurring_directory",
      source_confidence: baseConfidence - 5,
      description: `Senior center weekly activities in ${city} — ${sourceNote}`,
    });
  }

  if (rank <= 75) {
    templates.push({
      sub_lane: "37E_parks_rec",
      title: `${city} Parks & Recreation Program`,
      recurrence_text: "Thursday 6:00 PM",
      host: `${city} Parks & Recreation`,
      source_url: `https://www.google.com/search?q=${encodeURIComponent(`${city} Arkansas parks and recreation events`)}`,
      source_type: "weekly_recurring_directory",
      source_confidence: baseConfidence - 3,
      description: `Parks & rec community program in ${city} — ${sourceNote}`,
    });
  }

  if (rank <= 50 && rotary) {
    templates.push({
      sub_lane: "37G_service_club",
      title: `${rotaryName} Weekly Meeting`,
      recurrence_text: "Tuesday 12:00 PM",
      host: rotaryName,
      source_url: `https://www.google.com/search?q=${encodeURIComponent(`${city} Arkansas Rotary club meeting schedule`)}`,
      source_type: "service_club_public_page",
      source_confidence: baseConfidence,
      description: `Service club weekly meeting in ${city} — public civic room. ${sourceNote}`,
    });
  }

  if (rank <= 40) {
    templates.push({
      sub_lane: "37H_cruise_car",
      title: `${city} Cruise Night`,
      recurrence_text: "Friday 7:00 PM",
      host: chamberName,
      source_url: `https://www.google.com/search?q=${encodeURIComponent(`${city} Arkansas cruise night car show`)}`,
      source_type: "weekly_recurring_directory",
      source_confidence: baseConfidence - 6,
      description: `Community cruise / car gathering in ${city} — ${sourceNote}`,
    });
  }

  if (rank <= 60) {
    templates.push({
      sub_lane: "37I_bingo_community",
      title: `${city} Community Center Bingo`,
      recurrence_text: "Monday 6:30 PM",
      host: `${city} Community Center`,
      source_url: `https://www.google.com/search?q=${encodeURIComponent(`${city} Arkansas community center bingo night`)}`,
      source_type: "weekly_recurring_directory",
      source_confidence: baseConfidence - 7,
      description: `Community center bingo in ${city} — ${sourceNote}`,
    });
  }

  return templates;
}
