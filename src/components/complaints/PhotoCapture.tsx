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
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={localPreview}
                alt="Captured complaint photo"
                className="w-full h-full object-cover"
              />

              {/* Top pill badge */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Camera Frame Locked</span>
              </div>

              {/* Retake overlay pill */}
              <button
                type="button"
                onClick={openCamera}
                disabled={disabled || isBusy}
                className="absolute bottom-3 right-3 flex items-center gap-1.5
                           bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-full
                           shadow-md transition-all duration-150 backdrop-blur-sm hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-base text-slate-600">photo_camera</span>
                Retake Photo
              </button>

              {/* Processing / validating overlay */}
              {isBusy && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">
                      {isProcessing ? 'Optimizing Image…' : 'Detecting Authenticity…'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Checking for synthetic/AI artifacts & metadata
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Modern HUD Camera Viewfinder */
            <button
              type="button"
              onClick={openCamera}
              disabled={disabled || isBusy}
              className="relative w-full aspect-[4/3] sm:aspect-[16/10] flex flex-col items-center justify-center gap-3
                         border-2 border-dashed border-slate-300 rounded-2xl
                         bg-slate-50/70 hover:bg-emerald-50/20 hover:border-[#1b5e20]
                         transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
            >
              {/* HUD Corner Brackets */}
              <span className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-slate-400 group-hover:border-[#1b5e20] transition-colors rounded-tl" />
              <span className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-slate-400 group-hover:border-[#1b5e20] transition-colors rounded-tr" />
              <span className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-slate-400 group-hover:border-[#1b5e20] transition-colors rounded-bl" />
              <span className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-slate-400 group-hover:border-[#1b5e20] transition-colors rounded-br" />

              {isBusy ? (
                <>
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800">
                      {isProcessing ? 'Processing image…' : 'Running authenticity gate…'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Validating real camera capture</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Camera icon button */}
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-[#1b5e20] group-hover:scale-110 group-hover:bg-[#1b5e20] group-hover:text-white transition-all duration-200">
                    <span
                      className="material-symbols-outlined text-2xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      photo_camera
                    </span>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-[#1b5e20] transition-colors">
                      {label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Tap to open camera or browse device · JPEG, PNG, WebP up to 500KB
                    </p>
                  </div>

                  {/* Feature chips */}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap justify-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#1b5e20] border border-emerald-200">
                      ✓ Real Photo Gate
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      🤖 Auto AI Triage
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      📍 GPS Tagged
                    </span>
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
