import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChallengeInbox } from '@/components/university/ChallengeInbox';

export const metadata = {
  title: 'University Inbox | Nagrik Seva',
};

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Find the university this user belongs to
  const { data: profile } = await supabase
    .from('users_profile')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;
  
  // For MVP, if they are a university_admin, find the university where they are admin
  let universityId = null;
  const isAdmin = role === 'university_admin' || role === 'admin';

  if (isAdmin) {
    const { data: uni } = await supabase
      .from('universities')
      .select('id')
      .eq('admin_user_id', user.id)
      .single();
    
    if (uni) universityId = uni.id;
  } else if (role === 'faculty_mentor') {
    // Note: MVP assumption. In a real system, there'd be a junction table for team members.
    // For this prototype, if they are not admin but accessing inbox, they'd need a university_id stored in profile.
    // We'll require them to use the system via invitations if not an admin.
  }

  if (!universityId) {
    return (
      <div className="p-8 text-center text-slate-500">
        You are not assigned as an administrator to any institution yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Institution Inbox</h1>
        <p className="text-slate-500 mt-2">
          Review societal challenges routed to your institution by the government.
        </p>
      </div>

      <ChallengeInbox universityId={universityId} isAdmin={isAdmin} />
    </div>
  );
}
