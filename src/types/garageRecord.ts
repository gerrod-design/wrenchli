export type RecordLayer = "reported" | "observed";
export type TimelineCategory =
  | "title"
  | "odometer"
  | "recall"
  | "damage"
  | "service"
  | "condition_check"
  | "document"
  | "shop_visit"
  | "baseline";
export type SourceType = "owner" | "technician" | "shop" | "document" | "system";
export type ConditionStatus = "not_checked" | "checked_ok" | "checked_issue";
export type BaselineResponseValue = "ok" | "issue" | "skipped";
export type Sense = "sight" | "sound" | "smell" | "feel";

export interface GarageMediaRef {
  bucket: string;
  path: string;
  name?: string;
  contentType?: string;
  kind?: "photo" | "video" | "audio" | "document" | "other";
}

export interface GarageVehicle {
  id: string;
  user_id: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  nickname?: string | null;
  vin?: string | null;
  photo_url?: string | null;
  /** @deprecated Batch 5 (R-50): mileage is derived from the readings
   * ledger (deriveLatestReading), never a stored attribute. The database
   * column is dropped; this field is never populated. */
  current_mileage?: number | null;
  created_at?: string;
  // Batch 5 (R-57): owner-supplied profile fields + their provenance.
  annual_mileage_estimate?: number | null;
  driving_style?: string | null;
  usage_type?: string | null;
  profile_provenance?: Record<string, { source: string; recorded_at: string }> | null;
  // Batch 5 (spec SS5): VIN-decoded identity, distinct from display strings.
  vin_decoded_line?: string | null;
  vin_decoded_trim?: string | null;
  vin_decoded_series?: string | null;
  vin_decoded_body?: string | null;
  vin_decoded_drivetrain?: string | null;
  vin_decoded_year?: number | null;
  vin_decoded_make?: string | null;
  vin_decode_provider?: string | null;
  vin_decoded_at?: string | null;
  vin_trim_known_gap?: boolean;
}

export interface VehicleTimelineEvent {
  id: string;
  vehicle_id: string;
  owner_user_id: string;
  vin?: string | null;
  layer: RecordLayer;
  category: TimelineCategory;
  title: string;
  detail?: string | null;
  source_type: SourceType;
  source_name: string;
  occurred_at: string;
  captured_at: string;
  odometer?: number | null;
  media: GarageMediaRef[];
  baseline_id?: string | null;
  condition_check_id?: string | null;
  weak_point_check_id?: string | null;
  created_at: string;
}

export interface VehicleConditionCheck {
  id: string;
  vehicle_id: string;
  owner_user_id: string;
  baseline_id?: string | null;
  weak_point_check_id?: string | null;
  check_key: string;
  label: string;
  category: string;
  sense?: Sense | null;
  status: ConditionStatus;
  last_checked_at?: string | null;
  last_source_type?: SourceType | null;
  last_source_name?: string | null;
  evidence_media: GarageMediaRef[];
  note?: string | null;
  updated_at: string;
}

export interface WeakPointCheck {
  id: string;
  slug: string;
  make: string;
  model: string;
  generation?: string | null;
  year_start: number;
  year_end: number;
  applicability_notes?: string | null;
  title: string;
  instruction: string;
  why_it_matters: string;
  sense: Sense;
  citation_label: string;
  citation_details: string;
  citation_url?: string | null;
  sort_order: number;
}

export interface VehicleBaseline {
  id: string;
  vehicle_id: string;
  owner_user_id: string;
  vin?: string | null;
  status: "in_progress" | "completed" | "abandoned";
  odometer?: number | null;
  started_at: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleBaselineResponse {
  id: string;
  baseline_id: string;
  vehicle_id: string;
  owner_user_id: string;
  weak_point_check_id?: string | null;
  check_key: string;
  check_label: string;
  response: BaselineResponseValue;
  skip_reason?: string | null;
  note?: string | null;
  media: GarageMediaRef[];
  source_type: SourceType;
  source_name: string;
  responded_at: string;
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  timeline_event_id?: string | null;
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  content_type?: string | null;
  byte_size?: number | null;
  document_kind: string;
  layer: RecordLayer;
  source_name: string;
  created_at: string;
}

export interface VehicleSharePermissionFields {
  id: string;
  vehicle_id: string;
  grantee_user_id?: string | null;
  grantee_email?: string | null;
  expires_at?: string | null;
  include_reported_history: boolean;
  include_observed_condition: boolean;
  include_baselines: boolean;
  redact_vin: boolean;
  redact_odometer: boolean;
  redact_documents: boolean;
  redact_source_names: boolean;
  status: "draft" | "active" | "revoked" | "expired";
}
