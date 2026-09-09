'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoCapture } from './PhotoCapture';
import { AIResultCard } from './AIResultCard';
import { MapPicker } from './MapPicker';
import { VoiceInput } from './VoiceInput';
import { AuthoritySuggestion } from './AuthoritySuggestion';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import { ISSUE_TYPES, getIssueLabel } from '@/constants/issue-types';
import { SEVERITIES } from '@/constants/severities';
import { BANGALORE_WARDS } from '@/constants/authorities';
import type { ProcessedImage } from '@/lib/image';
import type { AIAnalysisResult } from '@/types/ai';
import type { Authority } from '@/types/authority';
import type { TranslationKey } from '@/lib/translations';

type Step = 'photo' | 'ai-result' | 'location' | 'details' | 'review';

interface FormState {
  // Photo
  processedImage: ProcessedImage | null;
  imagePath: string | null;
  // AI result
  aiResult: AIAnalysisResult | null;
  aiAccepted: boolean;
  // Location
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  wardName: string;
  // Details
  issueType: string;
  severity: string;
  descriptionEn: string;
  userNotes: string;
  isAnonymous: boolean;
  // Authority
  authority: Authority | null;
}

import type { SpatialClusterCheckResult } from '@/lib/spatial-clustering';

const INITIAL_FORM: FormState = {
  processedImage: null, imagePath: null,
  aiResult: null, aiAccepted: false,
  latitude: null, longitude: null, address: null, wardName: '',
  issueType: '', severity: 'medium', descriptionEn: '', userNotes: '',
  isAnonymous: false, authority: null,
};

const STEP_LABELS: Record<Step, TranslationKey> = {
  photo: 'step_photo',
  'ai-result': 'step_ai_review',
  location: 'step_location',
  details: 'step_details',
  review: 'step_submit',
};

const STEPS: Step[] = ['photo', 'ai-result', 'location', 'details', 'review'];

