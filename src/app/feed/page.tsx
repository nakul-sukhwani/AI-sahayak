import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ComplaintCard } from '@/components/complaints/ComplaintCard';
import type { Complaint } from '@/types/complaint';

export const metadata: Metadata = {
  title: 'Public Feed — Nagrik Seva',
  description: 'View recently filed civic complaints in your city.',
};

export default async function FeedPage() {
  const supabase = await createClient();

  // Fetch recent public complaints
  const { data: complaints } = await supabase
    .from('complaints')
    .select('*')
    // We could filter by visibility='public' here if we had a strict privacy model
    // But for the sake of the demo feed, we will just show recent complaints.
    // .eq('visibility', 'public') 
    .order('created_at', { ascending: false })
    .limit(30);

  const feed = (complaints ?? []) as Complaint[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#191c1e] tracking-tight">Public Feed</h1>
        <p className="text-sm text-[#545f72] mt-1">Recent civic issues reported in your area.</p>
      </div>

      {feed.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-[#c3c6d1]">public_off</span>
          <div>
            <p className="text-base font-medium text-[#191c1e]">No public reports</p>
            <p className="text-sm text-[#545f72] mt-1">There are no recent civic issues to display here.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {feed.map((c) => (
            <ComplaintCard key={c.id} complaint={c} />
          ))}
        </div>
      )}
    </div>
  );
}
