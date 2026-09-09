import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { NGOLetterModal } from '@/components/ngo/NGOLetterModal';
import { NGOAdvocacyModal } from '@/components/ngo/NGOAdvocacyModal';
import { DynamicDashboardBackground } from '@/components/ui/DynamicDashboardBackground';

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
      {/* Dynamic ambient & interactive background */}
      <DynamicDashboardBackground variant="ngo" />

      <div className="relative z-10 space-y-6">
        {/* ── Quixotic Top Bar & Greeting ──────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur rounded-2xl border border-[#dde3ed] p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00695c] animate-pulse"></span>
              <span className="text-[11px] font-bold text-[#00695c] uppercase tracking-wider">
                Civic Oversight &amp; Accountability
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#002147] tracking-tight">{orgName}</h1>
            <p className="text-xs text-[#718096] mt-0.5">
              Monitoring public service delivery, SLA adherence, and formal escalations for your community.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f6fa] rounded-xl border border-[#dde3ed] text-xs font-semibold text-[#4a5568]">
              <span className="material-symbols-outlined text-sm text-[#718096]">calendar_today</span>
              <span>Audit Cycle: 2026</span>
            </div>

            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl uppercase tracking-wider shadow-sm transition-all hover:opacity-95"
              style={{ background: 'var(--nx-ngo)' }}
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>File Complaint</span>
            </Link>
          </div>
        </div>

        {/* ── Quixotic Bento Top Grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: NGO Oversight Status Card (Quixotic "Card" slot in NGO Teal) */}
          <div
            className="rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[170px]"
            style={{ background: 'linear-gradient(135deg, #00695c 0%, #004d40 60%, #00796b 100%)' }}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-base">volunteer_activism</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">Community Watch</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                Oversight
              </span>
            </div>

            <div className="my-3 relative z-10">
              <p className="text-xs text-white/80">Total Tracked Complaints</p>
              <h2 className="text-3xl font-bold tracking-tight text-white mt-0.5">
                {total} <span className="text-sm font-normal text-white/80">Submitted</span>
              </h2>
            </div>

            <div className="text-[11px] text-white/80 border-t border-white/15 pt-2 relative z-10 flex items-center justify-between">
              <span>{resolved.length} Resolved</span>
              <span className="font-semibold text-teal-200">{pending.length} In Progress</span>
            </div>
          </div>

          {/* Card 2: Overdue Escalations */}
          <div className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#718096]">SLA Breaches (&gt;7 Days)</p>
                <span className="material-symbols-outlined text-lg text-[#b71c1c]">warning</span>
              </div>
              <h3 className="text-3xl font-bold text-[#b71c1c]">{overdue.length}</h3>
              <p className="text-xs text-[#718096] mt-1">Issues exceeding official municipal resolution window</p>
            </div>

            <div className="pt-3 border-t border-[#dde3ed] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#b71c1c] bg-[#ffebee] px-2.5 py-0.5 rounded-full">
                {overdue.length > 0 ? 'Escalation Action Required' : 'All within SLA'}
              </span>
              <span className="text-xs text-[#718096]">Target: &lt; 7 Days</span>
            </div>
          </div>

          {/* Card 3: Formal Demand Notice Action */}
          <div className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#718096]">Legal Escalation</p>
                <span className="material-symbols-outlined text-lg text-[#00695c]">gavel</span>
              </div>
              <h3 className="text-base font-bold text-[#1a2332]">Official Demand Letters</h3>
              <p className="text-xs text-[#718096] mt-1">
                Auto-generate formal legal notices to the District Magistrate or Municipal Commissioner for overdue grievances.
              </p>
            </div>

            <div className="pt-3 border-t border-[#dde3ed] flex items-center justify-between text-xs">
              <span className="text-[#718096]">PDF Format</span>
              <span className="font-bold text-[#00695c]">Ready to dispatch</span>
            </div>
          </div>
        </div>

        {/* ── Tri-Party Civic Advocacy Hub ─────────────────────────── */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-emerald-50/70 via-teal-50/20 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#00695c] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  hub
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-[#00695c] border border-emerald-200">
                    Tri-Party Civic Bridge
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active Direct Lines
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#002147] tracking-tight mt-0.5">
                  Direct Advocacy Network: NGO ↔ Citizen ↔ Municipal Administration
                </h2>
              </div>
            </div>

            <span className="text-xs text-slate-500 italic">
              Empowered under RTI Act 2005 &amp; Municipal Transparency Charters
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Citizen Direct Line */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#00695c] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">support_agent</span>
                </span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Citizen Legal Aid &amp; Relief Channel
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect directly with affected residents. Provide official NGO adoption notices, pro-bono RTI legal representation, and coordinate joint community surveys.
              </p>
            </div>

            {/* Municipal Admin Direct Line */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200/80 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#002147] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">policy</span>
                </span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Administrative Summons &amp; Joint Inspection
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Issue statutory summons to Ward Executive Engineers demanding 72-hour joint site inspections and contractor accountability under Section 20(1) penalty rules.
              </p>
            </div>
          </div>
        </div>

        {/* ── Overdue alert banner ─────────────────────────────────── */}
        {overdue.length > 0 && (
          <div className="bg-[#fff3e0] border border-[#ffb74d] rounded-2xl p-5 flex items-start gap-3 shadow-sm">
            <span className="material-symbols-outlined text-2xl text-[#e65100] flex-shrink-0">
              warning
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#e65100]">
                {overdue.length} complaint{overdue.length > 1 ? 's are' : ' is'} overdue beyond {OVERDUE_DAYS} days
              </p>
              <p className="text-xs mt-0.5 text-[#4a5568]">
                Municipal department has failed to resolve within the expected turnaround time. Use the action buttons below to draft an official RTI Section 6 inquiry or issue administrative summons.
              </p>
            </div>
          </div>
        )}

        {/* ── Overdue Accountability Queue ─────────────────────────── */}
        {overdue.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#b71c1c]">gavel</span>
                <h2 className="text-base font-bold text-[#1a2332]">Accountability Queue — Overdue Issues</h2>
              </div>
            </div>
            <div className="divide-y divide-[#dde3ed]/60">
              {overdue.map((c) => {
                const days = getDaysOpen(c.created_at);
                return (
                  <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#ffebee] text-[#b71c1c] flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-base">schedule</span>
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/${c.id}`}
                          className="text-xs font-bold text-[#1a2332] truncate hover:text-[#00695c] transition-colors block"
                        >
                          {c.title || c.issue_type}
                        </Link>
                        <p className="text-[11px] font-semibold text-[#b71c1c]">
                          Open for {days} days • {c.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <NGOAdvocacyModal
                        complaintId={c.id}
                        complaintTitle={c.title || c.issue_type}
                        daysOpen={days}
                        orgName={orgName}
                      />
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

        {/* ── All Monitored Complaints ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#002147]">All Monitored Grievances</h2>
              <p className="text-xs text-[#718096]">Complete audit trail of submissions tracked by your organization</p>
            </div>
            <Link
              href="/feed"
              className="text-xs font-bold transition-colors hover:underline"
              style={{ color: 'var(--nx-ngo)' }}
            >
              Public Feed →
            </Link>
          </div>

          {myComplaints.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#e0f2f1] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--nx-ngo)' }}>groups</span>
              </div>
              <p className="text-sm font-bold text-[#1a2332]">No complaints filed yet.</p>
              <Link
                href="/dashboard/new"
                className="text-xs font-bold hover:underline"
                style={{ color: 'var(--nx-ngo)' }}
              >
                File your first complaint →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#dde3ed]/60">
              {myComplaints.map((c) => {
                const days = getDaysOpen(c.created_at);
                const isOverdue = !['resolved', 'closed'].includes(c.status) && days > OVERDUE_DAYS;
                const statusStyle = STATUS_STYLES[c.status] ?? { bg: '#f4f6fa', color: '#718096' };
                return (
                  <Link
                    key={c.id}
                    href={`/dashboard/${c.id}`}
                    className="flex items-center justify-between py-3.5 hover:bg-[#f8fafc] px-2 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
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
                        <p className="text-xs font-bold text-[#1a2332] truncate group-hover:text-[#00695c] transition-colors">
                          {c.title || c.issue_type}
                        </p>
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: isOverdue ? 'var(--nx-error)' : '#718096', fontWeight: isOverdue ? 600 : 400 }}
                        >
                          {isOverdue ? `⚠ ${days} days open` : `${days} day${days !== 1 ? 's' : ''} ago`}
                          {' • '}{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold capitalize flex-shrink-0"
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

        {/* ── Info Guidance Box ────────────────────────────────────── */}
        <div className="bg-[#f0f9ff] rounded-2xl border border-[#bae6fd] p-5 flex items-start gap-3 shadow-sm">
          <span className="material-symbols-outlined text-xl text-[#0284c7] flex-shrink-0">
            info
          </span>
          <div>
            <p className="text-sm font-bold text-[#0369a1]">
              How NGO Accountability Works in Nagrik Seva
            </p>
            <p className="text-xs text-[#4a5568] mt-1 leading-relaxed">
              Civic organizations act as public auditors. Any issue remaining unresolved beyond <strong>{OVERDUE_DAYS} days</strong> is automatically escalated into the Accountability Queue. You can generate legally structured Demand Letters with auto-populated grievance details to serve formal notices to the responsible municipal departments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
