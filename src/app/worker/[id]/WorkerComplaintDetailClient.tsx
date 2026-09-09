'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProofSubmission } from '@/components/worker/ProofSubmission';
import { ComplaintTimeline } from '@/components/complaints/ComplaintTimeline';
import { MiniMap } from '@/components/ui/minimap';
import { useToast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import { getIssueLabel } from '@/constants/issue-types';
import type { Complaint, ComplaintSeverity, ComplaintStatus } from '@/types/complaint';
import type { TranslationKey } from '@/lib/translations';

interface WorkerComplaintDetailClientProps {
  complaint: Complaint;
  imageSignedUrl: string | null;
}

export function WorkerComplaintDetailClient({
  complaint,
  imageSignedUrl,
}: WorkerComplaintDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isStarting, setIsStarting] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(complaint.status);

  const issueName = t(complaint.issue_type as TranslationKey) || getIssueLabel(complaint.issue_type);

  async function handleStartWork() {
    setIsStarting(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/start-work`, { method: 'POST' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to start work');
      setCurrentStatus('in_progress');
      toast('Status updated to In Progress', 'success');
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to start work', 'error');
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/worker"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 bg-white/80 border border-slate-200 hover:bg-white hover:text-slate-900 shadow-xs transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        <span>Back to Assigned Tasks</span>
      </Link>

      {/* Hero Task Header Bento Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-full bg-gradient-to-l from-amber-50/80 via-amber-50/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#fef3e2] text-[#b45309] border border-[#f6c17a]">
                Field Work Order #{complaint.id.slice(0, 8)}
              </span>
              <Badge variant={currentStatus as ComplaintStatus} />
              <Badge variant={complaint.severity as ComplaintSeverity} />
              {complaint.ward_name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                  📍 {complaint.ward_name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {issueName}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Assigned Field Work Request · GPS Verification Required
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentStatus === 'assigned' && !showProof && (
              <Button
                onClick={handleStartWork}
                isLoading={isStarting}
                className="px-5 py-2.5 text-xs font-bold bg-[#b45309] hover:bg-[#92400e] text-white shadow-sm rounded-xl"
              >
                <span className="material-symbols-outlined text-base mr-1.5">play_arrow</span>
                {t('start_work_btn') || 'Commence Work'}
              </Button>
            )}

            {currentStatus === 'in_progress' && !showProof && (
              <Button
                onClick={() => setShowProof(true)}
                className="px-5 py-2.5 text-xs font-bold bg-[#1b5e20] hover:bg-[#144717] text-white shadow-sm rounded-xl"
              >
                <span className="material-symbols-outlined text-base mr-1.5">photo_camera</span>
                {t('submit_proof_btn') || 'Submit Resolution Proof'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Media & Geo Navigation (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {imageSignedUrl && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-[#b45309]">warning</span>
                  Reported Problem Photo
                </span>
                <span className="text-[11px] text-slate-400">Target Site Image</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSignedUrl} alt="Complaint" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {complaint.address && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-blue-600">navigation</span>
                  Site Navigation &amp; Coordinates
                </span>
                <a
                  href={`https://maps.google.com/?q=${complaint.latitude},${complaint.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Directions in Google Maps</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              </div>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                📍 {complaint.address}
              </p>
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <MiniMap lat={complaint.latitude!} lng={complaint.longitude!} className="h-44" />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Work Order Actions & Proof Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Description Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Work Order Instructions
            </span>
            <p className="text-sm text-slate-800 leading-relaxed">
              {complaint.description_en}
            </p>
            {complaint.ai_urgency_reason && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-amber-600 flex-shrink-0 mt-0.5">
                  priority_high
                </span>
                <p className="italic leading-snug">{complaint.ai_urgency_reason}</p>
              </div>
            )}
          </div>

          {/* Proof Submission Modal / Card */}
          {showProof && (
            <div className="bg-white rounded-2xl border-2 border-[#1b5e20] shadow-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1b5e20] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">verified</span>
                  Resolution Verification
                </span>
                <button
                  type="button"
                  onClick={() => setShowProof(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>
              <ProofSubmission
                complaintId={complaint.id}
                onSuccess={() => {
                  setCurrentStatus('proof_submitted');
                  setShowProof(false);
                }}
              />
            </div>
          )}

          {/* Awaiting Verification Banner */}
          {currentStatus === 'proof_submitted' && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 shadow-xs">
              <span className="material-symbols-outlined text-2xl text-emerald-600 flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                task_alt
              </span>
              <div>
                <p className="text-sm font-bold text-emerald-900">Proof Submitted for Review</p>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  Job report and after-photo logged successfully. Municipal supervisors and automated AI verification are currently auditing the resolution.
                </p>
              </div>
            </div>
          )}

          {/* Timeline Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Work Lifecycle
            </span>
            <ComplaintTimeline
              currentStatus={currentStatus as ComplaintStatus}
              events={[
                { status: 'filed', timestamp: complaint.created_at },
                complaint.assigned_at ? { status: 'assigned', timestamp: complaint.assigned_at } : null,
              ].filter(Boolean) as { status: ComplaintStatus; timestamp: string }[]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
