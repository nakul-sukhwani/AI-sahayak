export type WorkProofStatus = 'pending' | 'ai_verified' | 'approved' | 'rejected';

export interface WorkProof {
  id: string;
  complaint_id: string;
  worker_id: string;

  // Photos
  before_photo_url: string | null;
  after_photo_url: string;

  // Worker input
  worker_notes: string | null;
  submitted_at: string;

  // AI verification
  ai_verified: boolean | null;
  ai_confidence: number | null;
  ai_observation: string | null;
  ai_remaining_issues: string | null;
  ai_new_issues: string | null;
  ai_analyzed_at: string | null;

  // Human verification
  verified_by: string | null;
  verified_at: string | null;
  status: WorkProofStatus;
  rejection_reason: string | null;
}

export interface WorkProofWithVerifier extends WorkProof {
  verifier?: {
    full_name: string | null;
    display_name: string | null;
  };
}
