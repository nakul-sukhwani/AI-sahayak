import type { UserRole } from '@/types/user';

export const ROLE_LABELS: Record<UserRole, string> = {
  citizen:    'Citizen',
  worker:     'Field Worker',
  supervisor: 'Supervisor',
  officer:    'Verification Officer',
  admin:      'Administrator',
};

export const ROLE_ICONS: Record<UserRole, string> = {
  citizen:    'person',
  worker:     'construction',
  supervisor: 'supervisor_account',
  officer:    'verified',
  admin:      'admin_panel_settings',
};
