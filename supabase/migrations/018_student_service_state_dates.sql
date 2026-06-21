-- Pass 19: Student service matching + statewide dates

CREATE TABLE IF NOT EXISTS civic_call.student_service_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES civic_call.events(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES civic_call.public_organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  city TEXT,
  county TEXT NOT NULL,
  service_category TEXT NOT NULL,
  eligible_grades TEXT,
  estimated_hours NUMERIC,
  recurring BOOLEAN NOT NULL DEFAULT false,
  verified_entity BOOLEAN NOT NULL DEFAULT false,
  verification_status TEXT NOT NULL DEFAULT 'needs_review',
  signup_url TEXT,
  contact_url TEXT,
  source_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_service_opportunities_county_idx
  ON civic_call.student_service_opportunities (county, service_category);
CREATE INDEX IF NOT EXISTS student_service_opportunities_verified_idx
  ON civic_call.student_service_opportunities (verified_entity, verification_status);

CREATE TABLE IF NOT EXISTS civic_call.student_service_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES civic_call.student_service_opportunities(id) ON DELETE CASCADE,
  student_first_name TEXT,
  parent_guardian_email TEXT,
  school_name TEXT,
  city TEXT,
  county TEXT,
  requested_hours NUMERIC,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_service_interest_status_idx
  ON civic_call.student_service_interest (status, created_at DESC);

CREATE TABLE IF NOT EXISTS civic_call.state_calendar_dates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  end_date DATE,
  category TEXT NOT NULL,
  subcategory TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  applies_statewide BOOLEAN NOT NULL DEFAULT true,
  county TEXT,
  city TEXT,
  notes TEXT,
  season_year TEXT,
  species TEXT,
  method TEXT,
  zone TEXT,
  verification_status TEXT NOT NULL DEFAULT 'verified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS state_calendar_dates_date_idx
  ON civic_call.state_calendar_dates (date, category);
CREATE INDEX IF NOT EXISTS state_calendar_dates_county_idx
  ON civic_call.state_calendar_dates (county, date);

COMMENT ON TABLE civic_call.student_service_opportunities IS 'Verified-entity volunteer opportunities eligible for AR 75-hour graduation service (grades 9–12, class of 2027+).';
COMMENT ON TABLE civic_call.student_service_interest IS 'Student interest routed to admin/host review — no public student profiles.';
COMMENT ON TABLE civic_call.state_calendar_dates IS 'Official statewide dates: elections, hunting/fishing (sourced), school, civic deadlines.';
