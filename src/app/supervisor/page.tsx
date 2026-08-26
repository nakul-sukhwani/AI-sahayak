import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AssignmentQueue } from '@/components/supervisor/AssignmentQueue';
import type { Complaint } from '@/types/complaint';

export const metadata: Metadata = {
  title: 'Assignment Queue — Supervisor',
  description: 'Assign pending civic complaints to field workers.',
};

export default async function SupervisorDashboardPage() {
  const supabase = await createClient();

  const { data: complaints } = await supabase
    .from('complaints')
    .select('*')
    .eq('status', 'filed')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#191c1e] tracking-tight">
          Assignment Queue
        </h1>
        <p className="text-sm text-[#545f72] mt-1">
          Review newly filed complaints and assign them to workers.
        </p>
      </div>

      <AssignmentQueue initialComplaints={(complaints as Complaint[]) ?? []} />
    </div>
  );
}
