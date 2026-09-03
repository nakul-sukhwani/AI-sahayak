// src/lib/validators/industry.ts
// Rule 21: Zod schemas are the source of truth.
// Used by: POST /api/industry-partners, POST /api/commitments

import { z } from 'zod';

export const IndustryPartnerTypeSchema = z.enum([
  'startup', 'msme', 'csr', 'research_lab', 'incubator',
]);

export const EngagementTypeSchema = z.enum([
  'mentorship', 'funding', 'prototyping', 'testing', 'deployment',
]);

export const CommitmentStatusSchema = z.enum([
  'interested', 'committed', 'active', 'completed', 'withdrawn',
]);

export const CreateIndustryPartnerSchema = z.object({
  org_name:                    z.string().min(2).max(200),
  partner_type:                IndustryPartnerTypeSchema,
  website_url:                 z.string().url().optional(),
  sectors:                     z.array(z.string().max(80)).min(1).max(15),
  engagement_types:            z.array(EngagementTypeSchema).min(1),
  mentorship_hours_per_month:  z.number().int().min(0).max(500).optional(),
  max_concurrent_engagements:  z.number().int().min(1).max(50).default(3),
  // capability_embedding generated server-side from sectors + engagement_types
}).strict();

export const CreateCommitmentSchema = z.object({
  proposal_id:         z.string().uuid(),
  commitment_type:     EngagementTypeSchema,
  mentorship_hours:    z.number().int().min(1).max(2000).optional(),
  funding_inr:         z.number().min(0).max(1_000_000_000).optional(),
  in_kind_description: z.string().max(1000).optional(),
}).strict().refine(
  (data) => {
    // At least one amount field required for the commitment type
    if (data.commitment_type === 'mentorship')   return data.mentorship_hours !== undefined;
    if (data.commitment_type === 'funding')       return data.funding_inr !== undefined;
    return true; // prototyping/testing/deployment: in_kind_description optional
  },
  { message: 'Provide mentorship_hours for mentorship or funding_inr for funding commitments' }
);

export type IndustryPartnerType    = z.infer<typeof IndustryPartnerTypeSchema>;
export type EngagementType         = z.infer<typeof EngagementTypeSchema>;
export type CommitmentStatus       = z.infer<typeof CommitmentStatusSchema>;
export type CreatePartnerInput     = z.infer<typeof CreateIndustryPartnerSchema>;
export type CreateCommitmentInput  = z.infer<typeof CreateCommitmentSchema>;

export interface IndustryPartner {
  id:                           string;
  org_name:                     string;
  partner_type:                 IndustryPartnerType;
  website_url:                  string | null;
  sectors:                      string[];
  engagement_types:             EngagementType[];
  mentorship_hours_per_month:   number | null;
  max_concurrent_engagements:   number;
  capability_embedding:         number[] | null;
  owner_user_id:                string | null;
  created_at:                   string;
  updated_at:                   string;
}

export interface IndustryCommitment {
  id:                      string;
  proposal_id:             string;
  industry_partner_id:     string;
  commitment_type:         EngagementType;
  mentorship_hours:        number | null;
  funding_inr:             number | null;
  in_kind_description:     string | null;
  status:                  CommitmentStatus;
  signed_off_milestone_id: string | null;
  created_at:              string;
  updated_at:              string;
}
