-- AI Event Intelligence Network — assessments, feedback, contributors, campaign planning

CREATE TABLE IF NOT EXISTS civic_call.event_ai_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES civic_call.events(id) ON DELETE SET NULL,
  candidate_id UUID REFERENCES civic_call.event_ingestion_candidates(id) ON DELETE SET NULL,
  source_type TEXT,
  model TEXT,
  assessment_json JSONB NOT NULL DEFAULT '{}',
  opportunity_score INTEGER,
  relationship_density_score INTEGER,
  estimated_crowd_min INTEGER,
  estimated_crowd_max INTEGER,
  confidence_score INTEGER,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  public_summary TEXT,
  organizer_notes TEXT,
  campaign_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_ai_assessments_event_idx ON civic_call.event_ai_assessments (event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS event_ai_assessments_candidate_idx ON civic_call.event_ai_assessments (candidate_id, created_at DESC);

CREATE TABLE IF NOT EXISTS civic_call.event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES civic_call.events(id) ON DELETE CASCADE,
  submitter_name TEXT,
  submitter_email TEXT,
  submitter_city TEXT,
  submitter_county TEXT,
  crowd_size_estimate INTEGER,
  tradition_years INTEGER,
  local_notes TEXT,
  is_good_for_candidates BOOLEAN,
  why_it_matters TEXT,
  correction_notes TEXT,
  trust_signal TEXT NOT NULL DEFAULT 'new',
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_feedback_event_idx ON civic_call.event_feedback (event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS event_feedback_review_idx ON civic_call.event_feedback (review_status);

CREATE TABLE IF NOT EXISTS civic_call.trusted_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  city TEXT,
  county TEXT,
  role TEXT,
  trust_level TEXT NOT NULL DEFAULT 'new',
  approved_by TEXT,
  help_areas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trusted_contributors_county_idx ON civic_call.trusted_contributors (county);

CREATE TABLE IF NOT EXISTS civic_call.campaign_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  candidate_name TEXT,
  office_sought TEXT,
  district_type TEXT,
  district_name TEXT,
  counties JSONB NOT NULL DEFAULT '[]',
  cities JSONB NOT NULL DEFAULT '[]',
  google_calendar_status TEXT NOT NULL DEFAULT 'not_connected',
  mobilize_status TEXT NOT NULL DEFAULT 'not_connected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS civic_call.campaign_event_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES civic_call.campaign_workspaces(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES civic_call.events(id) ON DELETE CASCADE,
  plan_status TEXT NOT NULL DEFAULT 'considering',
  candidate_attending BOOLEAN NOT NULL DEFAULT false,
  needs_volunteers BOOLEAN NOT NULL DEFAULT false,
  volunteer_goal INTEGER,
  staffing_notes TEXT,
  travel_notes TEXT,
  google_calendar_event_id TEXT,
  mobilize_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, event_id)
);

CREATE INDEX IF NOT EXISTS campaign_event_plans_workspace_idx ON civic_call.campaign_event_plans (workspace_id);

-- Submission trust / anti-spam metadata on public submissions
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS submission_trust_json JSONB;
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS spam_risk_score INTEGER;
ALTER TABLE civic_call.events ADD COLUMN IF NOT EXISTS spam_flags TEXT[];
