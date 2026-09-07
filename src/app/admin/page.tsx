import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ActivityMap } from '@/components/admin/ActivityMap';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';
import type { Complaint } from '@/types/complaint';

export const metadata: Metadata = {
  title: 'Admin Dashboard — Nagrik Seva',
  description: 'System analytics and overview.',
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { data: allComplaints } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  const complaints = (allComplaints ?? []) as Complaint[];

  const total = complaints.length;
  const aiRouted = complaints.filter(c => c.ai_confidence && c.ai_confidence > 0.7).length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;

  let avgDays = 0;
  if (resolved > 0) {
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved' && c.updated_at);
    const totalDays = resolvedComplaints.reduce((acc, c) => {
      const created = new Date(c.created_at);
      const updated = new Date(c.updated_at!);
      return acc + (updated.getTime() - created.getTime()) / (1000 * 3600 * 24);
    }, 0);
    avgDays = resolvedComplaints.length > 0 ? totalDays / resolvedComplaints.length : 0;
  }

  const stats = [
    { label: 'Total Complaints',    value: total.toString(),                              icon: 'assignment',          accent: '#1565c0' },
    { label: 'AI Auto-Routed',       value: aiRouted.toString(),                           icon: 'smart_toy',           accent: '#5c35a8' },
    { label: 'Resolved',             value: resolved.toString(),                            icon: 'task_alt',            accent: '#1b5e20' },
    { label: 'Avg Resolution Time',  value: avgDays > 0 ? `${avgDays.toFixed(1)}d` : 'N/A', icon: 'schedule',            accent: '#b45309' },
  ];

  const locations = complaints
    .filter(c => c.latitude && c.longitude)
    .map(c => ({ id: c.id, latitude: c.latitude!, longitude: c.longitude!, issue_type: c.issue_type }))
    .slice(0, 50);

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="mb-6 pb-5 border-b border-[#dde3ed] flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--nx-admin-light)' }}
        >
          <span
            className="material-symbols-outlined text-lg"
            style={{ color: 'var(--nx-admin)', fontVariationSettings: "'FILL' 1" }}
          >
            admin_panel_settings
          </span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--nx-admin)' }}>
            Officer Portal
          </p>
          <h1 className="text-xl font-bold text-[#002147] tracking-tight leading-tight">Admin Dashboard</h1>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {stats.map((s) => (
          <div key={s.label} className="nx-card p-5 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: s.accent + '18' }}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ color: s.accent, fontVariationSettings: "'FILL' 1" }}
                >
                  {s.icon}
                </span>
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: s.accent + '15', color: s.accent }}
              >
                Live
              </span>
            </div>
            <p className="text-sm text-[#718096] mt-1">{s.label}</p>
            <p className="text-2xl font-bold text-[#002147]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ────────────────────────────────────────────────── */}
      <AnalyticsCharts complaints={complaints} />

      {/* ── Map ───────────────────────────────────────────────────── */}
      <div className="mb-7 nx-card overflow-hidden">
        <div
          className="px-5 py-3 border-b border-[#dde3ed] flex items-center gap-2"
          style={{ background: 'var(--nx-admin-light)' }}
        >
          <span
            className="material-symbols-outlined text-base"
            style={{ color: 'var(--nx-admin)', fontVariationSettings: "'FILL' 1" }}
          >
            map
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#002147]">Recent Activity Map</h2>
            <p className="text-[11px] text-[#718096]">Geographical distribution of recently filed complaints</p>
          </div>
        </div>
        <div className="p-4">
          <ActivityMap locations={locations} />
        </div>
      </div>

      {/* ── System Health ────────────────────────────────────────── */}
      <div className="nx-card overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-[#dde3ed]" style={{ background: 'var(--nx-navy-light)' }}>
          <h2 className="text-sm font-bold text-[#002147]">System Health</h2>
        </div>
        <div className="divide-y divide-[#dde3ed]">
          {[
            { name: 'Gemini AI Integration',  desc: 'Auto-classification and proof verification' },
            { name: 'Supabase Database',       desc: 'Core database and Auth' },
            { name: 'Storage Bucket',          desc: 'Image hosting' },
          ].map((item) => (
            <div key={item.name} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1a2332]">{item.name}</p>
                <p className="text-xs text-[#718096]">{item.desc}</p>
              </div>
              <span
                className="nx-badge"
                style={{ background: 'var(--nx-success-light)', color: 'var(--nx-success)' }}
              >
                Operational
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
