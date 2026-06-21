-- Arkansas Everywhere — civic_call schema (firewalled from campaign tables)
-- Apply with same DATABASE_URL / Supabase project as RedDirt.

CREATE SCHEMA IF NOT EXISTS civic_call;

CREATE TYPE civic_call.event_status AS ENUM ('pending', 'approved', 'rejected', 'archived');
CREATE TYPE civic_call.event_source AS ENUM ('seed', 'public_submission', 'admin', 'import');

CREATE TABLE IF NOT EXISTS civic_call.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT false,
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  city TEXT,
  county TEXT NOT NULL,
  address TEXT,
  location_name TEXT,
  category TEXT NOT NULL,
  host_organization TEXT,
  contact_name TEXT,
  contact_email TEXT,
  website_url TEXT,
  image_url TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  is_public_government_meeting BOOLEAN NOT NULL DEFAULT false,
  candidate_relevant BOOLEAN NOT NULL DEFAULT false,
  is_family_friendly BOOLEAN NOT NULL DEFAULT false,
  is_free BOOLEAN NOT NULL DEFAULT true,
  high_civic_value BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  status civic_call.event_status NOT NULL DEFAULT 'pending',
  source civic_call.event_source NOT NULL DEFAULT 'public_submission',
  source_ref TEXT,
  submitter_name TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS events_county_start_idx ON civic_call.events (county, start_at);
CREATE INDEX IF NOT EXISTS events_status_start_idx ON civic_call.events (status, start_at);
CREATE INDEX IF NOT EXISTS events_category_idx ON civic_call.events (category);
CREATE INDEX IF NOT EXISTS events_featured_idx ON civic_call.events (featured) WHERE featured = true;

COMMENT ON SCHEMA civic_call IS 'Arkansas Everywhere public civic calendar — isolated from campaign OS tables';
