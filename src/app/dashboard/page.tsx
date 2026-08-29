import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import type { Complaint } from '@/types/complaint';

export const metadata: Metadata = {
  title: 'My Complaints',
  description: 'Track the status of all your filed civic complaints.',
};

export default async function DashboardPage() {
  const isLocalDev = process.env.NODE_ENV === 'development';
  let complaints: Complaint[] = [];
  let displayName = 'Citizen';

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && !isLocalDev) redirect('/login');

    if (user) {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('full_name, display_name, role')
        .eq('id', user.id)
        .single();
      if (profile) displayName = profile.display_name ?? profile.full_name ?? 'Citizen';

      const { data: rows } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (rows) complaints = rows as Complaint[];
    }
  } catch {
    // Fallback in development
  }

  return <DashboardClient displayName={displayName} complaints={complaints} />;
}
