import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AssignmentCard } from '@/components/worker/AssignmentCard';
import type { Complaint } from '@/types/complaint';

export const metadata: Metadata = {
  title: 'My Tasks — Worker',
  description: 'View and manage your assigned civic complaint tasks.',
};

export default async function WorkerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users_profile')
    .select('full_name, display_name')
    .eq('id', user.id)
    .single();

  // Active assignments
  const { data: active } = await supabase
    .from('complaints')
    .select('*')
    .eq('assigned_to', user.id)
    .in('status', ['assigned', 'in_progress'])
    .order('assigned_at', { ascending: false });

  // Completed assignments (last 20)
  const { data: completed } = await supabase
    .from('complaints')
    .select('*')
    .eq('assigned_to', user.id)
    .in('status', ['proof_submitted', 'resolved', 'rejected'])
    .order('status_updated_at', { ascending: false })
    .limit(20);

  const displayName = profile?.display_name ?? profile?.full_name ?? 'Worker';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#191c1e] tracking-tight">
          Tasks — {displayName}
        </h1>
        <p className="text-sm text-[#545f72] mt-1">
          {(active?.length ?? 0)} active · {(completed?.length ?? 0)} completed
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Active', count: active?.length ?? 0, color: 'text-[#D97706]', bg: 'bg-[#fef3c7]' },
          { label: 'Done', count: completed?.filter(c => c.status === 'resolved').length ?? 0, color: 'text-[#059669]', bg: 'bg-[#d1fae5]' },
          { label: 'Total', count: (active?.length ?? 0) + (completed?.length ?? 0), color: 'text-[#001e40]', bg: 'bg-[#f7f9fb]' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-[#E2E8F0]`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-[#545f72] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {(active?.length ?? 0) === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-[#c3c6d1]">construction</span>
          <p className="text-base font-medium text-[#191c1e] mt-3">No active tasks</p>
          <p className="text-sm text-[#545f72] mt-1">Your supervisor will assign tasks to you shortly.</p>
        </div>
      )}

      {/* Active tasks */}
      {(active?.length ?? 0) > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-[#43474f] uppercase tracking-widest mb-3">
            Active Tasks ({active?.length})
          </h2>
          <div className="flex flex-col gap-3">
            {active?.map((c) => <AssignmentCard key={c.id} complaint={c as Complaint} />)}
          </div>
        </section>
      )}

      {/* Completed */}
      {(completed?.length ?? 0) > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#43474f] uppercase tracking-widest mb-3">
            Recent Completed ({completed?.length})
          </h2>
          <div className="flex flex-col gap-3">
            {completed?.map((c) => <AssignmentCard key={c.id} complaint={c as Complaint} />)}
          </div>
        </section>
      )}
    </div>
  );
}
