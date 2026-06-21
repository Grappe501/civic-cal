export type CandidateRaceType = "partisan" | "nonpartisan" | "judicial";

export interface CandidateRegistryEntry {
  id: string;
  slug: string;
  dashboard_slug: string | null;
  name: string;
  office: string;
  party: string | null;
  race_type: CandidateRaceType;
  district: string | null;
  county: string | null;
  city: string | null;
  website: string | null;
  public_contact: string | null;
  source_url: string;
  source: string;
  filing_status: string;
  filing_date: string | null;
  verification_status: string;
  has_dashboard: boolean;
}
