import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { NGOLetterModal } from '@/components/ngo/NGOLetterModal';

export const metadata: Metadata = {
  title: 'NGO Dashboard — Nagrik Seva',
  description: 'Monitor government accountability and track civic issue resolution in your community.',
};

const OVERDUE_DAYS = 7;

function getDaysOpen(created_at: string): number {
  return Math.floor((Date.now() - new Date(created_at).getTime()) / (1000 * 3600 * 24));
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:     { bg: '#fff3e0', color: '#e65100' },
  open:        { bg: '#e3f0fd', color: '#1565c0' },
  assigned:    { bg: '#f3e5f5', color: '#6a1b9a' },
  in_progress: { bg: '#e0f7fa', color: '#00695c' },
  resolved:    { bg: '#e8f5e9', color: '#1b5e20' },
  closed:      { bg: '#f4f6fa', color: '#718096' },
  rejected:    { bg: '#ffebee', color: '#b71c1c' },
};

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

  return (
    <div className="relative">
      {/* Dot-grid page decoration */}
      <div
        className="pointer-events-none fixed inset-0 nx-dot-grid"
        style={{ zIndex: 0, opacity: 0.35 }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* ── Hero panel ──────────────────────────────────────────── */}
        <div className="nx-hero-panel nx-hero-ngo">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ color: 'var(--nx-ngo)', fontVariationSettings: "'FILL' 1" }}
                >
                  volunteer_activism
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--nx-ngo)' }}
                >
                  NGO Portal
                </span>
              </div>
              <h1 className="text-xl font-bold text-[#002147] tracking-tight">{orgName}</h1>
              <p className="text-sm text-[#718096] mt-0.5">
                Monitoring government accountability for civic issues in your community.
              </p>
            </div>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded uppercase tracking-wider transition-colors flex-shrink-0"
              style={{ background: 'var(--nx-ngo)' }}
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              File a Complaint
            </Link>
          </div>
        </div>

      {/* ── Overdue alert ────────────────────────────────────────── */}
      {overdue.length > 0 && (
        <div
          className="mb-6 rounded border-l-4 p-4 flex items-start gap-3"
          style={{ background: 'var(--nx-warning-light)', borderLeftColor: 'var(--nx-warning)' }}
        >
          <span
            className="material-symbols-outlined text-2xl flex-shrink-0"
            style={{ color: 'var(--nx-warning)', fontVariationSettings: "'FILL' 1" }}
          >
            warning
          </span>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--nx-warning)' }}>
              {overdue.length} complaint{overdue.length > 1 ? 's are' : ' is'} overdue
              (beyond {OVERDUE_DAYS} days)
            </p>
            <p className="text-xs mt-0.5 text-[#718096]">
              Government has not resolved these issues within the expected timeframe. Consider escalating or re-filing.
            </p>
          </div>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Total Filed', value: total,           icon: 'assignment',    accent: '#1565c0', bgVar: 'var(--nx-admin-light)' },
          { label: 'Pending',     value: pending.length,  icon: 'pending_actions', accent: '#e65100', bgVar: 'var(--nx-warning-light)' },
          { label: 'Overdue',     value: overdue.length,  icon: 'schedule',      accent: '#b71c1c', bgVar: 'var(--nx-error-light)' },
          { label: 'Resolved',    value: resolved.length, icon: 'task_alt',      accent: '#1b5e20', bgVar: 'var(--nx-success-light)' },
        ].map((s) => (
          <div
            key={s.label}
            className="nx-card p-4 flex flex-col gap-1.5"
            style={{ background: s.bgVar, borderColor: 'rgba(0,0,0,0.06)' }}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ color: s.accent, fontVariationSettings: "'FILL' 1" }}
            >
              {s.icon}
            </span>
            <p className="text-2xl font-bold" style={{ color: s.accent }}>{s.value}</p>
            <p className="text-xs text-[#718096]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Accountability tracker ────────────────────────────────── */}
      {overdue.length > 0 && (
        <div
          className="nx-card overflow-hidden mb-6"
          style={{ borderColor: 'rgba(230,81,0,0.3)' }}
        >
          <div
            className="px-5 py-3 border-b flex items-center gap-2"
            style={{ background: 'var(--nx-warning-light)', borderColor: 'rgba(230,81,0,0.2)' }}
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ color: 'var(--nx-warning)', fontVariationSettings: "'FILL' 1" }}
            >
              gavel
            </span>
            <div>
              <h2 className="text-sm font-bold" style={{ color: '#c2410c' }}>
                Accountability Tracker — Overdue Issues
              </h2>
              <p className="text-xs text-[#718096]">
                These complaints exceeded the {OVERDUE_DAYS}-day resolution window.
              </p>
            </div>
          </div>
          <div className="divide-y divide-[#f4f6fa]">
            {overdue.map((c) => {
              const days = getDaysOpen(c.created_at);
              return (
                <div key={c.id} className="flex items-center justify-between px-5 py-3.5 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--nx-error-light)' }}
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ color: 'var(--nx-error)' }}
                      >
                        schedule
                      </span>
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/${c.id}`}
                        className="text-sm font-medium text-[#1a2332] truncate hover:text-[#1565c0] transition-colors block"
                      >
                        {c.title || c.issue_type}
                      </Link>
                      <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--nx-error)' }}>
                        Open for {days} days · {c.status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href="/dashboard/new"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white rounded transition-colors"
                      style={{ background: 'var(--nx-error)' }}
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      Re-file
                    </Link>
                    <NGOLetterModal
                      complaintId={c.id}
                      complaintTitle={c.title || c.issue_type}
                      daysOpen={days}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── All Complaints ────────────────────────────────────────── */}
      <div className="nx-card overflow-hidden mb-6">
        <div
          className="px-5 py-3 border-b border-[#dde3ed] flex items-center justify-between"
          style={{ background: 'var(--nx-ngo-light)' }}
        >
          <div>
            <h2 className="text-sm font-bold text-[#002147]">All Filed Complaints</h2>
            <p className="text-xs text-[#718096] mt-0.5">Track resolution status of all your submissions.</p>
          </div>
          <Link
            href="/feed"
            className="text-xs font-semibold transition-colors"
            style={{ color: 'var(--nx-ngo)' }}
          >
            Public feed →
          </Link>
        </div>

        {myComplaints.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3"
            style={{ background: 'var(--nx-ngo-light)' }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,105,92,0.1)' }}
            >
              <span
                className="material-symbols-outlined text-3xl"
                style={{ color: 'var(--nx-ngo)', opacity: 0.6 }}
              >
                groups
              </span>
            </div>
            <p className="text-sm font-medium text-[#4a5568]">No complaints filed yet.</p>
            <Link
              href="/dashboard/new"
              className="text-sm font-semibold transition-colors"
              style={{ color: 'var(--nx-ngo)' }}
            >
              File your first complaint →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#f4f6fa]">
            {myComplaints.map((c) => {
              const days = getDaysOpen(c.created_at);
              const isOverdue = !['resolved', 'closed'].includes(c.status) && days > OVERDUE_DAYS;
              const statusStyle = STATUS_STYLES[c.status] ?? { bg: '#f4f6fa', color: '#718096' };
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/${c.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[#f8fbfa] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: isOverdue ? 'var(--nx-error-light)' : 'var(--nx-ngo-light)' }}
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ color: isOverdue ? 'var(--nx-error)' : 'var(--nx-ngo)' }}
                      >
                        {isOverdue ? 'schedule' : 'assignment'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1a2332] truncate group-hover:text-[#00695c] transition-colors">
                        {c.title || c.issue_type}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: isOverdue ? 'var(--nx-error)' : '#718096', fontWeight: isOverdue ? 600 : 400 }}
                      >
                        {isOverdue ? `⚠ ${days} days open` : `${days} day${days !== 1 ? 's' : ''} ago`}
                        {' · '}{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span
                    className="nx-badge ml-4 flex-shrink-0 capitalize"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {c.status.replace('_', ' ')}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Info box ─────────────────────────────────────────────── */}
      <div
        className="rounded border-l-4 p-4 flex items-start gap-3"
        style={{ background: 'var(--nx-info-light)', borderLeftColor: 'var(--nx-info)' }}
      >
        <span
          className="material-symbols-outlined flex-shrink-0"
          style={{ color: 'var(--nx-info)', fontVariationSettings: "'FILL' 1" }}
        >
          info
        </span>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--nx-info)' }}>
            How NGO Accountability Works
          </p>
          <p className="text-xs text-[#4a5568] mt-1 leading-relaxed">
            Your NGO can file civic complaints on behalf of the community. Any issue not resolved within{' '}
            <strong>{OVERDUE_DAYS} days</strong> is flagged as overdue. You can re-file the complaint to
            escalate it and generate an official letter to the District Collector or SDM to ensure accountability.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
