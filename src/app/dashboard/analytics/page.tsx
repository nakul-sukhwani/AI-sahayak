import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Briefcase, CheckCircle, Database, TrendingUp } from 'lucide-react';
import { headers } from 'next/headers';

export const metadata = {
  title: 'Analytics Dashboard | Nagrik Seva',
};

async function getAnalyticsData() {
  const host = (await headers()).get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  // Need to forward cookies for the auth check inside the API
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const res = await fetch(`${protocol}://${host}/api/dashboard/analytics`, {
    headers: {
      cookie: (await headers()).get('cookie') || '',
    },
    cache: 'no-store'
  });
  
  if (!res.ok) return null;
  return res.json();
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users_profile')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'supervisor', 'officer'].includes(profile.role)) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500 mt-2">You do not have permission to view the analytics dashboard.</p>
      </div>
    );
  }

  const data = await getAnalyticsData();

  if (!data) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load analytics data.
      </div>
    );
  }

  const { stats, charts } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Societal Innovation Analytics</h1>
        <p className="text-slate-500 mt-2">
          Overview of challenges, proposals, and industry support across the platform.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Challenges</CardTitle>
            <Database className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.total_challenges}</div>
            <p className="text-xs text-slate-400 mt-1">Submitted across all domains</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Proposals</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.active_proposals}</div>
            <p className="text-xs text-slate-400 mt-1">Research teams formed</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Industry Funding</CardTitle>
            <Briefcase className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              ₹{(stats.total_funding_inr / 100000).toFixed(1)}L
            </div>
            <p className="text-xs text-slate-400 mt-1">Total committed capital</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Deployed Solutions</CardTitle>
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.deployed_solutions}</div>
            <p className="text-xs text-slate-400 mt-1">Successfully deployed</p>
          </CardContent>
        </Card>
      </div>

      <AnalyticsCharts domainData={charts.challenges_by_domain} />
    </div>
  );
}