export function ComplaintForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [step, setStep] = useState<Step>('photo');
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [clusterInfo, setClusterInfo] = useState<SpatialClusterCheckResult | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // ── Duplicate Cluster Check ──────────────────────────────────────────
  const checkDuplicateAndProceed = async () => {
    if (!form.latitude || !form.longitude) {
      toast('Please pin a location on the map.', 'error');
      return;
    }

    setIsCheckingDuplicates(true);
    try {
      const res = await fetch('/api/complaints/cluster-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: form.latitude,
          longitude: form.longitude,
          issue_type: form.issueType || form.aiResult?.issue_type || 'general',
          radius_meters: 150,
        }),
      });
      const data = (await res.json()) as SpatialClusterCheckResult;
      if (data && data.is_potential_duplicate && data.master_ticket) {
        setClusterInfo(data);
      } else {
        setClusterInfo(null);
        setStep('details');
      }
    } catch {
      // Graceful fallback: continue without blocking
      setStep('details');
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // ── Photo step ──────────────────────────────────────────────────────
  const handlePhotoCapture = useCallback(async (result: ProcessedImage) => {
    setForm((f) => ({ ...f, processedImage: result }));

    // Upload immediately after capture
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', result.file);
      // Temp ID for path — real complaint ID assigned on submit
      const tempId = crypto.randomUUID();
      const res = await fetch(`/api/upload-image?complaintId=${tempId}`, {
        method: 'POST', body: fd,
      });
      const data = await res.json() as { path?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setForm((f) => ({ ...f, imagePath: data.path! }));

      // Auto-run AI analysis
      setIsAnalyzing(true);
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePath: data.path }),
      });
      const aiData = await analyzeRes.json() as AIAnalysisResult;
      setForm((f) => ({
        ...f,
        aiResult: aiData,
        issueType: aiData.issue_type,
        severity: aiData.severity,
        descriptionEn: aiData.description_en,
        latitude: result.exifCoordinates?.latitude ?? f.latitude,
        longitude: result.exifCoordinates?.longitude ?? f.longitude,
      }));
      setStep('ai-result');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  }, [toast]);

  // ── Submit ──────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!form.imagePath || !form.latitude || !form.longitude) {
      toast('Please complete all required steps.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: form.latitude,
          longitude: form.longitude,
          address: form.address,
          ward_name: form.wardName || null,
          issue_type: form.issueType,
          severity: form.severity,
          description_en: form.descriptionEn,
          description_hi: form.aiResult?.description_hi ?? null,
          user_notes: form.userNotes || null,
          ai_confidence: form.aiResult?.confidence_score ?? null,
          ai_tags: form.aiResult?.tags ?? null,
          ai_urgency_reason: form.aiResult?.urgency_reason ?? null,
          ai_suggested_department: form.aiResult?.suggested_department ?? null,
          is_anonymous: form.isAnonymous,
          visibility: 'private',
          suggested_authority_id: null,
          image_url: form.imagePath,
          voice_url: null,
        }),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Submission failed');
      toast('Complaint filed successfully!', 'success');
      router.push(`/dashboard/${data.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Submission failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentStepIndex = STEPS.indexOf(step);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Modern Bento Step Indicator Dock */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 p-2.5 sm:p-3 shadow-sm">
        <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {STEPS.map((s, i) => {
            const isDone = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const stepIcons: Record<Step, string> = {
              photo: 'photo_camera',
              'ai-result': 'auto_awesome',
              location: 'pin_drop',
              details: 'edit_document',
              review: 'task_alt',
            };
            const stepTitles: Record<Step, string> = {
              photo: '1. Photo',
              'ai-result': '2. AI Triage',
              location: '3. Location',
              details: '4. Details',
              review: '5. Review',
            };

            return (
              <div key={s} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-[50px] sm:min-w-0">
                <div
                  className={`flex items-center justify-center gap-1.5 w-full py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isCurrent
                      ? 'bg-[#002147] text-white shadow-sm ring-2 ring-[#002147]/20 font-bold'
                      : isDone
                      ? 'bg-[#e8f5e9] text-[#1b5e20] border border-[#a5d6a7]'
                      : 'bg-slate-50 text-slate-400 border border-slate-200/80'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: isDone || isCurrent ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {isDone ? 'check_circle' : stepIcons[s]}
                  </span>
                  <span className="hidden sm:inline whitespace-nowrap text-[11px] lg:text-xs">{stepTitles[s]}</span>
                  <span className="sm:hidden text-[11px]">{i + 1}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="hidden sm:inline-block text-slate-300 text-xs">›</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step 1: Photo ── */}
      {step === 'photo' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1b5e20]">
              Step 1 of 5 · Visual Evidence
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {t('capture_issue') || 'Capture the Problem'}
            </h2>
            <p className="text-sm text-[#545f72] mt-1">
              {t('capture_issue_desc') || 'Take a clear photograph of the civic problem. Our multi-modal AI will analyze it automatically.'}
            </p>
          </div>

          <PhotoCapture
            onCapture={handlePhotoCapture}
            onError={(msg) => toast(msg, 'error')}
            disabled={isUploading || isAnalyzing}
          />

          {(isUploading || isAnalyzing) && (
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
              <Spinner size="sm" />
              <span className="font-semibold">
                {isUploading ? 'Uploading high-res photograph…' : 'Multi-modal AI analyzing problem & severity…'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: AI Result ── */}
      {step === 'ai-result' && form.aiResult && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Step 2 of 5 · Automated Classification
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {t('review_ai_title') || 'Review AI Triage Findings'}
            </h2>
            <p className="text-sm text-[#545f72] mt-1">
              Our vision model has analyzed your image and suggested the issue category, severity, and jurisdiction.
            </p>
          </div>

          <AIResultCard
            result={form.aiResult}
            onAccept={() => { setForm((f) => ({ ...f, aiAccepted: true })); setStep('location'); }}
            onEdit={() => setStep('details')}
          />
        </div>
      )}

      {/* ── Step 3: Location ── */}
      {step === 'location' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Step 3 of 5 · Geo-Verification
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {t('pin_location_title') || 'Pin Complaint Location'}
            </h2>
            <p className="text-sm text-[#545f72] mt-1">
              Use live GPS or drag the marker to pin the exact location where field crews should be dispatched.
            </p>
          </div>

          <MapPicker
            initialLat={form.latitude ?? undefined}
            initialLng={form.longitude ?? undefined}
            onLocationChange={(lat, lng, addr) => setForm((f) => ({ ...f, latitude: lat, longitude: lng, address: addr }))}
          />

          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Municipal Ward (Optional)
            </label>
            <div className="relative">
              <select
                value={form.wardName}
                onChange={(e) => setForm((f) => ({ ...f, wardName: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/10 transition-all"
              >
                <option value="">Select Ward / Division…</option>
                {BANGALORE_WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          {/* ── Spatial Cluster / Duplicate Detection Banner ── */}
          {clusterInfo?.is_potential_duplicate && clusterInfo.master_ticket && (
            <div className="p-5 rounded-2xl bg-amber-50/90 border-2 border-amber-300 shadow-sm space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    radar
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900">
                      Spatial Duplicate Alert
                    </span>
                    <span className="text-xs font-bold text-amber-900">
                      Within {clusterInfo.master_ticket.distance_meters}m
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    An active complaint already exists for this spot!
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Ticket <span className="font-semibold text-slate-800">#{clusterInfo.master_ticket.id.slice(0, 8)}</span> ({clusterInfo.master_ticket.issue_type.toUpperCase()}) was lodged nearby. Consolidating reports avoids redundant tickets and speeds up municipal action.
                  </p>
                  <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200 text-xs text-slate-700 italic my-2 line-clamp-2">
                    &ldquo;{clusterInfo.master_ticket.description_en}&rdquo;
                  </div>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/${clusterInfo.master_ticket!.id}`)}
                      className="px-3.5 py-2 rounded-xl bg-[#002147] text-white text-xs font-bold shadow-xs hover:bg-[#002147]/90 flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      View & Track Existing Ticket
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClusterInfo(null);
                        setStep('details');
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Different Issue, Proceed Anyway →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('ai-result')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              {t('back_btn') || 'Back'}
            </button>
            <Button
              onClick={checkDuplicateAndProceed}
              disabled={!form.latitude || !form.longitude || isCheckingDuplicates}
              className="flex-1 py-2.5 text-sm font-semibold shadow-sm flex items-center justify-center gap-2"
            >
              {isCheckingDuplicates ? (
                <>
                  <Spinner size="sm" />
                  <span>Checking spatial duplicates…</span>
                </>
              ) : (
                <>
                  <span>{t('continue_btn') || 'Continue to Details'}</span>
                  <span>→</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Details ── */}
      {step === 'details' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1b5e20]">
              Step 4 of 5 · Civic Problem Details
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {t('confirm_details_title') || 'Confirm Issue Details'}
            </h2>
            <p className="text-sm text-[#545f72] mt-1">
              Verify the issue category, severity level, and add any specific directions for the repair team.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Issue Category *
              </label>

              {form.issueType && !showCategoryPicker ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/50 border-2 border-emerald-300 shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">
                          {getIssueLabel(form.issueType)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 border border-emerald-300">
                          {form.aiResult ? '✓ Verified by AI Vision' : 'Selected'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 truncate sm:whitespace-normal">
                        {form.aiResult
                          ? `Identified from your photo (${Math.round((form.aiResult.confidence_score ?? 0.95) * 100)}% match) · Assigned to ${form.aiResult.suggested_department || 'Roads & Infrastructure'}`
                          : 'Civic issue category selected'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCategoryPicker(true)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0 shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>Change</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Choose the appropriate category:</span>
                    {form.issueType && (
                      <button
                        type="button"
                        onClick={() => setShowCategoryPicker(false)}
                        className="text-xs text-emerald-700 hover:underline font-bold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                        <span>Keep {getIssueLabel(form.issueType)}</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={form.issueType}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, issueType: e.target.value }));
                      if (e.target.value) setShowCategoryPicker(false);
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/10 transition-all"
                  >
                    <option value="">Select issue category…</option>
                    {ISSUE_TYPES.map((tItem) => (
                      <option key={tItem.value} value={tItem.value}>{tItem.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Severity Level *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SEVERITIES.map((s) => {
                  const isSelected = form.severity === s.value;
                  const severityBadges: Record<string, { bg: string; text: string; border: string }> = {
                    low: { bg: '#d1fae5', text: '#059669', border: '#a7f3d0' },
                    medium: { bg: '#dbeafe', text: '#2563EB', border: '#bfdbfe' },
                    high: { bg: '#fef3c7', text: '#D97706', border: '#fde68a' },
                    critical: { bg: '#fee2e2', text: '#DC2626', border: '#fecaca' },
                  };
                  const badge = severityBadges[s.value] || severityBadges.medium;

                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, severity: s.value }))}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        isSelected
                          ? 'shadow-sm ring-2 ring-slate-800 scale-[1.02]'
                          : 'opacity-70 hover:opacity-100 hover:scale-[1.01]'
                      }`}
                      style={{
                        background: badge.bg,
                        color: badge.text,
                        borderColor: isSelected ? badge.text : badge.border,
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Description *
              </label>
              <textarea
                value={form.descriptionEn}
                onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
                rows={3}
                placeholder="Describe the issue in your own words (e.g. deep pothole near traffic junction causing traffic slowdown)…"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/10 resize-none transition-all"
              />
              <div className="mt-2 flex items-center justify-between">
                <VoiceInput onTranscript={(v) => setForm((f) => ({ ...f, descriptionEn: f.descriptionEn + ' ' + v }))} />
                <span className="text-[11px] text-slate-400">Supports Hindi &amp; English dictation</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Landmarks / Additional Notes (Optional)
              </label>
              <textarea
                value={form.userNotes}
                onChange={(e) => setForm((f) => ({ ...f, userNotes: e.target.value }))}
                rows={2}
                placeholder="Nearby landmarks, shop names, or best time to access the site…"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/10 resize-none transition-all"
              />
            </div>

            {/* Anonymous Filing Bento Pill */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-600">
                  <span className="material-symbols-outlined text-lg">visibility_off</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">File Anonymously</p>
                  <p className="text-[11px] text-slate-500">Your name and personal info will not appear on public feed</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={form.isAnonymous}
                  onChange={(e) => setForm((f) => ({ ...f, isAnonymous: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#002147]"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('location')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              {t('back_btn') || 'Back'}
            </button>
            <Button
              onClick={() => setStep('review')}
              disabled={!form.issueType || !form.descriptionEn}
              className="flex-1 py-2.5 text-sm font-semibold shadow-sm"
            >
              {t('continue_to_review') || 'Proceed to Review'} →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 5: Review & Submit ── */}
      {step === 'review' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Step 5 of 5 · Official Lodgement
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {t('review_submit_title') || 'Final Review & Lodgement'}
            </h2>
            <p className="text-sm text-[#545f72] mt-1">
              Confirm the civic docket details before official dispatch into municipal SLA tracking.
            </p>
          </div>

          {/* Civic Docket Bento Card */}
          <div className="rounded-2xl border border-slate-200/90 overflow-hidden bg-slate-50/50">
            {form.processedImage && (
              <div className="relative aspect-[16/9] w-full bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.processedImage.dataUrl}
                  alt="Complaint Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Evidence Photo Attached</span>
                </div>
              </div>
            )}

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#002147] text-white">
                  {form.issueType.replace(/_/g, ' ').toUpperCase()}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                  Severity: {form.severity}
                </span>
                {form.wardName && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                    📍 {form.wardName}
                  </span>
                )}
                {form.isAnonymous && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                    🛡️ Anonymous
                  </span>
                )}
              </div>

              <div className="border-t border-slate-200/80 pt-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Description
                </p>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {form.descriptionEn}
                </p>
              </div>

              {form.address && (
                <div className="border-t border-slate-200/80 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Geo-coordinates &amp; Address
                  </p>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-blue-600">location_on</span>
                    {form.address}
                  </p>
                </div>
              )}
            </div>
          </div>

          {form.authority && (
            <AuthoritySuggestion authority={form.authority} aiDepartment={form.aiResult?.suggested_department} />
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              className="w-full py-3.5 text-sm font-bold shadow-md bg-[#002147] hover:bg-[#001833] text-white rounded-xl"
            >
              <span className="material-symbols-outlined text-base mr-1.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                send
              </span>
              {t('submit_complaint') || 'Officially Lodge Complaint'}
            </Button>
            <button
              type="button"
              onClick={() => setStep('details')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 text-center transition-colors"
            >
              ← {t('back_to_edit') || 'Back to edit details'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
