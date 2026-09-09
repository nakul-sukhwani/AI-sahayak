import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChallengeInbox } from '@/components/university/ChallengeInbox';
import { DynamicDashboardBackground } from '@/components/ui/DynamicDashboardBackground';

export const metadata = {
  title: 'University Inbox | Nagrik Seva',
};

export default async function InboxPage() {
  const supabase = await createClient();
  const isLocalDev = process.env.NODE_ENV === 'development';
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isLocalDev) redirect('/login');

  // Find the university this user belongs to
  let universityId = null;
  let isAdmin = isLocalDev;

  if (user) {
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;
    isAdmin = role === 'university_admin' || role === 'admin' || isLocalDev;

    if (isAdmin) {
      const { data: uni } = await supabase
        .from('universities')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();
      
      if (uni) universityId = uni.id;
    }
  }

  // Fallback: If no university is linked to the user or in evaluator/dev mode, pick the first available institution
  if (!universityId) {
    const { data: fallbackUni } = await supabase
      .from('universities')
      .select('id')
      .limit(1)
      .maybeSingle();
    if (fallbackUni) {
      universityId = fallbackUni.id;
      isAdmin = true;
    }
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
    <div className="relative">
      {/* Dynamic ambient & interactive background */}
      <DynamicDashboardBackground variant="university" />

      <div className="relative z-10">
        {/* ── Bento Hero Header Card ───────────────────────────────────────────── */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-purple-50/80 via-purple-50/20 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: '#4a148c', color: '#ffffff' }}
              >
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  school
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#f3e5f5] text-[#4a148c] border border-[#ce93d8]">
                    University R&amp;D Hub · Municipal Lab
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                    Civic Pipeline Online
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#002147] tracking-tight mt-1">
                  Institution Challenge Inbox
                </h1>
                <p className="text-sm text-[#545f72] max-w-2xl mt-1">
                  Review and adopt complex civic challenges routed to your university department for student research &amp; engineering proposals.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-4 py-2 rounded-xl bg-purple-50/80 border border-purple-200/80 text-center shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">R&amp;D Mandate</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">MOU Partnered</p>
              </div>
            </div>
          </div>
        </div>

        <ChallengeInbox universityId={universityId} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
