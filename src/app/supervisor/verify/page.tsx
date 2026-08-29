import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { VerificationQueue, type WorkProofWithDetails } from '@/components/supervisor/VerificationQueue';

export const metadata: Metadata = {
  title: 'Verify Proofs — Supervisor',
  description: 'Review and verify work proofs submitted by field workers.',
};

export default async function SupervisorVerifyPage() {
  const supabase = await createClient();

  // Fetch pending proofs along with complaint and worker info
  const { data: proofs } = await supabase
    .from('work_proof')
    .select(`
      id, complaint_id, before_photo_url, after_photo_url,
      ai_verified, ai_confidence, ai_observation, worker_notes, submitted_at,
      complaints ( issue_type, description_en, ward_name, address, latitude, longitude, created_at ),
      users_profile!work_proof_worker_id_fkey ( full_name, display_name ),
      worker_job_reports ( damage_type, worker_issues, tools_required, team_members_count, captured_latitude, captured_longitude, captured_at )
    `)
    .in('status', ['pending', 'ai_verified'])
    .order('submitted_at', { ascending: false });

  const rawProofs = (proofs ?? []) as unknown as any[];

  // Generate signed URLs
  const proofsWithUrls: WorkProofWithDetails[] = await Promise.all(
    rawProofs.map(async (p) => {
      let beforeSignedUrl = null;
      let afterSignedUrl = null;

      if (p.before_photo_url) {
        const { data } = await supabase.storage.from('complaints').createSignedUrl(p.before_photo_url, 3600);
        beforeSignedUrl = data?.signedUrl ?? null;
      }
      if (p.after_photo_url) {
        const { data } = await supabase.storage.from('complaints').createSignedUrl(p.after_photo_url, 3600);
        afterSignedUrl = data?.signedUrl ?? null;
      }

      return {
        ...p,
        beforeSignedUrl,
        afterSignedUrl,
      };
    })
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#191c1e] tracking-tight">
          Verify Proofs
        </h1>
        <p className="text-sm text-[#545f72] mt-1">
          Review completion photos submitted by workers and approve or reject them.
        </p>
      </div>

      <VerificationQueue initialProofs={proofsWithUrls} />
    </div>
  );
}
