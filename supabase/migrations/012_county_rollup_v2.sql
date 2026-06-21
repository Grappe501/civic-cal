-- Pass 12: County Rollup 2.0 — county-primary schema marker

COMMENT ON TABLE civic_call.county_intelligence_dossiers IS
  'County-primary intelligence. dossier_json stores County Rollup 2.0 blocks: demographics, political, institutions, media, feeder_cities. Cities feed upward.';

-- Optional: track rollup schema version in JSON (app reads from dossier_json.rollup_version until DB sync)
