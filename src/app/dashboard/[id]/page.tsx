import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ComplaintTimeline } from '@/components/complaints/ComplaintTimeline';
import { MiniMap } from '@/components/ui/minimap';
import { Badge } from '@/components/ui/badge';
import { getIssueLabel } from '@/constants/issue-types';
import type { Complaint } from '@/types/complaint';
import type { ComplaintSeverity, ComplaintStatus } from '@/types/complaint';
import type { WorkProof } from '@/types/work-proof';

export const metadata: Metadata = { title: 'Complaint Detail' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ComplaintDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: complaint, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !complaint) notFound();

  // Fetch proof if exists
  const { data: proof } = await supabase
    .from('work_proof')
    .select('*')
    .eq('complaint_id', id)
    .maybeSingle();

  // Fetch worker name if assigned
  let workerName: string | null = null;
  if (complaint.assigned_to) {
    const { data: wp } = await supabase
      .from('users_profile')
      .select('full_name, display_name')
      .eq('id', complaint.assigned_to)
      .single();
    workerName = wp?.full_name ?? wp?.display_name ?? null;
  }

  const c = complaint as Complaint;
  const p = proof as WorkProof | null;

  // Get signed URL for complaint image
  let imageSignedUrl: string | null = null;
  if (c.image_url) {
    const { data: signed } = await supabase.storage
      .from('complaints')
      .createSignedUrl(c.image_url, 3600);
    imageSignedUrl = signed?.signedUrl ?? null;
  }

  // Get signed URL for proof photo
  let proofSignedUrl: string | null = null;
  if (p?.after_photo_url) {
    const { data: signed } = await supabase.storage
      .from('complaints')
      .createSignedUrl(p.after_photo_url, 3600);
    proofSignedUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/dashboard" className="flex items-center gap-1 text-sm text-[#545f72] hover:text-[#191c1e] mb-4 transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        My Complaints
      </Link>

      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-[#191c1e]">{getIssueLabel(c.issue_type)}</h1>
          {c.subcategory && <p className="text-sm text-[#545f72] mt-0.5 capitalize">{c.subcategory}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant={c.status as ComplaintStatus} />
            <Badge variant={c.severity as ComplaintSeverity} />
            {c.is_anonymous && <Badge variant="neutral" label="Anonymous" />}
          </div>
        </div>
        {/* PDF Download */}
        <a
          href={`/api/generate-pdf?id=${c.id}`}
          download
          className="flex items-center gap-1.5 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#545f72] hover:text-[#001e40] hover:border-[#001e40] transition-colors flex-shrink-0"
        >
          <span className="material-symbols-outlined text-base">picture_as_pdf</span>
          PDF
        </a>
      </div>

      {/* Photo */}
      {imageSignedUrl && (
        <div className="mb-5 rounded-xl overflow-hidden border border-[#E2E8F0]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSignedUrl} alt="Complaint photo" className="w-full aspect-[4/3] object-cover" />
        </div>
      )}

      {/* Description */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-2">Description</p>
        <p className="text-sm text-[#191c1e] leading-relaxed">{c.description_en}</p>
        {c.description_hi && <p className="text-sm text-[#545f72] mt-2 leading-relaxed">{c.description_hi}</p>}
        {c.user_notes && (
          <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-1">Your notes</p>
            <p className="text-sm text-[#545f72]">{c.user_notes}</p>
          </div>
        )}
      </div>

      {/* Location */}
      {c.address && c.latitude && c.longitude && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-4 flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-1">Location</p>
            <p className="text-sm text-[#545f72]">{c.address}</p>
          </div>
          <MiniMap lat={c.latitude} lng={c.longitude} className="h-32" />
          <a
            href={`https://maps.google.com/?q=${c.latitude},${c.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline"
          >
            <span className="material-symbols-outlined text-xs">open_in_new</span>
            Open in Google Maps
          </a>
        </div>
      )}

      {/* AI Analysis */}
      {c.ai_confidence != null && (
        <div className="bg-[#faf8ff] border border-[#7C3AED]/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[#7C3AED] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7C3AED]">AI Analysis</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><p className="text-xs text-[#545f72]">Confidence</p><p className="font-medium">{Math.round(c.ai_confidence * 100)}%</p></div>
            {c.ai_suggested_department && <div><p className="text-xs text-[#545f72]">Department</p><p className="font-medium">{c.ai_suggested_department}</p></div>}
          </div>
          {c.ai_urgency_reason && <p className="text-xs text-[#7C3AED] mt-2 italic">{c.ai_urgency_reason}</p>}
          {c.ai_tags && c.ai_tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {c.ai_tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-[#ede9fe] text-[#7C3AED] rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignment */}
      {workerName && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-2">Assigned Worker</p>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2563EB]">construction</span>
            <p className="text-sm font-medium text-[#191c1e]">{workerName}</p>
          </div>
        </div>
      )}

      {/* Proof of work */}
      {p && proofSignedUrl && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-3">Proof of Resolution</p>
          <div className="grid grid-cols-2 gap-2">
            {imageSignedUrl && (
              <div>
                <p className="text-xs text-[#545f72] mb-1">Before</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSignedUrl} alt="Before" className="w-full aspect-square object-cover rounded-lg" />
              </div>
            )}
            <div>
              <p className="text-xs text-[#545f72] mb-1">After</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proofSignedUrl} alt="After" className="w-full aspect-square object-cover rounded-lg" />
            </div>
          </div>
          {p.ai_observation && (
            <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-[#7C3AED] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <p className="text-xs font-semibold text-[#7C3AED]">AI Verification</p>
                <Badge variant={p.ai_verified ? 'resolved' : 'rejected'} label={p.ai_verified ? 'Resolved' : 'Issues Remain'} />
              </div>
              <p className="text-xs text-[#545f72]">{p.ai_observation}</p>
            </div>
          )}
          {p.status === 'approved' && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#059669] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <p className="text-sm font-medium text-[#059669]">Verified by Officer</p>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-4">Timeline</p>
        <ComplaintTimeline
          currentStatus={c.status as ComplaintStatus}
          events={[
            { status: 'filed', timestamp: c.created_at },
            c.assigned_at ? { status: 'assigned', timestamp: c.assigned_at, actor: workerName } : null,
          ].filter(Boolean) as { status: ComplaintStatus; timestamp: string; actor?: string }[]}
        />
      </div>
    </div>
  );
}
