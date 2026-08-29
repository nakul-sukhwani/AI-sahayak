'use client';

import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/translations';

interface LanguageSelectorProps {
  currentLang: SupportedLocale;
  onSelect: (lang: SupportedLocale) => void;
}

export function LanguageSelector({ currentLang, onSelect }: LanguageSelectorProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-[#f7f9fb] rounded-xl border border-[#E2E8F0] w-full">
      {SUPPORTED_LOCALES.map(({ code, label }) => {
        const isActive = currentLang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            className={`px-3 py-1 text-xs rounded-lg transition-all ${
              isActive
                ? 'bg-[#001e40] text-white font-medium shadow-sm'
                : 'text-[#545f72] hover:text-[#191c1e] hover:bg-white/80'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
