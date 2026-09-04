// src/lib/validators/proposal.ts
// Rule 21: Zod schemas are the source of truth.
// Used by: POST /api/universities/:id/proposals, POST /api/proposals/:id/stage

import { z } from 'zod';

export const ProposalStatusSchema = z.enum([
  'draft',
  'submitted',
  'approved',
  'rejected',
  'withdrawn',
]);

export const ProposalContentSchema = z.object({
  problem_understanding:  z.string().min(50).max(3000),
  proposed_approach:      z.string().min(50).max(3000),
  expected_outcomes:      z.string().min(20).max(1000),
  timeline_weeks:         z.number().int().min(1).max(156),
  resource_needs:         z.string().max(1000).default(''),
  needs_industry_support: z.boolean().default(false),
  industry_support_type:  z.array(z.enum([
    'mentorship', 'funding', 'prototyping', 'testing', 'deployment',
  ])).default([]),
});

export const CreateProposalSchema = z.object({
  challenge_id:    z.string().uuid(),
  university_id:   z.string().uuid(),
  team_members:    z.array(z.string().uuid()).max(20).default([]),
  content:         ProposalContentSchema,
  attachment_urls: z.array(z.string().url()).max(10).default([]),
}).strict();

export const StageTransitionSchema = z.object({
  to_status: ProposalStatusSchema,
  note:      z.string().max(500).optional(),
}).strict();

export type ProposalStatus       = z.infer<typeof ProposalStatusSchema>;
export type ProposalContent      = z.infer<typeof ProposalContentSchema>;
export type CreateProposalInput  = z.infer<typeof CreateProposalSchema>;
export type StageTransitionInput = z.infer<typeof StageTransitionSchema>;

export interface Proposal {
  id:                string;
  challenge_id:      string;
  university_id:     string;
  faculty_mentor_id: string;
  team_members:      string[];
  content:           ProposalContent;
  attachment_urls:   string[];
  status:            ProposalStatus;
  created_at:        string;
  updated_at:        string;
}
