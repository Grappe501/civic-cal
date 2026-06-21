-- Event Intelligence Harvester — staged candidates (never auto-published)
CREATE TABLE IF NOT EXISTS civic_call.event_ingestion_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  start_time TEXT,
  end_time TEXT,
  venue_name TEXT,
  address TEXT,
  city TEXT,
  county TEXT,
  state TEXT NOT NULL DEFAULT 'AR',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  category TEXT,
  civic_value TEXT,
  political_opportunity_score INTEGER,
  confidence_score INTEGER,
  source_name TEXT,
  source_url TEXT,
  source_type TEXT,
  discovered_by TEXT,
  raw_text TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  duplicate_of_event_id UUID,
  notes TEXT,
  is_recurring_annual BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ingestion_candidates_review_idx ON civic_call.event_ingestion_candidates (review_status);
CREATE INDEX IF NOT EXISTS ingestion_candidates_county_idx ON civic_call.event_ingestion_candidates (county);
CREATE INDEX IF NOT EXISTS ingestion_candidates_score_idx ON civic_call.event_ingestion_candidates (political_opportunity_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS ingestion_candidates_date_idx ON civic_call.event_ingestion_candidates (event_date);
