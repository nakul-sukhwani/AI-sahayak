import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { DynamicDashboardBackground } from '@/components/ui/DynamicDashboardBackground';
import { WardScorecardCard } from '@/components/ngo/WardScorecardCard';
import { CommunityDrivesSection } from '@/components/ngo/CommunityDrivesSection';
import { GroundAuditModal } from '@/components/ngo/GroundAuditModal';
import { EscalationLadder } from '@/components/ngo/EscalationLadder';
import { computeWardScorecards } from '@/lib/ward-scorecard';
import type { Complaint } from '@/types/complaint';

export const metadata: Metadata = {
  title: 'NGO Dashboard — Nagrik Seva',
  description: 'Civic oversight, ground audits, community drives, and municipal ward accountability.',
};

const OVERDUE_DAYS = 7;

function getDaysOpen(created_at: string): number {
  return Math.floor((Date.now() - new Date(created_at).getTime()) / (1000 * 3600 * 24));
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:         { bg: '#fff3e0', color: '#e65100' },
  open:            { bg: '#e3f0fd', color: '#1565c0' },
  assigned:        { bg: '#f3e5f5', color: '#6a1b9a' },
  in_progress:     { bg: '#e0f7fa', color: '#00695c' },
  proof_submitted: { bg: '#fff8e1', color: '#b45309' },
  resolved:        { bg: '#e8f5e9', color: '#1b5e20' },
  closed:          { bg: '#f4f6fa', color: '#718096' },
  rejected:        { bg: '#ffebee', color: '#b71c1c' },
};

