'use client';

import { useRef, useState, useCallback } from 'react';
import { processImage, type ProcessedImage } from '@/lib/image';
import { Spinner } from '@/components/ui/spinner';

type ValidationStatus = 'idle' | 'validating' | 'approved' | 'rejected' | 'flagged' | 'error';

interface PhotoCaptureProps {
  onCapture: (result: ProcessedImage) => void;
  onError: (message: string) => void;
  preview?: string | null;     // existing preview dataUrl (e.g. on edit)
  label?: string;
  disabled?: boolean;
  /** Set to true to skip AI-generated image detection (e.g. worker proof uploads) */
  skipAiDetection?: boolean;
}

export function PhotoCapture({
  onCapture,
  onError,
  preview = null,
  label = 'Capture Photo',
  disabled = false,
  skipAiDetection = false,
}: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(preview);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setValidationStatus('idle');
      setValidationMessage(null);
      try {
        const result = await processImage(file);
        setLocalPreview(result.dataUrl);

        if (skipAiDetection) {
          onCapture(result);
          return;
        }

        // ── AI-generated image detection ────────────────────────────────
        setValidationStatus('validating');
        const base64 = result.dataUrl.split(',')[1];

        const res = await fetch('/api/complaints/validate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: result.file.type }),
        });

        const data = await res.json() as {
          status: string;
          classification?: string;
          confidence?: number;
          message?: string;
          reason?: string;
        };

        if (data.status === 'REJECTED') {
          setValidationStatus('rejected');
          setLocalPreview(null);
          setValidationMessage(data.reason ?? data.message ?? 'AI-generated image detected.');
          return;
        }

        if (data.status === 'FLAGGED') {
          setValidationStatus('flagged');
          setValidationMessage(data.message ?? 'Image quality unclear. Try re-uploading a clearer photo.');
          // Still allow capture on flagged — user is warned
          onCapture(result);
          return;
        }

        // APPROVED or fail-open
        setValidationStatus('approved');
        onCapture(result);

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to process image.';
        onError(msg);
        setValidationStatus('error');
      } finally {
        setIsProcessing(false);
      }
    },
    [onCapture, onError, skipAiDetection]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  }

  function openCamera() {
    if (validationStatus === 'rejected') {
      // Reset and allow re-upload
      setValidationStatus('idle');
      setValidationMessage(null);
      setLocalPreview(null);
    }
    fileInputRef.current?.click();
  }

  const isBusy = isProcessing || validationStatus === 'validating';

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Hidden file input — accepts camera + gallery on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"   // rear camera on mobile
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload complaint photo"
        disabled={disabled || isBusy}
      />

      {/* Rejection banner */}
      {validationStatus === 'rejected' && (
        <div className="bg-[#fef2f2] border border-[#DC2626]/30 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-[#DC2626] text-xl flex-shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              policy
            </span>
            <p className="text-sm font-semibold text-[#DC2626]">AI-Generated Image Detected</p>
          </div>
          <p className="text-xs text-[#991b1b] leading-relaxed">
            This image appears to be created by an AI tool (DALL-E, Midjourney, etc.).
            Please upload a real photograph of the civic issue taken from your phone or camera.
          </p>
          {validationMessage && (
            <p className="text-xs text-[#737780] italic">Reason: {validationMessage}</p>
          )}
          <button
            type="button"
            onClick={openCamera}
            disabled={disabled}
            className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:underline"
          >
            <span className="material-symbols-outlined text-sm">photo_camera</span>
            Try another photo
          </button>
        </div>
      )}

      {/* Flagged banner (warning but allowed) */}
      {validationStatus === 'flagged' && localPreview && (
        <div className="bg-[#fffbeb] border border-[#D97706]/30 rounded-xl p-3 flex items-start gap-2">
          <span
            className="material-symbols-outlined text-[#D97706] text-lg flex-shrink-0 mt-0.5"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            warning
          </span>
          <p className="text-xs text-[#92400e] leading-relaxed">
            {validationMessage}
          </p>
        </div>
      )}

      {/* Approved badge (brief confirmation) */}
      {validationStatus === 'approved' && localPreview && (
        <div className="flex items-center gap-1.5 text-xs text-[#059669] font-medium">
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified
          </span>
          Photo verified as authentic
        </div>
      )}

      {validationStatus !== 'rejected' && (
        <>
          {localPreview ? (
            /* Preview state */
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-[#E2E8F0]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={localPreview}
                alt="Captured complaint photo"
                className="w-full h-full object-cover"
              />

              {/* Retake overlay */}
              <button
                type="button"
                onClick={openCamera}
                disabled={disabled || isBusy}
                className="absolute bottom-3 right-3 flex items-center gap-1.5
                           bg-black/60 text-white text-xs font-medium px-3 py-2 rounded-lg
                           hover:bg-black/80 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                Retake
              </button>

              {/* Processing / validating overlay */}
              {isBusy && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
                  <Spinner size="md" />
                  <p className="text-sm text-[#545f72]">
                    {isProcessing ? 'Processing image…' : 'Verifying authenticity…'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Empty capture zone */
            <button
              type="button"
              onClick={openCamera}
              disabled={disabled || isBusy}
              className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-3
                         border-2 border-dashed border-[#c3c6d1] rounded-xl
                         bg-[#f7f9fb] hover:border-[#001e40] hover:bg-white
                         transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBusy ? (
                <>
                  <Spinner size="md" />
                  <p className="text-sm text-[#545f72]">
                    {isProcessing ? 'Processing image…' : 'Verifying authenticity…'}
                  </p>
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined text-4xl text-[#737780] group-hover:text-[#001e40] transition-colors"
                    style={{ fontVariationSettings: "'FILL' 0" }}
                  >
                    photo_camera
                  </span>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#191c1e]">{label}</p>
                    <p className="text-xs text-[#545f72] mt-0.5">JPEG, PNG or WebP · max 500KB · real photos only</p>
                  </div>
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
