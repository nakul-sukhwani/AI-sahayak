// src/lib/validators/university.ts
// Rule 21: Zod schemas are the source of truth.
// Used by: POST /api/universities, GET /api/universities/:id/challenges

import { z } from 'zod';

export const CreateUniversitySchema = z.object({
  name:                  z.string().min(3).max(200),
  short_name:            z.string().max(50).optional(),
  district:              z.string().max(100),
  state:                 z.string().max(100).default('Jharkhand'),
  address:               z.string().max(500).optional(),
  latitude:              z.number().min(-90).max(90).optional(),
  longitude:             z.number().min(-180).max(180).optional(),
  disciplines:           z.array(z.string().max(100)).min(1).max(30),
  incubation_facilities: z.record(z.unknown()).optional(),
  innovation_cell:       z.boolean().default(false),
  website_url:           z.string().url().optional(),
  admin_user_id:         z.string().uuid().optional(),
}).strict();

export const CreateExpertiseSchema = z.object({
  university_id: z.string().uuid(),
  domain:        z.string().min(2).max(100),
  description:   z.string().min(20).max(2000),
  // expertise_embedding is generated server-side; never accepted from client
}).strict();

export type CreateUniversityInput = z.infer<typeof CreateUniversitySchema>;
export type CreateExpertiseInput  = z.infer<typeof CreateExpertiseSchema>;

export interface University {
  id:                    string;
  name:                  string;
  short_name:            string | null;
  district:              string | null;
  state:                 string;
  address:               string | null;
  location:              unknown | null;
  disciplines:           string[];
  incubation_facilities: Record<string, unknown> | null;
  innovation_cell:       boolean;
  website_url:           string | null;
  admin_user_id:         string | null;
  created_at:            string;
  updated_at:            string;
}

export interface UniversityExpertise {
  id:                  string;
  university_id:       string;
  domain:              string;
  description:         string;
  expertise_embedding: number[] | null;
  created_at:          string;
  updated_at:          string;
}

export interface RoutingSuggestion {
  university_id:    string;
  university_name:  string;
  district:         string | null;
  similarity_score: number;
  distance_km:      number | null;
  rank:             number;
  matched_domain:   string;
}
