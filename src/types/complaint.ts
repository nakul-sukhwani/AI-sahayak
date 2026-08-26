export type ComplaintSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ComplaintStatus =
  | 'draft'
  | 'filed'
  | 'assigned'
  | 'in_progress'
  | 'proof_submitted'
  | 'resolved'
  | 'rejected';

export type ComplaintVisibility = 'private' | 'public' | 'shared';

export interface Complaint {
  id: string;
  user_id: string;

  // Location
  latitude: number;
  longitude: number;
  address: string | null;
  ward_name: string | null;

  // Issue
  issue_type: string;
  subcategory: string | null;
  severity: ComplaintSeverity;

  // Content
  description_en: string;
  description_hi: string | null;
  user_notes: string | null;

  // AI metadata
  ai_confidence: number | null;
  ai_tags: string[] | null;
  ai_urgency_reason: string | null;
  ai_suggested_department: string | null;

  // Privacy
  is_anonymous: boolean;
  visibility: ComplaintVisibility;

  // Authority
  suggested_authority_id: number | null;

  // Assignment
  ai_suggested_worker_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;

  // Media
  image_url: string;
  voice_url: string | null;

  // Status
  status: ComplaintStatus;
  status_updated_at: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ComplaintWithProfile extends Complaint {
  users_profile?: {
    full_name: string | null;
    display_name: string | null;
    phone: string;
  };
}
