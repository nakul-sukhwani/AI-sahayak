import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WorkerComplaintDetailClient } from './WorkerComplaintDetailClient';
import type { Complaint } from '@/types/complaint';

export const metadata: Metadata = { title: 'Task Detail — Worker' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkerComplaintPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: complaint, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .eq('assigned_to', user.id)
    .single();

  if (error || !complaint) notFound();

  let imageSignedUrl: string | null = null;
  if (complaint.image_url) {
    const { data } = await supabase.storage
      .from('complaints')
      .createSignedUrl(complaint.image_url, 3600);
    imageSignedUrl = data?.signedUrl ?? null;
  }

  return (
    <div>
      <Link href="/worker" className="flex items-center gap-1 text-sm text-[#545f72] hover:text-[#191c1e] mb-4 transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        My Tasks
      </Link>
      <WorkerComplaintDetailClient
        complaint={complaint as Complaint}
        imageSignedUrl={imageSignedUrl}
      />
    </div>
  );
}
