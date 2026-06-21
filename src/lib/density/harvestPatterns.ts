/** Harvest target patterns — institution-first event generation, not invented dates. */
export const CHURCH_HARVEST_PATTERNS = [
  "Fish Fry",
  "Spaghetti Dinner",
  "BBQ Fundraiser",
  "Pancake Breakfast",
  "VBS",
  "Trunk or Treat",
  "Community Thanksgiving Meal",
  "Homecoming",
];

export const SCHOOL_HARVEST_PATTERNS = [
  "School Board Meeting",
  "Homecoming",
  "Football Game",
  "Basketball Game",
  "Band Competition",
  "Graduation",
  "Senior Night",
];

export const COLLEGE_HARVEST_PATTERNS = ["Home Sports Event", "Concert", "Guest Speaker", "Community Event"];

export const CITY_FEED_SOURCE_TYPES = [
  "city_official",
  "county_official",
  "school_district",
  "library",
  "parks_rec",
  "chamber",
  "tourism",
  "extension",
  "four_h",
  "vfd",
] as const;
