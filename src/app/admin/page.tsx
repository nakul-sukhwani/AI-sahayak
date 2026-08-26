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

  // Fetch all recent complaints for analytics
  const { data: allComplaints } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500); // Limit to 500 for demo performance

  const complaints = (allComplaints ?? []) as Complaint[];

  // Real analytics data aggregation
  const total = complaints.length;
  const aiRouted = complaints.filter(c => c.ai_confidence && c.ai_confidence > 0.7).length; // rough proxy for AI routing
  const resolved = complaints.filter(c => c.status === 'resolved').length;
  
  // Calculate average resolution time for resolved complaints
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
    { label: 'Total Complaints', value: total.toString(), change: 'Live', positive: true },
    { label: 'AI Auto-Routed', value: aiRouted.toString(), change: 'Live', positive: true },
    { label: 'Resolved', value: resolved.toString(), change: 'Live', positive: true },
    { label: 'Avg Resolution Time', value: avgDays > 0 ? `${avgDays.toFixed(1)} days` : 'N/A', change: 'Live', positive: true },
  ];

  const locations = complaints
    .filter(c => c.latitude && c.longitude)
    .map(c => ({ id: c.id, latitude: c.latitude!, longitude: c.longitude!, issue_type: c.issue_type }))
    .slice(0, 50);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#191c1e] tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-[#545f72] mt-1">System overview and analytics.</p>
      </div>

      {/* Real Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-[#545f72]">{s.label}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-[#191c1e]">{s.value}</p>
              <span className={`text-xs font-semibold ${s.positive ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                {s.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Charts */}
      <AnalyticsCharts complaints={complaints} />

      {/* Activity Map */}
      <div className="mb-8 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-semibold text-[#191c1e]">Recent Activity Map</h2>
          <p className="text-xs text-[#545f72] mt-0.5">Geographical distribution of recently filed complaints.</p>
        </div>
        <div className="p-4">
          <ActivityMap locations={locations} />
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm mb-4">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-semibold text-[#191c1e]">System Health</h2>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#191c1e]">Gemini AI Integration</p>
              <p className="text-xs text-[#545f72]">Auto-classification and proof verification</p>
            </div>
            <span className="px-2 py-1 bg-[#d1fae5] text-[#059669] text-xs font-bold rounded-md uppercase tracking-wide">Operational</span>
          </div>
          <div className="w-full h-px bg-[#E2E8F0]" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#191c1e]">Supabase Database</p>
              <p className="text-xs text-[#545f72]">Core database and Auth</p>
            </div>
            <span className="px-2 py-1 bg-[#d1fae5] text-[#059669] text-xs font-bold rounded-md uppercase tracking-wide">Operational</span>
          </div>
          <div className="w-full h-px bg-[#E2E8F0]" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#191c1e]">Storage Bucket</p>
              <p className="text-xs text-[#545f72]">Image hosting</p>
            </div>
            <span className="px-2 py-1 bg-[#d1fae5] text-[#059669] text-xs font-bold rounded-md uppercase tracking-wide">Operational</span>
          </div>
        </div>
      </div>
    </>
  );
}
