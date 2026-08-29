'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { BeforeAfterView } from './BeforeAfterView';
import { getIssueLabel } from '@/constants/issue-types';
import { MiniMap } from '@/components/ui/MiniMap';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKey } from '@/lib/translations';

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
    created_at?: string | null;
  } | null;
  users_profile: {
    full_name: string | null;
    display_name: string | null;
  } | null;
  worker_job_reports?: {
    damage_type?: string | null;
    worker_issues?: string | null;
    tools_required?: string[] | null;
    team_members_count?: number | null;
    captured_latitude?: number | null;
    captured_longitude?: number | null;
    captured_at?: string | null;
  }[] | {
    damage_type?: string | null;
    worker_issues?: string | null;
    tools_required?: string[] | null;
    team_members_count?: number | null;
    captured_latitude?: number | null;
    captured_longitude?: number | null;
    captured_at?: string | null;
  } | null;
  beforeSignedUrl: string | null;
  afterSignedUrl: string | null;
}

interface VerificationQueueProps {
  initialProofs: WorkProofWithDetails[];
}

export function VerificationQueue({ initialProofs }: VerificationQueueProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
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
      if (!res.ok) throw new Error(data.error ?? 'Failed to update verification');

      toast(status === 'approved' ? 'Proof approved successfully.' : 'Proof rejected.', status === 'approved' ? 'success' : 'info');
      setProofs(prev => prev.filter(p => p.id !== selectedProof.id));
      setSelectedProof(null);
      setRejectionReason('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedReport = selectedProof
    ? Array.isArray(selectedProof.worker_job_reports)
      ? selectedProof.worker_job_reports[0]
      : selectedProof.worker_job_reports
    : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#191c1e] tracking-tight">
          {t('verify_proof')}
        </h1>
        <p className="text-sm text-[#545f72] mt-1">
          {t('verify_resolution')}
        </p>
      </div>

      {proofs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-2xl p-6">
          <span className="material-symbols-outlined text-4xl text-[#059669] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
            task_alt
          </span>
          <p className="text-base font-semibold text-[#191c1e]">{t('all_caught_up')}</p>
          <p className="text-sm text-[#545f72] mt-1">{t('no_pending_proofs')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proofs.map((proof) => {
            const issueName = t(proof.complaints?.issue_type as TranslationKey) || getIssueLabel(proof.complaints?.issue_type ?? '');
            return (
              <div key={proof.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col justify-between hover:border-[#001e40]/30 transition-all shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#001e40] bg-[#f2f4f6] px-2.5 py-1 rounded-md">
                      {issueName}
                    </span>
                    <span className="text-xs text-[#737780]">
                      {new Date(proof.submitted_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-[#737780]">{t('before')}</span>
                      {proof.beforeSignedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={proof.beforeSignedUrl} alt="Before" className="w-full aspect-square object-cover rounded-lg border border-[#E2E8F0]" />
                      ) : (
                        <div className="w-full aspect-square bg-[#f2f4f6] rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#c3c6d1]">
                          <span className="material-symbols-outlined text-xl">image_not_supported</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-[#737780]">{t('after')}</span>
                      {proof.afterSignedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={proof.afterSignedUrl} alt="After" className="w-full aspect-square object-cover rounded-lg border border-[#E2E8F0]" />
                      ) : (
                        <div className="w-full aspect-square bg-[#f2f4f6] rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#c3c6d1]">
                          <span className="material-symbols-outlined text-xl">image_not_supported</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {proof.complaints?.description_en && (
                    <p className="text-xs text-[#545f72] line-clamp-2">{proof.complaints.description_en}</p>
                  )}

                  <div className="text-xs text-[#737780] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">person</span>
                    {t('worker')}: <span className="font-medium text-[#191c1e]">{proof.users_profile?.display_name || proof.users_profile?.full_name || 'Worker'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                  {proof.ai_verified !== null && (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${proof.ai_verified ? 'bg-[#d1fae5] text-[#059669]' : 'bg-[#fee2e2] text-[#DC2626]'}`}>
                      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      {proof.ai_verified ? t('ai_verified') : t('ai_flagged')}
                    </span>
                  )}
                  <Button size="sm" onClick={() => setSelectedProof(proof)} className="ml-auto">
                    {t('review')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001e40]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#191c1e]">{t('verify_resolution')}</h2>
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
                damageType={selectedReport?.damage_type}
                workerIssues={selectedReport?.worker_issues}
                toolsRequired={selectedReport?.tools_required}
                capturedLatitude={selectedReport?.captured_latitude ? Number(selectedReport.captured_latitude) : null}
                capturedLongitude={selectedReport?.captured_longitude ? Number(selectedReport.captured_longitude) : null}
                capturedAt={selectedReport?.captured_at}
                complaintLatitude={selectedProof.complaints?.latitude}
                complaintLongitude={selectedProof.complaints?.longitude}
                complaintCreatedAt={selectedProof.complaints?.created_at}
              />

              {selectedProof.complaints?.latitude && selectedProof.complaints?.longitude && (
                <div className="bg-[#f7f9fb] p-4 rounded-xl border border-[#E2E8F0]">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-2">{t('location_label')}</p>
                  <MiniMap lat={selectedProof.complaints.latitude} lng={selectedProof.complaints.longitude} className="h-32 mb-2" />
                  {selectedProof.complaints.address && (
                    <p className="text-sm text-[#191c1e]">{selectedProof.complaints.address}</p>
                  )}
                </div>
              )}

              <div className="bg-[#f7f9fb] p-4 rounded-xl border border-[#E2E8F0]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-2">{t('worker_notes')}</p>
                <p className="text-sm text-[#191c1e] italic">{selectedProof.worker_notes || t('no_notes_provided')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#191c1e] mb-1.5">{t('rejection_reason_label')}</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                  placeholder={t('rejection_reason_placeholder')}
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#191c1e] bg-white focus:outline-none focus:border-[#DC2626] resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#E2E8F0] flex items-center gap-3 bg-[#f7f9fb]">
              <Button onClick={() => handleVerify('rejected')} isLoading={isSubmitting} disabled={isSubmitting || !rejectionReason.trim()} className="flex-1 bg-white border border-[#DC2626] text-[#DC2626] hover:bg-[#fee2e2]">
                {t('reject_proof')}
              </Button>
              <Button onClick={() => handleVerify('approved')} isLoading={isSubmitting} disabled={isSubmitting} className="flex-1 bg-[#059669] hover:bg-[#047857]">
                {t('approve_close_issue')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
