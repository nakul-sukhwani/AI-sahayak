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
      <div
        className="rounded border-l-4 p-6 flex items-start gap-3 my-4"
        style={{ background: 'var(--nx-university-light)', borderLeftColor: 'var(--nx-university)' }}
      >
        <span
          className="material-symbols-outlined text-2xl flex-shrink-0"
          style={{ color: 'var(--nx-university)' }}
        >
          info
        </span>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--nx-university)' }}>
            Not Assigned
          </p>
          <p className="text-sm text-[#4a5568] mt-1">
            You are not assigned as an administrator to any institution yet. Contact your system administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="mb-6 pb-5 border-b border-[#dde3ed] flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--nx-university-light)' }}
        >
          <span
            className="material-symbols-outlined text-lg"
            style={{ color: 'var(--nx-university)', fontVariationSettings: "'FILL' 1" }}
          >
            school
          </span>
        </div>
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--nx-university)' }}
          >
            University Portal
          </p>
          <h1 className="text-xl font-bold text-[#002147] tracking-tight leading-tight">
            Institution Inbox
          </h1>
        </div>
      </div>
      <p className="text-sm text-[#718096] mb-7">
        Review societal challenges routed to your institution by the government.
      </p>
      <ChallengeInbox universityId={universityId} isAdmin={isAdmin} />
    </div>
  );
}
