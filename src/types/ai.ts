export interface AIAnalysisResult {
  issue_type: string;
  subcategory: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description_en: string;
  description_hi: string;
  suggested_department: string;
  suggested_worker_id: string | null;
  confidence_score: number;
  tags: string[];
  urgency_reason: string;
}

export const AI_ANALYSIS_FALLBACK: AIAnalysisResult = {
  issue_type: 'unknown',
  subcategory: 'unknown',
  severity: 'medium',
  description_en: 'Unable to analyze image automatically. Please provide a description.',
  description_hi: 'छवि का स्वचालित विश्लेषण नहीं हो सका। कृपया विवरण प्रदान करें।',
  suggested_department: 'General',
  suggested_worker_id: null,
  confidence_score: 0,
  tags: [],
  urgency_reason: '',
};

export interface AIProofVerificationResult {
  issue_resolved: boolean;
  confidence: number;
  observation: string;
  remaining_issues: string | null;
  new_issues: string | null;
}

export const AI_PROOF_FALLBACK: AIProofVerificationResult = {
  issue_resolved: false,
  confidence: 0,
  observation: 'Automated verification unavailable. Manual review required.',
  remaining_issues: null,
  new_issues: null,
};
