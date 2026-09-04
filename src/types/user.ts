export type UserRole =
  // Existing roles
  | 'citizen'
  | 'worker'
  | 'supervisor'
  | 'officer'
  | 'admin'
  // SIH 26043 — Extended Submitter Base (Module 7)
  | 'community_org'
  | 'pri_ulb_official'
  // SIH 26043 — University Collaboration (Module 1)
  | 'university_admin'
  | 'faculty_mentor'
  | 'student'
  // SIH 26043 — Industry Partnership (Module 2)
  | 'industry_partner';

export type IndustryPartnerType =
  | 'startup'
  | 'msme'
  | 'csr'
  | 'research_lab'
  | 'incubator';

export interface UserProfile {
  id: string;
  phone: string;
  full_name: string | null;
  display_name: string | null;
  ward_name: string | null;
  role: UserRole;
  // SIH 26043: populated for community_org / pri_ulb_official / industry_partner
  submitter_org_name: string | null;
  created_at: string;
  updated_at: string;
}
