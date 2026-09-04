// src/lib/validators/challenge.ts
// Rule 21: Zod schemas are the source of truth. Types are derived via z.infer<>.
// Used by: POST /api/challenges, GET /api/challenges/[id]/route-suggestions

import { z } from 'zod';

export const ChallengeStatusSchema = z.enum([
  'submitted',
  'routed',
  'accepted',
  'team_formed',
  'proposal_submitted',
  'in_progress',
  'testing',
  'deployed',
  'closed',
  'rejected',
  'stalled',
]);

export const SubmitterTypeSchema = z.enum([
  'citizen',
  'community_org',
  'pri_ulb_official',
  'govt_department',
  'admin',
]);

export const CreateChallengeSchema = z.object({
  title:                   z.string().min(10).max(200),
  description:             z.string().min(30).max(5000),
  domain:                  z.string().min(2).max(100),
  tags:                    z.array(z.string().max(50)).max(10).default([]),
  submitter_type:          SubmitterTypeSchema,
  submitted_on_behalf_of:  z.string().max(200).optional(),
  district:                z.string().max(100).optional(),
  address:                 z.string().max(500).optional(),
  // lat/lng optional — may not have precise GPS for all org types
  latitude:                z.number().min(-90).max(90).optional(),
  longitude:               z.number().min(-180).max(180).optional(),
  image_url:               z.string().url().optional(),
  voice_url:               z.string().url().optional(),
  document_urls:           z.array(z.string().url()).max(5).default([]),
}).strict();

export type CreateChallengeInput = z.infer<typeof CreateChallengeSchema>;
export type ChallengeStatus      = z.infer<typeof ChallengeStatusSchema>;
export type SubmitterType        = z.infer<typeof SubmitterTypeSchema>;

// Full Challenge row (matches challenges table columns)
export interface Challenge {
  id:                     string;
  submitted_by:           string;
  submitter_type:         SubmitterType;
  submitted_on_behalf_of: string | null;
  title:                  string;
  description:            string;
  domain:                 string;
  tags:                   string[];
  challenge_embedding:    number[] | null; // only populated server-side
  location:               unknown | null;  // PostGIS geography — opaque to client
  district:               string | null;
  state:                  string;
  address:                string | null;
  image_url:              string | null;
  voice_url:              string | null;
  document_urls:          string[];
  status:                 ChallengeStatus;
  status_updated_at:      string;
  created_at:             string;
  updated_at:             string;
}
