-- Pass 10: Event Intelligence Dossiers + research task queue

CREATE TABLE IF NOT EXISTS civic_call.event_intelligence_dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES civic_call.events(id) ON DELETE CASCADE,
  host_organization TEXT,
  host_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  official_website TEXT,
  social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  ticket_cost TEXT,
  vendor_options TEXT,
  sponsor_options TEXT,
  parking_info TEXT,
  accessibility_info TEXT,
  indoor_outdoor TEXT,
  food_available TEXT,
  restroom_info TEXT,
  family_friendly BOOLEAN,
  expected_attendance_min INTEGER,
  expected_attendance_max INTEGER,
  historical_notes TEXT,
  years_running INTEGER,
  recurring_pattern TEXT,
  candidate_guidance TEXT,
  volunteer_guidance TEXT,
  local_customs TEXT,
  what_to_wear TEXT,
  arrival_advice TEXT,
  best_time_to_arrive TEXT,
  campaign_risk_notes TEXT,
  event_format TEXT,
  unanswered_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  confirmed_facts JSONB NOT NULL DEFAULT '[]'::jsonb,
  likely_inferences JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_status TEXT NOT NULL DEFAULT 'needs_review',
  confidence_score INTEGER NOT NULL DEFAULT 0,
  last_researched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_dossiers_verification_idx ON civic_call.event_intelligence_dossiers (verification_status);
CREATE INDEX IF NOT EXISTS event_dossiers_confidence_idx ON civic_call.event_intelligence_dossiers (confidence_score);

CREATE TABLE IF NOT EXISTS civic_call.event_research_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES civic_call.events(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  task_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to TEXT,
  result_notes TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_research_tasks_event_idx ON civic_call.event_research_tasks (event_id, status);
