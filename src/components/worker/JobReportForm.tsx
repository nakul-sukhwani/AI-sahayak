'use client';

import { useState, useCallback } from 'react';
import { PhotoCapture } from '@/components/complaints/PhotoCapture';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import { DAMAGE_TYPES, type DamageType } from '@/types/work-proof';
import type { ProcessedImage } from '@/lib/image';

interface JobReportFormProps {
  workProofId: string;
  onSuccess?: () => void;
}

export function JobReportForm({ workProofId, onSuccess }: JobReportFormProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [damageType, setDamageType] = useState<DamageType>(DAMAGE_TYPES[0]);
  const [customDamage, setCustomDamage] = useState('');
  const [workerIssues, setWorkerIssues] = useState('');
  const [tools, setTools] = useState('');
  const [teamCount, setTeamCount] = useState<number>(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const acquireGPS = useCallback(() => {
    if (!navigator.geolocation) {
      toast('Geolocation not supported by your browser', 'error');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        toast('GPS access denied or unavailable', 'error');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [toast]);

  function handlePhotoCapture(result: ProcessedImage) {
    setPreviewUrl(result.dataUrl);
    setCapturedAt(new Date().toISOString());
    acquireGPS();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (damageType === 'Other' && !customDamage.trim()) {
      toast('Please specify damage classification.', 'error');
      return;
    }
    if (!gps) {
      toast('Live GPS location required. Please enable location.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalDamage = damageType === 'Other' ? customDamage.trim() : damageType;
      const res = await fetch('/api/work-proof/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_proof_id: workProofId,
          damage_type: finalDamage,
          worker_issues: workerIssues.trim() || null,
          tools_required: tools.split(',').map((item) => item.trim()).filter(Boolean),
          team_members_count: teamCount,
          captured_latitude: gps.lat,
          captured_longitude: gps.lng,
          captured_at: capturedAt ?? new Date().toISOString(),
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Submission failed');

      toast('Job report & GPS proof submitted!', 'success');
      onSuccess?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="relative">
        <label className="block text-sm font-medium text-[#191c1e] mb-1.5">{t('work_proof_photo')}</label>
        <PhotoCapture onCapture={handlePhotoCapture} onError={(msg) => toast(msg, 'error')} label={t('capture_completion_photo')} />
        {previewUrl && capturedAt && (
          <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded text-[11px] font-mono pointer-events-none">
            🕒 {new Date(capturedAt).toLocaleString('en-IN', { hour12: true })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border bg-[#f7f9fb] text-xs">
        {gps ? (
          <span className="text-[#059669] font-medium">📍 {t('live_gps_acquired')} ({gps.lat.toFixed(4)}, {gps.lng.toFixed(4)})</span>
        ) : (
          <span className="text-[#545f72]">📍 {gpsLoading ? t('acquiring_gps') : t('gps_not_acquired')}</span>
        )}
        <button type="button" onClick={acquireGPS} disabled={gpsLoading} className="text-[#001e40] font-semibold hover:underline disabled:opacity-50">
          {gps ? t('refresh_gps') : t('retry_gps')}
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="damage-type-select" className="text-sm font-medium text-[#191c1e]">{t('damage_classification')} *</label>
        <select id="damage-type-select" value={damageType} onChange={(e) => setDamageType(e.target.value as DamageType)} required className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#191c1e] focus:outline-none focus:border-[#001e40]">
          {DAMAGE_TYPES.map((type) => (<option key={type} value={type}>{type}</option>))}
        </select>
      </div>

      {damageType === 'Other' && (
        <Input id="custom-damage-input" label={`${t('specify_damage_type')} *`} placeholder={t('describe_damage_placeholder')} value={customDamage} onChange={(e) => setCustomDamage(e.target.value)} required />
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="worker-issues" className="text-sm font-medium text-[#191c1e]">{t('onsite_issues_observations')}</label>
        <textarea id="worker-issues" value={workerIssues} onChange={(e) => setWorkerIssues(e.target.value)} rows={2} placeholder={t('describe_damage_placeholder')} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#191c1e] bg-white focus:outline-none focus:border-[#001e40] resize-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input id="tools-required" label={t('tools_used')} placeholder="e.g. Shovel, Asphalt" value={tools} onChange={(e) => setTools(e.target.value)} />
        <Input id="team-count" type="number" min={1} max={50} label={t('team_members_present')} value={teamCount} onChange={(e) => setTeamCount(Math.max(1, parseInt(e.target.value, 10) || 1))} />
      </div>

      <Button type="submit" isLoading={isSubmitting} className="w-full mt-1">{t('submit_job_report_proof')}</Button>
    </form>
  );
}
