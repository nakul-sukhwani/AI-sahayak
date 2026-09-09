'use client';

import { useState, useCallback } from 'react';
import { PhotoCapture } from '@/components/complaints/PhotoCapture';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { DAMAGE_TYPES, type DamageType } from '@/types/work-proof';
import type { ProcessedImage } from '@/lib/image';

interface ProofSubmissionProps {
  complaintId: string;
  onSuccess: () => void;
}

export function ProofSubmission({ complaintId, onSuccess }: ProofSubmissionProps) {
  const { toast } = useToast();
  const [proofImage, setProofImage] = useState<ProcessedImage | null>(null);
  const [proofPath, setProofPath] = useState<string | null>(null);
  const [damageType, setDamageType] = useState<DamageType>(DAMAGE_TYPES[0]);
  const [customDamage, setCustomDamage] = useState('');
  const [workerIssues, setWorkerIssues] = useState('');
  const [tools, setTools] = useState('');
  const [teamCount, setTeamCount] = useState<number>(1);
  const [capturedAt, setCapturedAt] = useState<string | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  async function handleProofCapture(result: ProcessedImage) {
    setProofImage(result);
    setCapturedAt(new Date().toISOString());
    acquireGPS();
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', result.file);
      const res = await fetch(`/api/upload-proof-image?complaintId=${complaintId}`, {
        method: 'POST',
        body: fd,
      });
      const data = (await res.json()) as { path?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setProofPath(data.path!);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
      setProofImage(null);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!proofPath) {
      toast('Please capture a proof photo first.', 'error');
      return;
    }
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
      // Step 1: Submit Work Proof
      const res = await fetch('/api/work-proof/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: complaintId,
          after_photo_path: proofPath,
          worker_notes: workerIssues.trim() || null,
        }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? 'Proof submission failed');

      // Step 2: Submit Job Report with GPS and Damage Classification
      const finalDamage = damageType === 'Other' ? customDamage.trim() : damageType;
      const reportRes = await fetch('/api/work-proof/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_proof_id: data.id,
          damage_type: finalDamage,
          worker_issues: workerIssues.trim() || null,
          tools_required: tools.split(',').map((t) => t.trim()).filter(Boolean),
          team_members_count: teamCount,
          captured_latitude: gps.lat,
          captured_longitude: gps.lng,
          captured_at: capturedAt ?? new Date().toISOString(),
        }),
      });

      const reportData = (await reportRes.json()) as { error?: string };
      if (!reportRes.ok) throw new Error(reportData.error ?? 'Job report submission failed');

      toast('Proof & Job Report submitted successfully! AI verification in progress.', 'success');
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Resolution Proof Photo (After Repair) *
        </label>
        <PhotoCapture
          onCapture={handleProofCapture}
          onError={(msg) => toast(msg, 'error')}
          disabled={isUploading || isSubmitting}
          label="Capture site completion photo"
          skipAiDetection={true}
        />
        {isUploading && (
          <p className="text-xs text-amber-700 mt-1 font-medium">Uploading proof photo to secure storage…</p>
        )}
        {proofImage && capturedAt && (
          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-mono pointer-events-none shadow-sm flex items-center gap-1">
            <span>🕒</span>
            <span>{new Date(capturedAt).toLocaleString('en-IN', { hour12: true })}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 bg-slate-50 text-xs">
        {gps ? (
          <span className="text-emerald-700 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            📍 Live On-Site GPS: {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
          </span>
        ) : (
          <span className="text-slate-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">location_searching</span>
            {gpsLoading ? 'Acquiring high-precision GPS…' : 'GPS location required for proof'}
          </span>
        )}
        <button
          type="button"
          onClick={acquireGPS}
          disabled={gpsLoading}
          className="text-[#b45309] font-bold hover:underline disabled:opacity-50 text-xs"
        >
          {gps ? 'Re-acquire GPS' : 'Acquire GPS'}
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="damage-type-select" className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Work Classification *
        </label>
        <select
          id="damage-type-select"
          value={damageType}
          onChange={(e) => setDamageType(e.target.value as DamageType)}
          required
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#b45309] focus:ring-2 focus:ring-[#b45309]/10 transition-all"
        >
          {DAMAGE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {damageType === 'Other' && (
        <Input
          id="custom-damage-input"
          label="Specify Damage Type *"
          placeholder="Describe work completed…"
          value={customDamage}
          onChange={(e) => setCustomDamage(e.target.value)}
          required
        />
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="worker-issues" className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Field Notes &amp; Site Observations
        </label>
        <textarea
          id="worker-issues"
          value={workerIssues}
          onChange={(e) => setWorkerIssues(e.target.value)}
          rows={2}
          placeholder="Detail materials used, traffic diversions, or follow-up needed…"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:border-[#b45309] focus:ring-2 focus:ring-[#b45309]/10 resize-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          id="tools-required"
          label="Equipment & Materials"
          placeholder="e.g. Cold mix asphalt, Tamper"
          value={tools}
          onChange={(e) => setTools(e.target.value)}
        />
        <Input
          id="team-count"
          type="number"
          min={1}
          max={50}
          label="Crew Members On Duty"
          value={teamCount}
          onChange={(e) => setTeamCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
        />
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting}
        disabled={!proofPath || isUploading}
        className="w-full mt-2 py-3 bg-[#b45309] hover:bg-[#92400e] text-white font-bold rounded-xl shadow-sm"
      >
        Submit Verified Proof &amp; Close Work Order
      </Button>
    </form>
  );
}
