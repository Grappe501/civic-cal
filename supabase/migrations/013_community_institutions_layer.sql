-- Pass 14: Community Institutions Layer

CREATE TABLE IF NOT EXISTS civic_call.church_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_name TEXT NOT NULL,
  city TEXT NOT NULL,
  county TEXT NOT NULL,
  dossier_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  size_category TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  last_verified TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (church_name, city, county)
);

CREATE TABLE IF NOT EXISTS civic_call.school_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL,
  city TEXT NOT NULL,
  county TEXT NOT NULL,
  district TEXT,
  dossier_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified BOOLEAN NOT NULL DEFAULT false,
  last_verified TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS civic_call.college_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  county TEXT NOT NULL,
  dossier_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS civic_call.civic_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_type TEXT NOT NULL,
  city TEXT NOT NULL,
  county TEXT NOT NULL,
  dossier_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS church_directory_county_idx ON civic_call.church_directory (county, city);
CREATE INDEX IF NOT EXISTS school_directory_county_idx ON civic_call.school_directory (county, city);

COMMENT ON TABLE civic_call.church_directory IS 'Community Institutions Layer — do not guess attendance; size_category only when verified';
