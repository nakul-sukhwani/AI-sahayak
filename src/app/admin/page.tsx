import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { ActivityMap } from '@/components/admin/ActivityMap';

export const metadata: Metadata = {
  title: 'Admin Dashboard — Nagrik Seva',
  description: 'System analytics and overview.',
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users_profile')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch recent complaint locations
  const { data: recentComplaints } = await supabase
    .from('complaints')
    .select('id, latitude, longitude, issue_type')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  const locations = (recentComplaints ?? []) as { id: string; latitude: number; longitude: number; issue_type: string }[];

  // Mock analytics data
  const stats = [
    { label: 'Total Complaints', value: '1,245', change: '+12%', positive: true },
    { label: 'AI Auto-Routed', value: '1,180', change: '+15%', positive: true },
    { label: 'Resolved (7d)', value: '856', change: '+5%', positive: true },
    { label: 'Avg Resolution Time', value: '2.4 days', change: '-10%', positive: true },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 pb-20 md:pb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#191c1e] tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-[#545f72] mt-1">System overview and analytics.</p>
        </div>

        {/* Mock Stats */}
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
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
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
      </main>
      <MobileNav />
    </div>
  );
}
