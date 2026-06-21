-- Pass 16: Community Anchor Intelligence Engine

CREATE TABLE IF NOT EXISTS civic_call.extension_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county TEXT NOT NULL UNIQUE,
  office_name TEXT NOT NULL,
  address TEXT,
  website TEXT,
  calendar_url TEXT,
  newsletter_url TEXT,
  dossier_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS civic_call.homemaker_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_name TEXT NOT NULL,
  county TEXT NOT NULL,
  city TEXT,
  dossier_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS homemaker_clubs_county_idx ON civic_call.homemaker_clubs (county);

COMMENT ON TABLE civic_call.extension_offices IS 'Cooperative Extension — agriculture, 4-H, FCS agents; public listings only';
COMMENT ON TABLE civic_call.homemaker_clubs IS 'Extension Homemaker clubs — overlooked county relationship networks';
