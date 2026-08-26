'use client';

import { useRef, useState, useCallback } from 'react';
import { processImage, type ProcessedImage } from '@/lib/image';
import { Spinner } from '@/components/ui/Spinner';

interface PhotoCaptureProps {
  onCapture: (result: ProcessedImage) => void;
  onError: (message: string) => void;
  preview?: string | null;     // existing preview dataUrl (e.g. on edit)
  label?: string;
  disabled?: boolean;
}

export function PhotoCapture({
  onCapture,
  onError,
  preview = null,
  label = 'Capture Photo',
  disabled = false,
}: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(preview);

  const handleFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      try {
        const result = await processImage(file);
        setLocalPreview(result.dataUrl);
        onCapture(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to process image.';
        onError(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    [onCapture, onError]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  }

  function openCamera() {
    fileInputRef.current?.click();
  }

  return (
    <div className="w-full">
      {/* Hidden file input — accepts camera + gallery on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"   // rear camera on mobile
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload complaint photo"
        disabled={disabled || isProcessing}
      />

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
            disabled={disabled || isProcessing}
            className="absolute bottom-3 right-3 flex items-center gap-1.5
                       bg-black/60 text-white text-xs font-medium px-3 py-2 rounded-lg
                       hover:bg-black/80 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">photo_camera</span>
            Retake
          </button>

          {/* Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
              <Spinner size="md" />
              <p className="text-sm text-[#545f72]">Processing image…</p>
            </div>
          )}
        </div>
      ) : (
        /* Empty capture zone */
        <button
          type="button"
          onClick={openCamera}
          disabled={disabled || isProcessing}
          className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-3
                     border-2 border-dashed border-[#c3c6d1] rounded-xl
                     bg-[#f7f9fb] hover:border-[#001e40] hover:bg-white
                     transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Spinner size="md" />
              <p className="text-sm text-[#545f72]">Processing image…</p>
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
                <p className="text-xs text-[#545f72] mt-0.5">JPEG, PNG or WebP · max 500KB</p>
              </div>
            </>
          )}
        </button>
      )}
    </div>
  );
}
