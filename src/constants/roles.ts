import type { UserRole } from '@/types/user';

export const ROLE_LABELS: Record<UserRole, string> = {
  // Existing
  citizen:          'Citizen',
  worker:           'Field Worker',
  supervisor:       'Supervisor',
  officer:          'Verification Officer',
  admin:            'Administrator',
  // SIH 26043 — Extended Submitter Base
  community_org:    'Community Organisation',
  pri_ulb_official: 'PRI / ULB Official',
  // SIH 26043 — University Collaboration
  university_admin: 'University Admin',
  faculty_mentor:   'Faculty Mentor',
  student:          'Student',
  // SIH 26043 — Industry Partnership
  industry_partner: 'Industry Partner',
};

export const ROLE_ICONS: Record<UserRole, string> = {
  // Existing
  citizen:          'person',
  worker:           'construction',
  supervisor:       'supervisor_account',
  officer:          'verified',
  admin:            'admin_panel_settings',
  // SIH 26043 — Extended Submitter Base
  community_org:    'groups',
  pri_ulb_official: 'account_balance',
  // SIH 26043 — University Collaboration
  university_admin: 'school',
  faculty_mentor:   'person_celebrate',
  student:          'backpack',
  // SIH 26043 — Industry Partnership
  industry_partner: 'business',
};

/** All roles that can submit challenges (Module 7 extended submitter base) */
export const SUBMITTER_ROLES: UserRole[] = [
  'citizen',
  'community_org',
  'pri_ulb_official',
  'govt_department' as UserRole, // handled via admin role
  'admin',
];

/** University-side roles (Module 1) */
export const UNIVERSITY_ROLES: UserRole[] = [
  'university_admin',
  'faculty_mentor',
  'student',
];

/** Govt reviewer roles allowed to approve routing decisions (Module 3) */
export const ROUTING_APPROVER_ROLES: UserRole[] = [
  'supervisor',
  'officer',
  'admin',
];

