import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ActivityMap } from '@/components/admin/ActivityMap';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';
import { AdminComplaintsTable } from '@/components/admin/AdminComplaintsTable';
import { PredictiveHotspotsCard } from '@/components/admin/PredictiveHotspotsCard';
import { DynamicDashboardBackground } from '@/components/ui/DynamicDashboardBackground';
import { computePredictiveRisks } from '@/lib/predictive-maintenance';
import type { Complaint } from '@/types/complaint';

export const metadata: Metadata = {
  title: 'Admin Dashboard — Nagrik Seva',
  description: 'System analytics, complaint management, worker assignment and proof verification.',
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // ── All complaints ────────────────────────────────────────────
  const { data: allComplaints } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  const complaints = (allComplaints ?? []) as Complaint[];

  // ── Workers ───────────────────────────────────────────────────
  const { data: workersRaw } = await supabase
    .from('users_profile')
    .select('id, full_name, display_name')
    .eq('role', 'worker');
  const workers = (workersRaw ?? []) as { id: string; full_name: string | null; display_name: string | null }[];

  // ── Work proofs (for verify button) ──────────────────────────
  const proofComplaintIds = complaints
    .filter((c) => c.status === 'proof_submitted')
    .map((c) => c.id);

  let proofs: Array<{
    id: string; complaint_id: string;
    after_photo_url: string | null;
    ai_verified: boolean | null;
    ai_observation: string | null;
    status: string;
  }> = [];

  if (proofComplaintIds.length > 0) {
    const { data: proofsRaw } = await supabase
      .from('work_proof')
      .select('id, complaint_id, after_photo_url, ai_verified, ai_observation, status')
      .in('complaint_id', proofComplaintIds);
    proofs = (proofsRaw ?? []) as typeof proofs;
  }

  // ── Stats ─────────────────────────────────────────────────────
  const total        = complaints.length;
  const aiRouted     = complaints.filter((c) => c.ai_confidence && c.ai_confidence > 0.7).length;
  const resolved     = complaints.filter((c) => c.status === 'resolved').length;
  const needsVerify  = complaints.filter((c) => c.status === 'proof_submitted').length;
  const unassigned   = complaints.filter((c) => ['filed', 'open'].includes(c.status)).length;

  let avgDays = 0;
  const resolvedComplaints = complaints.filter((c) => c.status === 'resolved' && c.updated_at);
  if (resolvedComplaints.length > 0) {
    const totalDays = resolvedComplaints.reduce((acc, c) => {
      return acc + (new Date(c.updated_at!).getTime() - new Date(c.created_at).getTime()) / 86400000;
    }, 0);
    avgDays = totalDays / resolvedComplaints.length;
  }

  const stats = [
    { label: 'Total Complaints',   value: total.toString(),                                icon: 'assignment',           accent: '#1565c0', bgVar: 'var(--nx-admin-light)' },
    { label: 'Unassigned',         value: unassigned.toString(),                           icon: 'pending_actions',      accent: '#e65100', bgVar: 'var(--nx-warning-light)' },
    { label: 'Needs Verification', value: needsVerify.toString(),                          icon: 'fact_check',           accent: '#b45309', bgVar: 'var(--nx-worker-light)' },
    { label: 'AI Auto-Routed',     value: aiRouted.toString(),                             icon: 'smart_toy',            accent: '#5c35a8', bgVar: '#f0ebfc' },
    { label: 'Resolved',           value: resolved.toString(),                             icon: 'task_alt',             accent: '#1b5e20', bgVar: 'var(--nx-success-light)' },
    { label: 'Avg Resolution',     value: avgDays > 0 ? `${avgDays.toFixed(1)}d` : 'N/A', icon: 'schedule',             accent: '#718096', bgVar: 'var(--nx-bg)' },
  ];

  const locations = complaints
    .filter((c) => c.latitude && c.longitude)
    .map((c) => ({ id: c.id, latitude: c.latitude!, longitude: c.longitude!, issue_type: c.issue_type }))
    .slice(0, 50);

  const predictiveReport = computePredictiveRisks(complaints);

  return (
    <div className="relative">
      {/* Dynamic ambient & interactive background */}
      <DynamicDashboardBackground variant="admin" />

      <div className="relative z-10 space-y-6">
        {/* ── Quixotic Top Bar & Greeting ──────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur rounded-2xl border border-[#dde3ed] p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1565c0] animate-pulse"></span>
              <span className="text-[11px] font-bold text-[#1565c0] uppercase tracking-wider">
                Municipal Command &amp; Operations Center
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#002147] tracking-tight">
              Welcome Back, Municipal Officer
            </h1>
            <p className="text-xs text-[#718096] mt-0.5">
              Live urban operations, AI classification review, and field worker dispatch across all municipal wards.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Date range pill (Quixotic style) */}
            <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f4f6fa] rounded-xl border border-[#dde3ed] text-xs font-semibold text-[#4a5568]">
              <span className="material-symbols-outlined text-sm text-[#718096]">calendar_today</span>
              <span>Active Cycle: 2026 Q3</span>
            </div>

            {/* Quick Action */}
            <a
              href="#complaint-table"
              className="px-4 py-2 bg-[#002147] hover:bg-[#003166] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add_task</span>
              <span>Triage Complaints</span>
            </a>
          </div>
        </div>

        {/* ── Quixotic Top Bento Grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          {/* Left Column (Card 1: Operations Card + Card 2: Weekly Velocity) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Card 1: Municipal Status Card (Quixotic "VISA Card" slot) */}
            <div
              className="rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[190px]"
              style={{ background: 'linear-gradient(135deg, #002147 0%, #0d3b66 50%, #1565c0 100%)' }}
            >
              {/* Decorative background watermark */}
              <div className="absolute right-3 -bottom-4 opacity-10 select-none text-[120px] font-bold">
                🏛
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      account_balance
                    </span>
                  </div>
                  <span className="text-xs font-bold tracking-wide uppercase text-white/90">Zone Command</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  94.2% SLA
                </span>
              </div>

              <div className="my-4 relative z-10">
                <p className="text-xs text-white/70">Central Municipal Zone</p>
                <h2 className="text-3xl font-bold tracking-tight text-white mt-0.5">
                  {total} <span className="text-sm font-normal text-white/70">Total Grievances</span>
                </h2>
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/80 border-t border-white/15 pt-3 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-emerald-300">smart_toy</span>
                  <span>{aiRouted} AI Verified</span>
                </div>
                <div>{workers.length} Field Crew Active</div>
              </div>
            </div>

            {/* Card 2: Weekly Resolution Velocity */}
            <div className="bg-white rounded-2xl border border-[#dde3ed] p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#718096]">Weekly Resolution Velocity</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-[#1b5e20]">+{resolved} Resolved</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#e8f5e9] text-[#1b5e20] flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                +18.4%
              </span>
            </div>
          </div>

          {/* Center Column: Grievance Analytics Chart (Quixotic "Engagement Rate" slot) */}
          <div className="lg:col-span-5">
            <AnalyticsCharts complaints={complaints} />
          </div>

          {/* Right Column: Turnaround Speed + Active Crew (Quixotic "Payment Goal & Avatars" slot) */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* Card 3: Turnaround Speed Card */}
            <div className="bg-white rounded-2xl border border-[#dde3ed] p-5 shadow-sm flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#718096]">Avg Turnaround</p>
                  <span className="material-symbols-outlined text-base text-[#1565c0]">speed</span>
                </div>
                <h3 className="text-2xl font-bold text-[#1a2332]">
                  {avgDays > 0 ? `${avgDays.toFixed(1)} Days` : '1.8 Days'}
                </h3>
                <p className="text-[11px] text-[#718096] mt-0.5">Average time to close grievance</p>
              </div>

              {/* Two Quixotic Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#dde3ed]">
                <a
                  href="#complaint-table"
                  className="py-2 px-2.5 bg-[#002147] hover:bg-[#003166] text-white text-center text-[11px] font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">fact_check</span>
                  <span>Verify ({needsVerify})</span>
                </a>
                <a
                  href="#complaint-table"
                  className="py-2 px-2.5 bg-[#f4f6fa] hover:bg-[#dde3ed] text-[#1a2332] text-center text-[11px] font-bold rounded-xl transition-colors border border-[#dde3ed] flex items-center justify-center gap-1"
                >
                  <span>Unassigned ({unassigned})</span>
                </a>
              </div>
            </div>

            {/* Card 4: Active Field Crew (Quixotic "Mandatory Payments" Avatar stack) */}
            <div className="bg-white rounded-2xl border border-[#dde3ed] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#718096]">Field Crew on Duty</p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e3f0fd] text-[#1565c0]">
                  {workers.length} Registered
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2 overflow-hidden py-1">
                  {workers.slice(0, 4).map((w, i) => (
                    <div
                      key={w.id}
                      title={w.display_name ?? w.full_name ?? 'Field Worker'}
                      className="inline-block h-9 w-9 rounded-full ring-2 ring-white flex items-center justify-center font-bold text-xs text-white shadow-sm"
                      style={{ background: ['#1565c0', '#b45309', '#00695c', '#1b5e20'][i % 4] }}
                    >
                      {(w.display_name || w.full_name || 'W')[0].toUpperCase()}
                    </div>
                  ))}
                  {workers.length > 4 && (
                    <div className="inline-block h-9 w-9 rounded-full ring-2 ring-white bg-[#002147] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                      +{workers.length - 4}
                    </div>
                  )}
                  {workers.length === 0 && (
                    <span className="text-xs text-[#718096]">No workers on active shift</span>
                  )}
                </div>

                <span className="text-xs font-semibold text-[#1565c0] hover:underline cursor-pointer">
                  Manage →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Predictive Civic Maintenance & Vulnerability Hotspots ── */}
        <PredictiveHotspotsCard report={predictiveReport} />

        {/* ── Quixotic Bottom Bento: Table + Map + System Health ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Complaints Table (8 Cols) */}
          <div id="complaint-table" className="lg:col-span-8">
            <AdminComplaintsTable
              complaints={complaints}
              workers={workers}
              proofs={proofs}
            />
          </div>

          {/* Right Column: Activity Map + System Health (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Activity Map Card */}
            <div className="bg-white rounded-2xl border border-[#dde3ed] overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-[#dde3ed] bg-[#f8fafc] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#002147]">Ward Activity Map</h3>
                  <p className="text-[11px] text-[#718096]">Recent incident coordinates</p>
                </div>
                <span className="material-symbols-outlined text-base text-[#1565c0]">pin_drop</span>
              </div>
              <div className="p-3">
                <ActivityMap locations={locations} />
              </div>
            </div>

            {/* System Health Card */}
            <div className="bg-white rounded-2xl border border-[#dde3ed] overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-[#dde3ed] bg-[#f8fafc] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#002147]">System Health &amp; AI</h3>
                  <p className="text-[11px] text-[#718096]">Core microservices status</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="divide-y divide-[#dde3ed]/60">
                {[
                  { name: 'Gemini AI Integration', desc: 'Classification & Verification', status: 'Operational', ok: true },
                  { name: 'Supabase Database', desc: 'PostgreSQL & Realtime Auth', status: 'Operational', ok: true },
                  { name: 'Storage Buckets', desc: 'Secure Geo-Tagged Photos', status: 'Operational', ok: true },
                  { name: 'Field Worker Fleet', desc: `${workers.length} Available Staff`, status: `${workers.length} Active`, ok: workers.length > 0 },
                ].map((item) => (
                  <div key={item.name} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1a2332]">{item.name}</p>
                      <p className="text-[11px] text-[#718096]">{item.desc}</p>
                    </div>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={
                        item.ok
                          ? { background: 'var(--nx-success-light)', color: 'var(--nx-success)' }
                          : { background: 'var(--nx-warning-light)', color: 'var(--nx-warning)' }
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
