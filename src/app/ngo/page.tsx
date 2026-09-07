import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'NGO Dashboard — Nagrik Seva',
  description: 'Manage your community initiatives, submit challenges, and track civic impact.',
};

export default async function NGODashboardPage() {
  const isLocalDev = process.env.NODE_ENV === 'development';
  let orgName = 'NGO';
  let totalSubmitted = 0;
  let totalPending = 0;
  let totalResolved = 0;
  let recentChallenges: Array<{ id: string; title: string; status: string; created_at: string; domain: string | null }> = [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Fetch org profile
      const { data: profile } = await supabase
        .from('users_profile')
        .select('full_name, display_name, submitter_org_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        orgName = profile.submitter_org_name ?? profile.display_name ?? profile.full_name ?? 'NGO';
      }

      // Fetch submitted challenges
      const { data: challenges } = await supabase
        .from('challenges')
        .select('id, title, status, created_at, domain')
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (challenges) {
        totalSubmitted = challenges.length;
        totalPending = challenges.filter(c => !['resolved', 'closed'].includes(c.status)).length;
        totalResolved = challenges.filter(c => c.status === 'resolved').length;
        recentChallenges = challenges.slice(0, 5);
      }
    }
  } catch {
    // Dev fallback
  }

  const stats = [
    {
      label: 'Total Submitted',
      value: totalSubmitted,
      icon: 'assignment',
      color: 'text-[#2563eb]',
      bg: 'bg-[#eff6ff]',
    },
    {
      label: 'In Progress',
      value: totalPending,
      icon: 'pending_actions',
      color: 'text-[#d97706]',
      bg: 'bg-[#fffbeb]',
    },
    {
      label: 'Resolved',
      value: totalResolved,
      icon: 'task_alt',
      color: 'text-[#059669]',
      bg: 'bg-[#d1fae5]',
    },
  ];

  const statusColors: Record<string, string> = {
    pending:      'bg-[#fef3c7] text-[#92400e]',
    open:         'bg-[#eff6ff] text-[#1d4ed8]',
    routed:       'bg-[#f3e8ff] text-[#6d28d9]',
    accepted:     'bg-[#d1fae5] text-[#065f46]',
    team_formed:  'bg-[#cffafe] text-[#0e7490]',
    resolved:     'bg-[#d1fae5] text-[#059669]',
    closed:       'bg-[#f1f5f9] text-[#64748b]',
    rejected:     'bg-[#fee2e2] text-[#b91c1c]',
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#191c1e] tracking-tight">
            {orgName}
          </h1>
          <p className="text-sm text-[#545f72] mt-1">
            Submit civic challenges and track their resolution progress.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#001e40] text-white text-sm font-medium rounded-xl hover:bg-[#002a5c] transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          Submit Challenge
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <span className={`material-symbols-outlined text-2xl ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {s.icon}
              </span>
            </div>
            <div>
              <p className="text-sm text-[#545f72]">{s.label}</p>
              <p className="text-2xl font-bold text-[#191c1e]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Challenges */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#191c1e]">Recent Challenges</h2>
            <p className="text-xs text-[#545f72] mt-0.5">Your latest submitted civic challenges.</p>
          </div>
          <Link href="/dashboard" className="text-xs text-[#2563eb] font-medium hover:underline">
            View all →
          </Link>
        </div>

        {recentChallenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 bg-[#f1f5f9] rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-[#94a3b8]">groups</span>
            </div>
            <p className="text-sm font-medium text-[#545f72]">No challenges submitted yet.</p>
            <Link
              href="/dashboard/new"
              className="text-sm text-[#2563eb] font-medium hover:underline"
            >
              Submit your first challenge →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {recentChallenges.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/${c.id}`}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-[#f8fafc] transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#eff6ff] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[#2563eb] text-base">assignment</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#191c1e] truncate group-hover:text-[#2563eb] transition-colors">
                      {c.title}
                    </p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      {c.domain ?? 'General'} · {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`ml-4 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[c.status] ?? 'bg-[#f1f5f9] text-[#64748b]'}`}>
                  {c.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5">
        <h2 className="text-base font-semibold text-[#191c1e] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/dashboard/new"
            className="flex items-center gap-3 p-4 rounded-xl border border-[#E2E8F0] hover:border-[#2563eb] hover:bg-[#eff6ff] transition-all group"
          >
            <span className="material-symbols-outlined text-2xl text-[#2563eb]" style={{ fontVariationSettings: "'FILL' 1" }}>
              add_circle
            </span>
            <div>
              <p className="text-sm font-semibold text-[#191c1e] group-hover:text-[#2563eb] transition-colors">Submit a Challenge</p>
              <p className="text-xs text-[#545f72]">Report a civic issue to the government</p>
            </div>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 p-4 rounded-xl border border-[#E2E8F0] hover:border-[#2563eb] hover:bg-[#eff6ff] transition-all group"
          >
            <span className="material-symbols-outlined text-2xl text-[#2563eb]" style={{ fontVariationSettings: "'FILL' 1" }}>
              list_alt
            </span>
            <div>
              <p className="text-sm font-semibold text-[#191c1e] group-hover:text-[#2563eb] transition-colors">All Submissions</p>
              <p className="text-xs text-[#545f72]">View and track all your submissions</p>
            </div>
          </Link>
          <Link
            href="/feed"
            className="flex items-center gap-3 p-4 rounded-xl border border-[#E2E8F0] hover:border-[#2563eb] hover:bg-[#eff6ff] transition-all group"
          >
            <span className="material-symbols-outlined text-2xl text-[#2563eb]" style={{ fontVariationSettings: "'FILL' 1" }}>
              public
            </span>
            <div>
              <p className="text-sm font-semibold text-[#191c1e] group-hover:text-[#2563eb] transition-colors">Public Feed</p>
              <p className="text-xs text-[#545f72]">See all community challenges</p>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
