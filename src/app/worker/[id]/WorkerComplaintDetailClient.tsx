'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProofSubmission } from '@/components/worker/ProofSubmission';
import { ComplaintTimeline } from '@/components/complaints/ComplaintTimeline';
import { MiniMap } from '@/components/ui/MiniMap';
import { useToast } from '@/components/ui/Toast';
import { getIssueLabel } from '@/constants/issue-types';
import type { Complaint } from '@/types/complaint';
import type { ComplaintSeverity, ComplaintStatus } from '@/types/complaint';

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
  const [isStarting, setIsStarting] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(complaint.status);

  async function handleStartWork() {
    setIsStarting(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/start-work`, { method: 'POST' });
      const data = await res.json() as { error?: string };
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
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#191c1e]">{getIssueLabel(complaint.issue_type)}</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant={currentStatus as ComplaintStatus} />
          <Badge variant={complaint.severity as ComplaintSeverity} />
          {complaint.ward_name && (
            <span className="text-xs text-[#737780] flex items-center gap-0.5">
              <span className="material-symbols-outlined text-xs">location_on</span>
              {complaint.ward_name}
            </span>
          )}
        </div>
      </div>

      {/* Photo */}
      {imageSignedUrl && (
        <div className="rounded-xl overflow-hidden border border-[#E2E8F0]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSignedUrl} alt="Complaint" className="w-full aspect-[4/3] object-cover" />
        </div>
      )}

      {/* Issue details */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-2">Description</p>
        <p className="text-sm text-[#191c1e] leading-relaxed">{complaint.description_en}</p>
        {complaint.ai_urgency_reason && (
          <p className="text-xs text-[#D97706] mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">warning</span>
            {complaint.ai_urgency_reason}
          </p>
        )}
      </div>

      {/* Location */}
      {complaint.address && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-1">Location</p>
            <p className="text-sm text-[#545f72]">{complaint.address}</p>
          </div>
          <MiniMap lat={complaint.latitude!} lng={complaint.longitude!} className="h-32" />
          <a
            href={`https://maps.google.com/?q=${complaint.latitude},${complaint.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline"
          >
            <span className="material-symbols-outlined text-xs">open_in_new</span>
            Open in Google Maps
          </a>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-4">Timeline</p>
        <ComplaintTimeline
          currentStatus={currentStatus as ComplaintStatus}
          events={[
            { status: 'filed', timestamp: complaint.created_at },
            complaint.assigned_at ? { status: 'assigned', timestamp: complaint.assigned_at } : null,
          ].filter(Boolean) as { status: ComplaintStatus; timestamp: string }[]}
        />
      </div>

      {/* CTA */}
      {currentStatus === 'assigned' && !showProof && (
        <Button onClick={handleStartWork} isLoading={isStarting} className="w-full">
          <span className="material-symbols-outlined text-base">play_arrow</span>
          Start Work
        </Button>
      )}

      {currentStatus === 'in_progress' && !showProof && (
        <Button onClick={() => setShowProof(true)} className="w-full">
          <span className="material-symbols-outlined text-base">photo_camera</span>
          Submit Proof of Completion
        </Button>
      )}

      {showProof && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-base font-semibold text-[#191c1e] mb-4">Submit Proof of Work</p>
          <ProofSubmission
            complaintId={complaint.id}
            onSuccess={() => {
              setCurrentStatus('proof_submitted');
              setShowProof(false);
            }}
          />
        </div>
      )}

      {currentStatus === 'proof_submitted' && (
        <div className="bg-[#d1fae5] border border-[#059669]/30 rounded-xl p-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#059669]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <p className="text-sm font-medium text-[#059669]">Proof submitted. Awaiting officer verification.</p>
        </div>
      )}
    </div>
  );
}
