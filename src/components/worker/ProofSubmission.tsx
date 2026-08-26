'use client';

import { useState } from 'react';
import { PhotoCapture } from '@/components/complaints/PhotoCapture';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { ProcessedImage } from '@/lib/image';

interface ProofSubmissionProps {
  complaintId: string;
  onSuccess: () => void;
}

export function ProofSubmission({ complaintId, onSuccess }: ProofSubmissionProps) {
  const { toast } = useToast();
  const [proofImage, setProofImage] = useState<ProcessedImage | null>(null);
  const [proofPath, setProofPath] = useState<string | null>(null);
  const [workerNotes, setWorkerNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleProofCapture(result: ProcessedImage) {
    setProofImage(result);
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', result.file);
      const res = await fetch(`/api/upload-proof-image?complaintId=${complaintId}`, {
        method: 'POST', body: fd,
      });
      const data = await res.json() as { path?: string; error?: string };
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
    if (!proofPath) { toast('Please capture a proof photo first.', 'error'); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/work-proof/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint_id: complaintId, after_photo_path: proofPath, worker_notes: workerNotes || null }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Submission failed');
      toast('Proof submitted successfully! AI verification in progress.', 'success');
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-[#191c1e] mb-2">After photo (proof of completion)</p>
        <PhotoCapture
          onCapture={handleProofCapture}
          onError={(msg) => toast(msg, 'error')}
          disabled={isUploading || isSubmitting}
          label="Capture completion photo"
        />
        {isUploading && (
          <p className="text-xs text-[#545f72] mt-1">Uploading photo…</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-[#191c1e] mb-1.5">
          Work notes (optional)
        </label>
        <textarea
          value={workerNotes}
          onChange={(e) => setWorkerNotes(e.target.value)}
          rows={3}
          placeholder="Describe what was done…"
          className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#191c1e] bg-white focus:outline-none focus:border-[#001e40] resize-none"
        />
      </div>
      <Button
        type="submit"
        isLoading={isSubmitting}
        disabled={!proofPath || isUploading}
        className="w-full"
      >
        Submit Proof of Completion
      </Button>
    </form>
  );
}
