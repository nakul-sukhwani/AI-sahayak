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
import { ISSUE_TYPES } from '@/constants/issue-types';
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
    <div className="max-w-xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={[
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
              i < currentStepIndex ? 'bg-[#059669] text-white' :
              i === currentStepIndex ? 'bg-[#001e40] text-white' :
              'bg-[#e0e3e5] text-[#737780]',
            ].join(' ')}>
              {i < currentStepIndex
                ? <span className="material-symbols-outlined text-sm">check</span>
                : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={['flex-1 h-0.5 mx-1', i < currentStepIndex ? 'bg-[#059669]' : 'bg-[#e0e3e5]'].join(' ')} />
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-[#545f72] mb-4">
        {t('step_prefix')} {currentStepIndex + 1} {t('of')} {STEPS.length}: <span className="font-medium text-[#191c1e]">{t(STEP_LABELS[step])}</span>
      </p>

      {/* ── Step: Photo ── */}
      {step === 'photo' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-[#191c1e]">{t('capture_issue')}</h2>
          <p className="text-sm text-[#545f72]">{t('capture_issue_desc')}</p>
          <PhotoCapture
            onCapture={handlePhotoCapture}
            onError={(msg) => toast(msg, 'error')}
            disabled={isUploading || isAnalyzing}
          />
          {(isUploading || isAnalyzing) && (
            <div className="flex items-center gap-2 text-sm text-[#545f72]">
              <Spinner size="sm" />
              {isUploading ? 'Uploading photo…' : 'AI analyzing image…'}
            </div>
          )}
        </div>
      )}

      {/* ── Step: AI Result ── */}
      {step === 'ai-result' && form.aiResult && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-[#191c1e]">{t('review_ai_title')}</h2>
          <AIResultCard
            result={form.aiResult}
            onAccept={() => { setForm((f) => ({ ...f, aiAccepted: true })); setStep('location'); }}
            onEdit={() => setStep('details')}
          />
        </div>
      )}

      {/* ── Step: Location ── */}
      {step === 'location' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-[#191c1e]">{t('pin_location_title')}</h2>
          <MapPicker
            onLocationChange={(lat, lng, addr) => setForm((f) => ({ ...f, latitude: lat, longitude: lng, address: addr }))}
          />
          <div>
            <label className="block text-sm font-medium text-[#191c1e] mb-1.5">Ward (optional)</label>
            <select
              value={form.wardName}
              onChange={(e) => setForm((f) => ({ ...f, wardName: e.target.value }))}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#191c1e] bg-white focus:outline-none focus:border-[#001e40]"
            >
              <option value="">Select ward…</option>
              {BANGALORE_WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <Button
            onClick={() => setStep('details')}
            disabled={!form.latitude || !form.longitude}
          >
            {t('continue_btn')}
          </Button>
        </div>
      )}

      {/* ── Step: Details ── */}
      {step === 'details' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-[#191c1e]">{t('confirm_details_title')}</h2>
          <div>
            <label className="block text-sm font-medium text-[#191c1e] mb-1.5">Issue Type</label>
            <select
              value={form.issueType}
              onChange={(e) => setForm((f) => ({ ...f, issueType: e.target.value }))}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#191c1e] bg-white focus:outline-none focus:border-[#001e40]"
            >
              <option value="">Select issue type…</option>
              {ISSUE_TYPES.map((tItem) => <option key={tItem.value} value={tItem.value}>{tItem.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#191c1e] mb-1.5">Severity</label>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, severity: s.value }))}
                  className={[
                    'px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-colors',
                    form.severity === s.value
                      ? 'border-[#001e40] bg-[#001e40] text-white'
                      : 'border-[#E2E8F0] text-[#191c1e] hover:border-[#001e40]',
                  ].join(' ')}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#191c1e] mb-1.5">Description</label>
            <textarea
              value={form.descriptionEn}
              onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
              rows={3}
              placeholder="Describe the issue in your own words…"
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#191c1e] bg-white focus:outline-none focus:border-[#001e40] resize-none"
            />
            <div className="mt-2">
              <VoiceInput onTranscript={(v) => setForm((f) => ({ ...f, descriptionEn: f.descriptionEn + ' ' + v }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#191c1e] mb-1.5">Additional notes (optional)</label>
            <textarea
              value={form.userNotes}
              onChange={(e) => setForm((f) => ({ ...f, userNotes: e.target.value }))}
              rows={2}
              placeholder="Any other context for the municipal team…"
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#191c1e] bg-white focus:outline-none focus:border-[#001e40] resize-none"
            />
          </div>
          {/* Anonymous toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.isAnonymous}
                onChange={(e) => setForm((f) => ({ ...f, isAnonymous: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#E2E8F0] rounded-full peer-checked:bg-[#001e40] transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#191c1e]">File anonymously</p>
              <p className="text-xs text-[#545f72]">Your name won't appear in the complaint</p>
            </div>
          </label>
          <Button onClick={() => setStep('review')} disabled={!form.issueType || !form.descriptionEn}>
            {t('continue_to_review')}
          </Button>
        </div>
      )}

      {/* ── Step: Review ── */}
      {step === 'review' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-[#191c1e]">{t('review_submit_title')}</h2>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3 text-sm">
            {form.processedImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.processedImage.dataUrl} alt="Complaint" className="w-full aspect-[4/3] object-cover rounded-lg" />
            )}
            <div className="grid grid-cols-2 gap-2">
              <div><p className="text-xs text-[#545f72] uppercase tracking-wide">Issue</p><p className="font-medium capitalize">{form.issueType.replace(/_/g, ' ')}</p></div>
              <div><p className="text-xs text-[#545f72] uppercase tracking-wide">Severity</p><p className="font-medium capitalize">{form.severity}</p></div>
              {form.wardName && <div><p className="text-xs text-[#545f72] uppercase tracking-wide">Ward</p><p className="font-medium">{form.wardName}</p></div>}
              <div><p className="text-xs text-[#545f72] uppercase tracking-wide">Anonymous</p><p className="font-medium">{form.isAnonymous ? 'Yes' : 'No'}</p></div>
            </div>
            <div><p className="text-xs text-[#545f72] uppercase tracking-wide mb-1">Description</p><p className="leading-relaxed text-[#191c1e]">{form.descriptionEn}</p></div>
            {form.address && <div><p className="text-xs text-[#545f72] uppercase tracking-wide mb-1">Location</p><p className="text-[#545f72] text-xs">{form.address}</p></div>}
          </div>
          {form.authority && <AuthoritySuggestion authority={form.authority} aiDepartment={form.aiResult?.suggested_department} />}
          <Button onClick={handleSubmit} isLoading={isSubmitting} className="w-full">
            {t('submit_complaint')}
          </Button>
          <button type="button" onClick={() => setStep('details')} className="text-sm text-[#545f72] hover:text-[#191c1e] text-center transition-colors">
            ← {t('back_to_edit')}
          </button>
        </div>
      )}

      {/* Back nav (except photo + ai-result which have their own flow) */}
      {step === 'location' && (
        <button type="button" onClick={() => setStep('ai-result')} className="mt-3 text-sm text-[#545f72] hover:text-[#191c1e] transition-colors">
          ← {t('back_btn')}
        </button>
      )}
    </div>
  );
}
