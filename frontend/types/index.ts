export type DomainId = 
  | 'immigration_officers'
  | 'border_security'
  | 'airport_security'
  | 'immigration_departments'
  | 'law_enforcement'
  | 'airline'
  | 'immigration'
  | 'border_travel';

export interface DomainInfo {
  id: DomainId;
  name: string;
  code: string;
  description: string;
  icon: string;
  color: string;
  badge: string;
}

export type DocumentTypeId =
  | 'passport'
  | 'visa'
  | 'national_id'
  | 'driving_license'
  | 'residence_permit'
  | 'work_permit'
  | 'travel_authorization'
  | 'travel_permit'
  | 'boarding_pass'
  | 'eticket'
  | 'compare_documents'
  | 'other'
  | 'face_verification';

export interface DocumentTypeInfo {
  id: DocumentTypeId;
  name: string;
  category: string;
  description: string;
  icon: string;
  has_mrz: boolean;
  badge: string;
}

export type RiskLevel = 'LOW_RISK' | 'REVIEW_RECOMMENDED' | 'HIGH_RISK' | 'UNABLE_TO_DETERMINE';

export interface RiskContributor {
  title: string;
  points: number;
  severity: 'low' | 'medium' | 'high' | 'positive';
  description: string;
}

export interface RiskAssessment {
  risk_score: number;
  risk_level: RiskLevel;
  contributors: RiskContributor[];
  explanation: {
    summary: string;
    checks_passed: string[];
    checks_failed: string[];
    legal_disclaimer?: string;
  };
  recommendation: string;
}

export interface OCRResult {
  raw_text?: string;
  structured_fields?: Record<string, any>;
  average_confidence: number;
  bounding_boxes?: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }>;
}

export interface MRZResult {
  mrz_detected: boolean;
  mrz_text?: string;
  document_number?: string;
  date_of_birth?: string;
  expiry_date?: string;
  nationality?: string;
  issuer?: string;
  sex?: string;
  checksums?: {
    document_number?: boolean;
    date_of_birth?: boolean;
    expiry_date?: boolean;
    composite?: boolean;
  };
  is_valid: boolean;
  confidence: number;
  field_matches?: {
    document_number_match?: boolean;
    date_of_birth_match?: boolean;
    expiry_date_match?: boolean;
    nationality_match?: boolean;
  };
}

export interface ValidationItem {
  check_name: string;
  status: 'PASS' | 'WARNING' | 'FAIL' | 'INFO';
  severity: 'low' | 'medium' | 'high' | 'info';
  message: string;
  details?: Record<string, any>;
}

export interface SuspiciousRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  reason: string;
  score: number;
}

export interface TamperingResult {
  tampering_detected: boolean;
  score: number;
  confidence: number;
  status: 'CLEAR' | 'REVIEW_RECOMMENDED' | 'HIGH_ANOMALY';
  suspicious_regions?: SuspiciousRegion[];
  heatmap_path?: string;
  heatmap_base64?: string;
  signals?: {
    vit_transformer_entropy?: number;
    ela_metric?: number;
    fft_high_freq_ratio?: number;
    noise_variance_inconsistency?: number;
    jpeg_quantization_uniformity?: number;
    compression_block_anomaly?: number;
    model_used?: string;
  };
}

export interface FaceResult {
  face_detected_document: boolean;
  face_detected_live: boolean;
  face_count_document: number;
  face_count_live: number;
  similarity: number;
  status: 'MATCH_SIGNAL' | 'LOW_MATCH_SIGNAL' | 'MISMATCH_SIGNAL' | 'UNABLE_TO_VERIFY' | 'NOT_EVALUATED';
  confidence: number;
  document_face_box?: { x: number; y: number; width: number; height: number };
  live_face_box?: { x: number; y: number; width: number; height: number };
}

export interface UploadedDoc {
  id: string;
  screening_id: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  doc_role?: string;
  report_path?: string;
  created_at: string;
}

export interface PersonRecord {
  id: string;
  reference_id: string;
  domain: DomainId;
  status: string;
  metadata_info?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  screening_count?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'high_risk' | 'completed' | 'warning' | 'system';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  domain: DomainId;
  organization: string;
  avatar_url?: string;
  created_at: string;
  screenings_completed?: number;
  status?: string;
}

export interface ScreeningDetail {
  id: string;
  person_name?: string;
  person_reference_id?: string;
  domain: DomainId;
  document_type: DocumentTypeId;
  travel_reference?: Record<string, any>;
  status: 'created' | 'queued' | 'processing' | 'completed' | 'failed';
  stage: string;
  risk_score: number;
  risk_level: RiskLevel;
  manual_review_required: boolean;
  is_demo: boolean;
  created_at: string;
  completed_at?: string;
  documents: UploadedDoc[];
  ocr_result?: OCRResult;
  mrz_result?: MRZResult;
  validation_results: ValidationItem[];
  tampering_result?: TamperingResult;
  face_result?: FaceResult;
  risk_assessment?: RiskAssessment;
  quality_result?: {
    is_usable: boolean;
    status: string;
    score: number;
    sharpness_index?: number;
    issues?: string[];
    recommendation?: string;
  };
  classification_result?: {
    expected_type: string;
    detected_type: string;
    confidence: number;
    status: string;
    message?: string;
    cues?: string[];
  };
  consistency_result?: {
    is_consistent: boolean;
    discrepancies?: Array<{ field: string; message: string }>;
    summary?: string;
  };
  individual_analyses?: Record<string, any>;
  documents_requiring_recheck?: Array<{ document_type: string; reason: string; what_to_verify: string }>;
  documents_with_no_issues?: string[];
  next_checkpoint_notes?: string[];
}

export type ScreeningResult = ScreeningDetail;

export interface AnalyticsData {
  total_screenings: number;
  screenings_today: number;
  screenings_this_week: number;
  risk_distribution: {
    low_risk: number;
    review_recommended: number;
    high_risk: number;
    unable_to_determine: number;
  };
  document_distribution: Record<string, number>;
  average_risk_score: number;
  average_processing_time_sec: number;
  is_empty: boolean;
}
