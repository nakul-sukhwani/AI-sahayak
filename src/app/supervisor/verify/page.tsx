import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { VerificationQueue, type WorkProofWithDetails } from '@/components/supervisor/VerificationQueue';

export const metadata: Metadata = {
  title: 'Verify Proofs — Supervisor',
  description: 'Review and verify work proofs submitted by field workers.',
};

const DEMO_PROOFS: WorkProofWithDetails[] = [
  {
    id: 'demo-proof-1',
    complaint_id: 'demo-task-1',
    before_photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop',
    after_photo_url: 'https://images.unsplash.com/photo-1584463699039-38e553dc7245?w=600&auto=format&fit=crop',
    ai_verified: true,
    ai_confidence: 0.94,
    ai_observation: 'Pothole asphalt patch completed smoothly. Surface leveled and debris removed.',
    worker_notes: 'Asphalt filled, compacted with roller, road reopened to traffic.',
    submitted_at: new Date(Date.now() - 1800000).toISOString(),
    complaints: {
      issue_type: 'pothole',
      description_en: 'Severe pothole causing traffic obstruction on 80 Feet Road.',
      ward_name: 'Koramangala',
      address: '80 Feet Road, 4th Block, Koramangala, Bangalore',
      latitude: 12.9352,
      longitude: 77.6245,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    users_profile: {
      full_name: 'Raju Nair',
      display_name: 'Raju',
    },
    worker_job_reports: [
      {
        damage_type: 'Pothole/Cracked Surface',
        worker_issues: 'Traffic diversion required during asphalt roller compaction.',
        tools_required: ['Roller', 'Asphalt Patch', 'Tamping tool'],
        team_members_count: 3,
        captured_latitude: 12.9354,
        captured_longitude: 77.6247,
        captured_at: new Date(Date.now() - 1800000).toISOString(),
      }
    ],
    beforeSignedUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop',
    afterSignedUrl: 'https://images.unsplash.com/photo-1584463699039-38e553dc7245?w=600&auto=format&fit=crop',
  }
];

export default async function SupervisorVerifyPage() {
  let proofsWithUrls: WorkProofWithDetails[] = [];

  try {
    const supabase = await createClient();
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

    if (rawProofs.length > 0) {
      proofsWithUrls = await Promise.all(
        rawProofs.map(async (p) => {
          let beforeSignedUrl = null;
          let afterSignedUrl = null;

          if (p.before_photo_url) {
            const { data } = await supabase.storage.from('complaints').createSignedUrl(p.before_photo_url, 3600);
            beforeSignedUrl = data?.signedUrl ?? p.before_photo_url;
          }
          if (p.after_photo_url) {
            const { data } = await supabase.storage.from('complaints').createSignedUrl(p.after_photo_url, 3600);
            afterSignedUrl = data?.signedUrl ?? p.after_photo_url;
          }

          return {
            ...p,
            beforeSignedUrl,
            afterSignedUrl,
          };
        })
      );
    }
  } catch {
    // Handled in fallback below
  }

  if (proofsWithUrls.length === 0) {
    proofsWithUrls = DEMO_PROOFS;
  }

  return <VerificationQueue initialProofs={proofsWithUrls} />;
}
