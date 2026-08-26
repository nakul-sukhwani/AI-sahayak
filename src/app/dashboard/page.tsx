import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ComplaintCard } from '@/components/complaints/ComplaintCard';
import type { Complaint } from '@/types/complaint';

export const metadata: Metadata = {
  title: 'My Complaints',
  description: 'Track the status of all your filed civic complaints.',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users_profile')
    .select('full_name, display_name, role')
    .eq('id', user.id)
    .single();

  const { data: complaints } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const displayName = profile?.display_name ?? profile?.full_name ?? 'Citizen';

  const active = (complaints as Complaint[])?.filter(
    (c) => !['resolved', 'rejected'].includes(c.status)
  ) ?? [];
  const resolved = (complaints as Complaint[])?.filter(
    (c) => ['resolved', 'rejected'].includes(c.status)
  ) ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#191c1e] tracking-tight">
            Welcome, {displayName}
          </h1>
          <p className="text-sm text-[#545f72] mt-1">
            {complaints?.length ?? 0} complaint{complaints?.length !== 1 ? 's' : ''} filed
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#001e40] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Report Issue
        </Link>
      </div>

      {/* Stats row */}
      {(complaints?.length ?? 0) > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Active', count: active.length, color: 'text-[#2563EB]', bg: 'bg-[#dbeafe]' },
            { label: 'Resolved', count: resolved.filter(c => c.status === 'resolved').length, color: 'text-[#059669]', bg: 'bg-[#d1fae5]' },
            { label: 'Total', count: complaints?.length ?? 0, color: 'text-[#001e40]', bg: 'bg-[#f7f9fb]' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-3 text-center border border-[#E2E8F0]`}>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-xs text-[#545f72] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {(complaints?.length ?? 0) === 0 && (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-[#c3c6d1]">assignment</span>
          <div>
            <p className="text-base font-medium text-[#191c1e]">No complaints yet</p>
            <p className="text-sm text-[#545f72] mt-1">Report your first civic issue to get started.</p>
          </div>
          <Link
            href="/dashboard/new"
            className="px-6 py-3 bg-[#001e40] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Report your first issue
          </Link>
        </div>
      )}

      {/* Active complaints */}
      {active.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-[#43474f] uppercase tracking-widest mb-3">
            Active ({active.length})
          </h2>
          <div className="flex flex-col gap-3">
            {active.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
          </div>
        </section>
      )}

      {/* Resolved complaints */}
      {resolved.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#43474f] uppercase tracking-widest mb-3">
            Resolved / Closed ({resolved.length})
          </h2>
          <div className="flex flex-col gap-3">
            {resolved.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}
