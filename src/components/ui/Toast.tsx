'use client';

import { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const iconMap: Record<ToastType, string> = {
  success: 'check_circle',
  error:   'error',
  info:    'info',
  warning: 'warning',
};

const styleMap: Record<ToastType, string> = {
  success: 'bg-[#d1fae5] border-[#059669] text-[#059669]',
  error:   'bg-[#fee2e2] border-[#DC2626] text-[#DC2626]',
  info:    'bg-[#dbeafe] border-[#2563EB] text-[#2563EB]',
  warning: 'bg-[#fef3c7] border-[#D97706] text-[#D97706]',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={[
              'flex items-start gap-3 p-4 rounded-xl border shadow-md',
              'animate-[slideUp_0.2s_ease-out]',
              styleMap[t.type],
            ].join(' ')}
          >
            <span className="material-symbols-outlined text-lg flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              {iconMap[t.type]}
            </span>
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
