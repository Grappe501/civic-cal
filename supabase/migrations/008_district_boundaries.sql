-- District Boundary Engine — boundary definitions + campaign linkage

CREATE TABLE IF NOT EXISTS civic_call.district_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_type TEXT NOT NULL,
  district_code TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  counties_whole JSONB NOT NULL DEFAULT '[]',
  counties_partial JSONB NOT NULL DEFAULT '[]',
  cities JSONB NOT NULL DEFAULT '[]',
  near_counties JSONB NOT NULL DEFAULT '[]',
  centroid_lat NUMERIC(10, 7),
  centroid_lng NUMERIC(10, 7),
  near_radius_miles INTEGER DEFAULT 35,
  geojson JSONB,
  bbox JSONB,
  boundary_precision TEXT NOT NULL DEFAULT 'county_fallback',
  boundary_source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (district_type, district_code)
);

CREATE INDEX IF NOT EXISTS district_boundaries_type_code_idx ON civic_call.district_boundaries (district_type, district_code);

ALTER TABLE civic_call.campaign_workspaces ADD COLUMN IF NOT EXISTS district_boundary_slug TEXT;

COMMENT ON TABLE civic_call.district_boundaries IS
  'Arkansas district boundaries — county lists now, GeoJSON polygons as GIS pass expands';
