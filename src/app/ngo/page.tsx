import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'NGO Dashboard — Nagrik Seva',
  description: 'Monitor government accountability and track civic issue resolution in your community.',
};

// A complaint is considered "overdue" if it's been open for more than 7 days
const OVERDUE_DAYS = 7;

function getDaysOpen(created_at: string): number {
  return Math.floor((Date.now() - new Date(created_at).getTime()) / (1000 * 3600 * 24));
}

export default async function NGODashboardPage() {
  const isLocalDev = process.env.NODE_ENV === 'development';
  let orgName = 'NGO';
  let myComplaints: Array<{
    id: string; title: string; issue_type: string; status: string;
    created_at: string; description_en: string | null;
  }> = [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('full_name, display_name, submitter_org_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        orgName = profile.submitter_org_name ?? profile.display_name ?? profile.full_name ?? 'NGO';
      }

      const { data: rows } = await supabase
        .from('complaints')
        .select('id, title, issue_type, status, created_at, description_en')
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (rows) myComplaints = rows;
    }
  } catch {
    // Dev fallback
  }

  const total = myComplaints.length;
  const overdue = myComplaints.filter(
    c => !['resolved', 'closed'].includes(c.status) && getDaysOpen(c.created_at) > OVERDUE_DAYS
  );
  const pending = myComplaints.filter(c => !['resolved', 'closed'].includes(c.status));
  const resolved = myComplaints.filter(c => c.status === 'resolved');

  const statusColors: Record<string, string> = {
    pending:     'bg-[#fef3c7] text-[#92400e]',
    open:        'bg-[#eff6ff] text-[#1d4ed8]',
    assigned:    'bg-[#f3e8ff] text-[#6d28d9]',
    in_progress: 'bg-[#cffafe] text-[#0e7490]',
    resolved:    'bg-[#d1fae5] text-[#065f46]',
    closed:      'bg-[#f1f5f9] text-[#64748b]',
    rejected:    'bg-[#fee2e2] text-[#b91c1c]',
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
            Monitoring government accountability for civic issues in your community.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#001e40] text-white text-sm font-semibold rounded-xl hover:bg-[#002a5c] transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          File a Complaint
        </Link>
      </div>

      {/* Accountability Alert Banner */}
      {overdue.length > 0 && (
        <div className="mb-6 bg-[#fff7ed] border border-[#f97316] rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-[#f97316] text-2xl flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            warning
          </span>
          <div>
            <p className="text-sm font-bold text-[#c2410c]">
              {overdue.length} complaint{overdue.length > 1 ? 's are' : ' is'} overdue (beyond {OVERDUE_DAYS} days)!
            </p>
            <p className="text-xs text-[#9a3412] mt-0.5">
              The government has not resolved these issues within the expected timeframe. Consider escalating or re-filing.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Filed', value: total, icon: 'assignment', color: 'text-[#2563eb]', bg: 'bg-[#eff6ff]' },
          { label: 'Pending', value: pending.length, icon: 'pending_actions', color: 'text-[#d97706]', bg: 'bg-[#fffbeb]' },
          { label: 'Overdue', value: overdue.length, icon: 'schedule', color: 'text-[#dc2626]', bg: 'bg-[#fee2e2]' },
          { label: 'Resolved', value: resolved.length, icon: 'task_alt', color: 'text-[#059669]', bg: 'bg-[#d1fae5]' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
              <span className={`material-symbols-outlined text-xl ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {s.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-[#191c1e]">{s.value}</p>
            <p className="text-xs text-[#545f72]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Overdue Issues — Accountability Tracker */}
      {overdue.length > 0 && (
        <div className="bg-white border border-[#f97316]/40 rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-[#f97316]/20 bg-[#fff7ed] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#f97316]" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
            <div>
              <h2 className="text-sm font-bold text-[#9a3412]">Accountability Tracker — Overdue Issues</h2>
              <p className="text-xs text-[#c2410c]">These complaints exceeded the {OVERDUE_DAYS}-day resolution window. You can re-file to escalate.</p>
            </div>
          </div>
          <div className="divide-y divide-[#fef3c7]">
            {overdue.map((c) => {
              const days = getDaysOpen(c.created_at);
              return (
                <div key={c.id} className="flex items-center justify-between px-4 py-3.5 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#fee2e2] flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[#dc2626] text-base">schedule</span>
                    </div>
                    <div className="min-w-0">
                      <Link href={`/dashboard/${c.id}`} className="text-sm font-medium text-[#191c1e] truncate hover:text-[#2563eb] transition-colors block">
                        {c.title || c.issue_type}
                      </Link>
                      <p className="text-xs text-[#dc2626] mt-0.5 font-medium">
                        Open for {days} days · {c.status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/new"
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#dc2626] text-white text-xs font-semibold rounded-lg hover:bg-[#b91c1c] transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Re-file
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Complaints */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#191c1e]">All Filed Complaints</h2>
            <p className="text-xs text-[#545f72] mt-0.5">Track resolution status of all your submissions.</p>
          </div>
          <Link href="/feed" className="text-xs text-[#2563eb] font-medium hover:underline">
            Public feed →
          </Link>
        </div>

        {myComplaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 bg-[#f1f5f9] rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-[#94a3b8]">groups</span>
            </div>
            <p className="text-sm font-medium text-[#545f72]">No complaints filed yet.</p>
            <Link href="/dashboard/new" className="text-sm text-[#2563eb] font-medium hover:underline">
              File your first complaint →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#f1f5f9]">
            {myComplaints.map((c) => {
              const days = getDaysOpen(c.created_at);
              const isOverdue = !['resolved', 'closed'].includes(c.status) && days > OVERDUE_DAYS;
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/${c.id}`}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-[#f8fafc] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isOverdue ? 'bg-[#fee2e2]' : 'bg-[#eff6ff]'}`}>
                      <span className={`material-symbols-outlined text-base ${isOverdue ? 'text-[#dc2626]' : 'text-[#2563eb]'}`}>
                        {isOverdue ? 'schedule' : 'assignment'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#191c1e] truncate group-hover:text-[#2563eb] transition-colors">
                        {c.title || c.issue_type}
                      </p>
                      <p className={`text-xs mt-0.5 ${isOverdue ? 'text-[#dc2626] font-medium' : 'text-[#94a3b8]'}`}>
                        {isOverdue ? `⚠ ${days} days open` : `${days} day${days !== 1 ? 's' : ''} ago`}
                        {' · '}{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span className={`ml-4 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[c.status] ?? 'bg-[#f1f5f9] text-[#64748b]'}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-[#0284c7] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
          info
        </span>
        <div>
          <p className="text-sm font-semibold text-[#0369a1]">How NGO Accountability Works</p>
          <p className="text-xs text-[#0c4a6e] mt-1 leading-relaxed">
            Your NGO can file civic complaints on behalf of the community. Any issue not resolved within <strong>{OVERDUE_DAYS} days</strong> is flagged as overdue. 
            You can re-file the complaint to escalate it and ensure the government stays accountable.
          </p>
        </div>
      </div>
    </>
  );
}
