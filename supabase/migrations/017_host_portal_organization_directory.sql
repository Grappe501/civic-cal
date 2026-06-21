-- Pass 18: Host Portal & Organization Directory (public community platform)

CREATE TABLE IF NOT EXISTS civic_call.public_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  host_type TEXT NOT NULL,
  county TEXT NOT NULL,
  city TEXT,
  website TEXT,
  volunteer_page_url TEXT,
  donation_page_url TEXT,
  dossier_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  claim_status TEXT NOT NULL DEFAULT 'unclaimed',
  verified BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS public_organizations_county_idx ON civic_call.public_organizations (county, host_type);
CREATE INDEX IF NOT EXISTS public_organizations_slug_idx ON civic_call.public_organizations (slug);

CREATE TABLE IF NOT EXISTS civic_call.host_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  organization_id UUID REFERENCES civic_call.public_organizations(id) ON DELETE SET NULL,
  county TEXT NOT NULL,
  city TEXT,
  website TEXT,
  volunteer_page_url TEXT,
  contact_email TEXT,
  auth_subject TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE civic_call.events
  ADD COLUMN IF NOT EXISTS host_volunteers_needed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS host_volunteer_signup_url TEXT,
  ADD COLUMN IF NOT EXISTS host_volunteer_needed_count INTEGER,
  ADD COLUMN IF NOT EXISTS host_organization_slug TEXT;

COMMENT ON TABLE civic_call.public_organizations IS 'Public organization directory — churches, schools, VFDs, chambers, etc.';
COMMENT ON TABLE civic_call.host_profiles IS 'Event host accounts (community-first; campaigns use campaign_workspaces)';
