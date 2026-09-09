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

  const daysOpen = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 3600 * 24));
  const isOverdue = !['resolved', 'closed', 'rejected'].includes(c.status) && daysOpen >= 7;

  return (
    <div className="relative min-h-[85vh]">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 bg-white/80 border border-slate-200 hover:bg-white hover:text-slate-900 shadow-xs transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Back to My Complaints</span>
        </Link>

        {/* Hero Docket Header Bento Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#e8f5e9] text-[#1b5e20] border border-[#a5d6a7]">
                  Civic Grievance #{c.id.slice(0, 8)}
                </span>
                <Badge variant={c.status as ComplaintStatus} />
                <Badge variant={c.severity as ComplaintSeverity} />
                {c.is_anonymous && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                    🛡️ Anonymous
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {getIssueLabel(c.issue_type)}
              </h1>
              {c.subcategory && (
                <p className="text-xs text-slate-500 mt-0.5 capitalize font-medium">
                  Subcategory: {c.subcategory}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/api/generate-pdf?id=${c.id}`}
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs hover:border-slate-300 transition-all flex-shrink-0"
              >
                <span className="material-symbols-outlined text-base text-red-600">picture_as_pdf</span>
                <span>Download Official Docket</span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Overdue RTI Auto-Escalation Banner ── */}
        {isOverdue && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-red-50/95 via-orange-50/80 to-amber-50/70 border-2 border-red-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-2xl">gavel</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-200 text-red-900">
                      SLA Default · {daysOpen} Days Overdue
                    </span>
                    <span className="text-xs font-bold text-red-700">
                      Statutory Redressal Triggered
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                    Auto-Escalate under Right to Information (RTI) Act, 2005
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                    Municipal turnaround guarantees (7 days) have elapsed. Our legal engine has formulated a statutory Section 6(1) petition citing Section 20(1) daily penalties against the Public Information Officer (PIO).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`/api/complaints/${c.id}/generate-rti?format=pdf`}
                  download
                  className="px-4 py-2.5 rounded-xl bg-[#002147] hover:bg-[#003166] text-white text-xs font-bold shadow-sm inline-flex items-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Download Section 6 RTI Petition</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Visual & Geo Evidence (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Primary Complaint Image */}
            {imageSignedUrl && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[#1b5e20]">photo_camera</span>
                    Citizen Photographic Evidence
                  </span>
                  <span className="text-[11px] text-slate-400">Captured at submission</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSignedUrl}
                    alt="Complaint photo"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            )}

            {/* Proof of Resolution (Before & After) */}
            {p && proofSignedUrl && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
                    Field Work Proof &amp; Resolution
                  </span>
                  {p.status === 'approved' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Officer Verified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {imageSignedUrl && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Before Work</p>
                      <div className="rounded-xl overflow-hidden border border-slate-200 aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageSignedUrl} alt="Before" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-emerald-700">After Repair (Proof)</p>
                    <div className="rounded-xl overflow-hidden border border-emerald-200 aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={proofSignedUrl} alt="After" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>

                {p.ai_observation && (
                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/70 text-xs">
                    <div className="flex items-center gap-1.5 mb-1 text-purple-900 font-bold">
                      <span className="material-symbols-outlined text-sm text-[#7C3AED]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        auto_awesome
                      </span>
                      <span>AI Resolution Audit</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{p.ai_observation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Geo Location & Map */}
            {c.address && c.latitude && c.longitude && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-blue-600">location_on</span>
                    Geographic Coordinates &amp; Ward
                  </span>
                  <a
                    href={`https://maps.google.com/?q=${c.latitude},${c.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Google Maps</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  📍 {c.address}
                </p>

                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <MiniMap lat={c.latitude} lng={c.longitude} className="h-44" />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Governance, AI & Timeline (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Issue Description
              </span>
              <p className="text-sm text-slate-800 leading-relaxed font-normal">
                {c.description_en}
              </p>
              {c.description_hi && (
                <p className="text-xs text-slate-500 pt-2 border-t border-slate-100 leading-relaxed font-hindi">
                  {c.description_hi}
                </p>
              )}
              {c.user_notes && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Citizen Supplementary Notes
                  </p>
                  <p className="text-xs text-slate-600 italic bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                    "{c.user_notes}"
                  </p>
                </div>
              )}
            </div>

            {/* AI Analysis Breakdown */}
            {c.ai_confidence != null && (
              <div className="bg-white rounded-2xl border border-purple-200/80 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#7C3AED] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      auto_awesome
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                      AI Triage Telemetry
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    {Math.round(c.ai_confidence * 100)}% Match
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                    <p className="text-[10px] uppercase text-purple-600 font-bold">Target Dept</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{c.ai_suggested_department || 'Municipal Services'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                    <p className="text-[10px] uppercase text-purple-600 font-bold">Priority Triage</p>
                    <p className="font-semibold text-slate-800 mt-0.5 capitalize">{c.severity}</p>
                  </div>
                </div>

                {c.ai_urgency_reason && (
                  <p className="text-[11px] text-purple-800 italic bg-purple-50/40 p-2 rounded-lg">
                    {c.ai_urgency_reason}
                  </p>
                )}

                {c.ai_tags && c.ai_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {c.ai_tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-200/60">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Assigned Worker Card */}
            {workerName && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assigned Field Crew
                </span>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                    {workerName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{workerName}</p>
                    <p className="text-[11px] text-slate-500">On-duty Municipal Field Technician</p>
                  </div>
                </div>
              </div>
            )}

            {/* Lifecycle Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                SLA Lifecycle Timeline
              </span>
              <ComplaintTimeline
                currentStatus={c.status as ComplaintStatus}
                events={[
                  { status: 'filed', timestamp: c.created_at },
                  c.assigned_at ? { status: 'assigned', timestamp: c.assigned_at, actor: workerName } : null,
                ].filter(Boolean) as { status: ComplaintStatus; timestamp: string; actor?: string }[]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
