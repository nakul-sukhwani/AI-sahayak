import { z } from 'zod';

export const DAMAGE_TYPES = [
  'Pothole/Cracked Surface',
  'Water Leakage/Flooding',
  'Debris/Blockage',
  'Structural Breakdown',
  'Electrical/Wiring Danger',
  'Other',
] as const;

export type DamageType = (typeof DAMAGE_TYPES)[number];

export const workerJobReportSchema = z.object({
  id: z.string().uuid().optional(),
  work_proof_id: z.string().uuid(),
  worker_issues: z.string().nullable().optional(),
  damage_type: z.enum(DAMAGE_TYPES),
  tools_required: z.array(z.string()).default([]),
  team_members_count: z.number().int().min(1).default(1),
  captured_latitude: z.number().min(-90).max(90),
  captured_longitude: z.number().min(-180).max(180),
  captured_at: z.string().datetime(),
});

export type WorkerJobReport = z.infer<typeof workerJobReportSchema>;

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
