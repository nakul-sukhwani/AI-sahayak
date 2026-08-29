import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { FeedClient } from '@/components/feed/FeedClient';
import type { Complaint } from '@/types/complaint';

export const metadata: Metadata = {
  title: 'Public Feed — Nagrik Seva',
  description: 'View recently filed civic complaints in your city.',
};

export default async function FeedPage() {
  let feed: Complaint[] = [];

  try {
    const supabase = await createClient();
    const { data: complaints } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    feed = (complaints ?? []) as Complaint[];
  } catch {
    // Fallback on local dev
  }

  return <FeedClient feed={feed} />;
}
