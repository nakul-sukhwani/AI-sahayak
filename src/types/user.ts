export type UserRole = 'citizen' | 'worker' | 'supervisor' | 'officer' | 'admin';

export interface UserProfile {
  id: string;
  phone: string;
  full_name: string | null;
  display_name: string | null;
  ward_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
