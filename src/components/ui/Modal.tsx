'use client';

import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus + close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className={[
          'relative z-10 w-full bg-white',
          'rounded-t-2xl sm:rounded-xl',
          'shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1)]',
          'border border-[#E2E8F0]',
          maxWidthClasses[maxWidth],
          'animate-[slideUp_0.2s_ease-out]',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E2E8F0]">
          <h2 id="modal-title" className="text-base font-semibold text-[#191c1e]">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-[#545f72] hover:text-[#191c1e] transition-colors p-1 rounded-lg hover:bg-[#f7f9fb]"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 pb-5 pt-2 border-t border-[#E2E8F0] flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
