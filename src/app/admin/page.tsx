import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ActivityMap } from '@/components/admin/ActivityMap';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';
import { AdminComplaintsTable } from '@/components/admin/AdminComplaintsTable';
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

  return (
    <div className="relative">
      {/* ── Dot-grid page decoration ─────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 nx-dot-grid"
        style={{ zIndex: 0, opacity: 0.4 }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* ── Hero panel ─────────────────────────────────────────── */}
        <div className="nx-hero-panel nx-hero-admin">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(21,101,192,0.15)' }}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{ color: 'var(--nx-admin)', fontVariationSettings: "'FILL' 1" }}
              >
                admin_panel_settings
              </span>
            </div>
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--nx-admin)' }}
              >
                Officer Portal
              </p>
              <h1 className="text-xl font-bold text-[#002147] tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-xs text-[#718096] mt-0.5">
                Manage all complaints — assign workers, verify proof, track system health.
              </p>
            </div>
          </div>

          {/* Action badges */}
          {(unassigned > 0 || needsVerify > 0) && (
            <div className="flex gap-3 mt-4 flex-wrap">
              {unassigned > 0 && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold"
                  style={{ background: 'var(--nx-warning-light)', color: 'var(--nx-warning)', border: '1px solid rgba(230,81,0,0.2)' }}
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
                  {unassigned} unassigned
                </div>
              )}
              {needsVerify > 0 && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold"
                  style={{ background: 'var(--nx-worker-light)', color: 'var(--nx-worker)', border: '1px solid rgba(180,83,9,0.2)' }}
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
                  {needsVerify} awaiting verification
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-7">
          {stats.map((s) => (
            <div
              key={s.label}
              className="nx-card nx-stat-card p-4 flex flex-col gap-1.5"
              style={{ background: s.bgVar, borderColor: 'rgba(0,0,0,0.06)' }}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{ color: s.accent, fontVariationSettings: "'FILL' 1" }}
              >
                {s.icon}
              </span>
              <p className="text-2xl font-bold" style={{ color: s.accent }}>{s.value}</p>
              <p className="text-[11px] text-[#718096] leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Complaint Management ────────────────────────────────── */}
        <div className="mb-7">
          <div className="nx-section-label">
            <span className="material-symbols-outlined text-sm" style={{ color: 'var(--nx-admin)' }}>table_view</span>
            <span>Complaint Management</span>
          </div>
          <AdminComplaintsTable
            complaints={complaints}
            workers={workers}
            proofs={proofs}
          />
        </div>

        {/* ── Analytics ──────────────────────────────────────────── */}
        <div className="mb-7">
          <div className="nx-section-label">
            <span className="material-symbols-outlined text-sm" style={{ color: 'var(--nx-admin)' }}>bar_chart</span>
            <span>Analytics</span>
          </div>
          <AnalyticsCharts complaints={complaints} />
        </div>

        {/* ── Map ─────────────────────────────────────────────────── */}
        <div className="mb-7">
          <div className="nx-section-label">
            <span className="material-symbols-outlined text-sm" style={{ color: 'var(--nx-admin)' }}>map</span>
            <span>Activity Map</span>
          </div>
          <div className="nx-card overflow-hidden">
            <div
              className="px-5 py-3 border-b border-[#dde3ed]"
              style={{ background: 'var(--nx-admin-light)' }}
            >
              <h2 className="text-sm font-bold text-[#002147]">Recent Activity Map</h2>
              <p className="text-[11px] text-[#718096]">Geographical distribution of recently filed complaints</p>
            </div>
            <div className="p-4">
              <ActivityMap locations={locations} />
            </div>
          </div>
        </div>

        {/* ── System Health ────────────────────────────────────────── */}
        <div>
          <div className="nx-section-label">
            <span className="material-symbols-outlined text-sm" style={{ color: 'var(--nx-admin)' }}>monitor_heart</span>
            <span>System Health</span>
          </div>
          <div className="nx-card overflow-hidden">
            <div className="divide-y divide-[#dde3ed]">
              {[
                { name: 'Gemini AI Integration',  desc: 'Auto-classification and proof verification', status: 'Operational', ok: true },
                { name: 'Supabase Database',       desc: 'Core database and Auth',                    status: 'Operational', ok: true },
                { name: 'Storage Bucket',          desc: 'Image hosting',                             status: 'Operational', ok: true },
                { name: 'Worker Pool',             desc: `${workers.length} active workers registered`, status: `${workers.length} workers`, ok: workers.length > 0 },
              ].map((item) => (
                <div key={item.name} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1a2332]">{item.name}</p>
                    <p className="text-xs text-[#718096]">{item.desc}</p>
                  </div>
                  <span
                    className="nx-badge"
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
  );
}