export default async function NGODashboardPage() {
  let orgName = 'Community Organization';
  let allComplaints: Complaint[] = [];

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
        orgName = profile.submitter_org_name ?? profile.display_name ?? profile.full_name ?? 'Community Organization';
      }
    }

    // Fetch citywide complaints for audit & monitoring
    const { data: rows } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (rows) allComplaints = rows as Complaint[];
  } catch {
    // Dev fallback
  }

  // Scorecards computation
  const wardScorecardReport = computeWardScorecards(allComplaints);

  // Filter queues
  const overdue = allComplaints.filter(
    (c) => !['resolved', 'closed', 'rejected'].includes(c.status) && getDaysOpen(c.created_at) > OVERDUE_DAYS
  );

  const pending = allComplaints.filter((c) => !['resolved', 'closed', 'rejected'].includes(c.status));
  const resolved = allComplaints.filter((c) => c.status === 'resolved');

  // Ground Audit Queue (proof submitted or recently resolved requiring physical ombudsman signoff)
  const groundAuditQueue = allComplaints.filter(
    (c) => c.status === 'proof_submitted' || (c.status === 'resolved' && getDaysOpen(c.created_at) <= 14)
  ).slice(0, 10);

  return (
    <div className="relative min-h-screen">
      {/* Dynamic ambient & interactive background */}
      <DynamicDashboardBackground variant="ngo" />

      <div className="relative z-10 space-y-6">
        {/* ── Top Bar & Greeting ──────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur rounded-2xl border border-[#dde3ed] p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00695c] animate-pulse"></span>
              <span className="text-[11px] font-bold text-[#00695c] uppercase tracking-wider">
                Civic Oversight, Ground Audits &amp; Community Action
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#002147] tracking-tight">{orgName}</h1>
            <p className="text-xs text-[#718096] mt-0.5">
              Independent civic auditing, statutory RTI petitions, community volunteer drives, and ward SLA scorecards.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f4f6fa] rounded-xl border border-[#dde3ed] text-xs font-semibold text-[#4a5568]">
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

        {/* ── Top Bento Grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Total Tracked */}
          <div
            className="rounded-2xl p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[150px]"
            style={{ background: 'linear-gradient(135deg, #00695c 0%, #004d40 60%, #00796b 100%)' }}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white text-base">volunteer_activism</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">Community Watch</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                Oversight
              </span>
            </div>
            <div className="my-2 relative z-10">
              <p className="text-xs text-white/80">Monitored City Grievances</p>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                {allComplaints.length} <span className="text-xs font-normal text-white/80">Logged</span>
              </h2>
            </div>
            <div className="text-[11px] text-white/80 border-t border-white/15 pt-2 relative z-10 flex items-center justify-between">
              <span>{resolved.length} Closed</span>
              <span className="font-bold text-teal-200">{pending.length} In Progress</span>
            </div>
          </div>

          {/* Card 2: Overdue SLA Breaches */}
          <div className="bg-white rounded-2xl border border-[#dde3ed] p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overdue (&gt; 7 Days)</span>
              <span className="material-symbols-outlined text-red-600 text-lg">warning</span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-black text-red-600">{overdue.length}</h3>
              <p className="text-[11px] text-slate-500">Breached municipal charter SLA</p>
            </div>
            <p className="text-[10px] text-red-700 font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-200">
              RTI &amp; Summons Ready
            </p>
          </div>

          {/* Card 3: Ground Audit Pending */}
          <div className="bg-white rounded-2xl border border-[#dde3ed] p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ground Inspection</span>
              <span className="material-symbols-outlined text-amber-600 text-lg">fact_check</span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-black text-amber-700">{groundAuditQueue.length}</h3>
              <p className="text-[11px] text-slate-500">Awaiting community verification</p>
            </div>
            <p className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
              Citizen Ombudsman Active
            </p>
          </div>

          {/* Card 4: City Average SLA */}
          <div className="bg-white rounded-2xl border border-[#dde3ed] p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Citywide SLA Score</span>
              <span className="material-symbols-outlined text-[#1565c0] text-lg">speed</span>
            </div>
            <div className="my-2">
              <h3 className="text-2xl font-black text-[#1565c0]">{wardScorecardReport.city_average_sla}%</h3>
              <p className="text-[11px] text-slate-500">Average resolution rating</p>
            </div>
            <p className="text-[10px] text-blue-800 font-bold bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
              13 Wards Monitored
            </p>
          </div>
        </div>

        {/* ── Tri-Party Civic Advocacy Hub Banner ─────────────────── */}
        <div className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00695c] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-xl">handshake</span>
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-[#00695c] border border-teal-200">
                  Tri-Party Advocacy Line
                </span>
                <h2 className="text-base font-bold text-[#002147] tracking-tight mt-0.5">
                  Direct Escalation Network: NGO ↔ Citizen ↔ Municipal Administration
                </h2>
              </div>
            </div>

            <span className="text-xs text-slate-500 italic">
              Empowered under RTI Act 2005 &amp; Municipal Transparency Charters
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Citizen Direct Line */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#00695c] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">support_agent</span>
                </span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Citizen Legal Aid &amp; Issue Adoption
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect directly with affected residents. Adopt stalled complaints, offer pro-bono RTI legal representation, and coordinate neighborhood surveys.
              </p>
            </div>

            {/* Municipal Admin Direct Line */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200 space-y-2">
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

        {/* ── Ward Performance Scorecards & Accountability Radar ─── */}
        <WardScorecardCard report={wardScorecardReport} orgName={orgName} />

        {/* ── Community Action & Volunteer Drives ─────────────────── */}
        <CommunityDrivesSection orgName={orgName} />

        {/* ── Overdue Accountability Queue with Escalation Ladder ──── */}
        {overdue.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">gavel</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1a2332]">
                    Overdue Accountability Queue ({overdue.length})
                  </h2>
                  <p className="text-xs text-[#718096]">
                    Issues breaching the 7-day municipal charter SLA. Use the escalation ladder to enforce accountability.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#dde3ed]/60">
              {overdue.map((c) => {
                const days = getDaysOpen(c.created_at);
                return (
                  <div key={c.id} className="py-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#ffebee] text-[#b71c1c] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-base">schedule</span>
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/${c.id}`}
                            className="text-sm font-bold text-[#1a2332] truncate hover:text-[#00695c] transition-colors block"
                          >
                            {c.issue_type.replace(/_/g, ' ')}
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {c.ward_name || 'Central Ward'} · {c.address || 'Address unlisted'}
                          </p>
                          <p className="text-[11px] font-bold text-red-600 mt-0.5">
                            Open for {days} days • SLA Status: Non-Compliant
                          </p>
                        </div>
                      </div>

                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-bold capitalize self-start sm:self-auto"
                        style={{
                          background: STATUS_STYLES[c.status]?.bg || '#f4f6fa',
                          color: STATUS_STYLES[c.status]?.color || '#718096',
                        }}
                      >
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Multi-Stage Statutory Escalation Ladder */}
                    <EscalationLadder
                      complaintId={c.id}
                      complaintTitle={c.issue_type.replace(/_/g, ' ')}
                      daysOpen={days}
                      orgName={orgName}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Citizen Ombudsman — Ground Audit Queue ──────────────── */}
        <div className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-base">verified_user</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1a2332]">
                  Citizen Ombudsman — Ground Audit Queue
                </h2>
                <p className="text-xs text-[#718096]">
                  Physically verify contractor repair quality on site to ensure tax funds aren't wasted on temporary patches or fake photos.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {groundAuditQueue.length} Pending Inspection
            </span>
          </div>

          {groundAuditQueue.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No contractor completion proofs pending ground audit in your sector.
            </div>
          ) : (
            <div className="divide-y divide-[#dde3ed]/60">
              {groundAuditQueue.map((c) => (
                <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-base">construction</span>
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/${c.id}`}
                        className="text-xs font-bold text-slate-900 hover:text-[#00695c] truncate block"
                      >
                        {c.issue_type.replace(/_/g, ' ')}
                      </Link>
                      <p className="text-[11px] text-slate-500">
                        {c.ward_name || 'Ward Area'} · {c.address || 'Address logged'}
                      </p>
                      <span className="text-[10px] font-semibold text-emerald-700">
                        Work marked as {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <GroundAuditModal
                    complaintId={c.id}
                    complaintTitle={c.issue_type.replace(/_/g, ' ')}
                    orgName={orgName}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── All Monitored Grievances Audit Trail ─────────────────── */}
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

          <div className="divide-y divide-[#dde3ed]/60">
            {allComplaints.slice(0, 15).map((c) => {
              const days = getDaysOpen(c.created_at);
              const isOverdue = !['resolved', 'closed'].includes(c.status) && days > OVERDUE_DAYS;
              const statusStyle = STATUS_STYLES[c.status] ?? { bg: '#f4f6fa', color: '#718096' };
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/${c.id}`}
                  className="flex items-center justify-between py-3 hover:bg-[#f8fafc] px-2 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: isOverdue ? 'var(--nx-error-light)' : 'var(--nx-ngo-light)' }}
                    >
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ color: isOverdue ? 'var(--nx-error)' : 'var(--nx-ngo)' }}
                      >
                        {isOverdue ? 'schedule' : 'assignment'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1a2332] truncate group-hover:text-[#00695c] transition-colors">
                        {c.issue_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {c.ward_name || 'Central Ward'} • {days} days ago
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize flex-shrink-0"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
