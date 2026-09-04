// src/lib/validators/milestone.ts
// Rule 21: Zod schemas are the source of truth.
// Used by: POST /api/proposals/:id/milestones, PATCH /api/milestones/:id

import { z } from 'zod';

export const MilestoneStatusSchema = z.enum([
  'pending', 'in_progress', 'completed', 'overdue', 'cancelled',
]);

export const DeploymentStatusSchema = z.enum([
  'none', 'prototype', 'pilot', 'deployed', 'scaled',
]);

export const CreateMilestoneSchema = z.object({
  proposal_id:  z.string().uuid(),
  title:        z.string().min(5).max(200),
  description:  z.string().max(1000).optional(),
  order_index:  z.number().int().min(0).max(100).default(0),
  owner_id:     z.string().uuid(),
  due_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'due_date must be YYYY-MM-DD'),
}).strict();

export const UpdateMilestoneSchema = z.object({
  status:       MilestoneStatusSchema.optional(),
  evidence_url: z.string().url().optional(),
  description:  z.string().max(1000).optional(),
  due_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict().refine(
  (d) => Object.keys(d).length > 0,
  { message: 'At least one field required for update' }
);

export const UpdateOutcomesSchema = z.object({
  patents_filed:      z.number().int().min(0).optional(),
  publications:       z.number().int().min(0).optional(),
  startup_spun_off:   z.boolean().optional(),
  startup_name:       z.string().max(200).optional(),
  deployment_status:  DeploymentStatusSchema.optional(),
  deployment_notes:   z.string().max(1000).optional(),
}).strict();

export type MilestoneStatus    = z.infer<typeof MilestoneStatusSchema>;
export type DeploymentStatus   = z.infer<typeof DeploymentStatusSchema>;
export type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof UpdateMilestoneSchema>;
export type UpdateOutcomesInput  = z.infer<typeof UpdateOutcomesSchema>;

export interface ProjectMilestone {
  id:           string;
  proposal_id:  string;
  title:        string;
  description:  string | null;
  order_index:  number;
  owner_id:     string;
  due_date:     string;
  status:       MilestoneStatus;
  evidence_url: string | null;
  created_at:   string;
  updated_at:   string;
}

export interface ProjectOutcome {
  id:                string;
  proposal_id:       string;
  patents_filed:     number;
  publications:      number;
  startup_spun_off:  boolean;
  startup_name:      string | null;
  deployment_status: DeploymentStatus;
  deployment_notes:  string | null;
  created_at:        string;
  updated_at:        string;
}

export interface ProjectAuditEntry {
  id:           number;
  proposal_id:  string;
  actor_id:     string;
  entity_type:  'proposal' | 'milestone' | 'routing' | 'commitment';
  entity_id:    string;
  from_status:  string | null;
  to_status:    string;
  note:         string | null;
  created_at:   string;
}
