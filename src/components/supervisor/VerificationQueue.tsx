'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { BeforeAfterView } from './BeforeAfterView';
import { getIssueLabel } from '@/constants/issue-types';
import { MiniMap } from '@/components/ui/MiniMap';

export interface WorkProofWithDetails {
  id: string;
  complaint_id: string;
  before_photo_url: string | null;
  after_photo_url: string;
  ai_verified: boolean | null;
  ai_confidence: number | null;
  ai_observation: string | null;
  worker_notes: string | null;
  submitted_at: string;
  complaints: {
    issue_type: string;
    description_en: string;
    ward_name: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  users_profile: {
    full_name: string | null;
    display_name: string | null;
  } | null;
  // Pre-signed URLs mapped on server
  beforeSignedUrl: string | null;
  afterSignedUrl: string | null;
}

interface VerificationQueueProps {
  initialProofs: WorkProofWithDetails[];
}

export function VerificationQueue({ initialProofs }: VerificationQueueProps) {
  const { toast } = useToast();
  const [proofs, setProofs] = useState<WorkProofWithDetails[]>(initialProofs);
  const [selectedProof, setSelectedProof] = useState<WorkProofWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  async function handleVerify(status: 'approved' | 'rejected') {
    if (!selectedProof) return;
    if (status === 'rejected' && !rejectionReason.trim()) {
      toast('Please provide a rejection reason.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/work-proof/${selectedProof.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejection_reason: status === 'rejected' ? rejectionReason : null }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Verification failed');
      
      toast(`Proof ${status === 'approved' ? 'approved' : 'rejected'} successfully`, 'success');
      setProofs(prev => prev.filter(p => p.id !== selectedProof.id));
      setSelectedProof(null);
      setRejectionReason('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Verification failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (proofs.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-5xl text-[#c3c6d1]">verified_user</span>
        <p className="text-base font-medium text-[#191c1e] mt-3">Queue empty</p>
        <p className="text-sm text-[#545f72] mt-1">No proofs pending verification.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proofs.map(p => {
          const workerName = p.users_profile?.full_name ?? p.users_profile?.display_name ?? 'Unknown Worker';
          return (
            <div key={p.id} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.afterSignedUrl!} alt="After" className="w-full h-full object-cover" />
                {p.ai_verified !== null && (
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide backdrop-blur-md ${p.ai_verified ? 'bg-[#059669]/90 text-white' : 'bg-[#DC2626]/90 text-white'}`}>
                    AI: {p.ai_verified ? 'PASS' : 'FAIL'}
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-[#191c1e] truncate">{getIssueLabel(p.complaints?.issue_type ?? 'other')}</p>
                <p className="text-xs text-[#545f72] mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">person</span> {workerName}
                </p>
                <div className="mt-4">
                  <Button size="sm" className="w-full" onClick={() => setSelectedProof(p)}>Review Proof</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001e40]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#191c1e]">Verify Resolution</h2>
              <button onClick={() => { setSelectedProof(null); setRejectionReason(''); }} className="p-1 text-[#737780] hover:text-[#191c1e] rounded-md transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex flex-col gap-6">
              <BeforeAfterView
                beforeUrl={selectedProof.beforeSignedUrl}
                afterUrl={selectedProof.afterSignedUrl}
                aiVerified={selectedProof.ai_verified}
                aiConfidence={selectedProof.ai_confidence}
                aiObservation={selectedProof.ai_observation}
              />

              {selectedProof.complaints?.latitude && selectedProof.complaints?.longitude && (
                <div className="bg-[#f7f9fb] p-4 rounded-xl border border-[#E2E8F0]">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-2">Location</p>
                  <MiniMap lat={selectedProof.complaints.latitude} lng={selectedProof.complaints.longitude} className="h-32 mb-2" />
                  {selectedProof.complaints.address && (
                    <p className="text-sm text-[#191c1e]">{selectedProof.complaints.address}</p>
                  )}
                </div>
              )}

              <div className="bg-[#f7f9fb] p-4 rounded-xl border border-[#E2E8F0]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-2">Worker Notes</p>
                <p className="text-sm text-[#191c1e] italic">{selectedProof.worker_notes || 'No notes provided by the worker.'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#191c1e] mb-1.5">Rejection Reason (only if rejecting)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                  placeholder="Explain why the proof is rejected..."
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#191c1e] bg-white focus:outline-none focus:border-[#DC2626] resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#E2E8F0] flex items-center gap-3 bg-[#f7f9fb]">
              <Button onClick={() => handleVerify('rejected')} isLoading={isSubmitting} disabled={isSubmitting || !rejectionReason.trim()} className="flex-1 bg-white border border-[#DC2626] text-[#DC2626] hover:bg-[#fee2e2]">
                Reject Proof
              </Button>
              <Button onClick={() => handleVerify('approved')} isLoading={isSubmitting} disabled={isSubmitting} className="flex-1 bg-[#059669] hover:bg-[#047857]">
                Approve & Close Issue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
