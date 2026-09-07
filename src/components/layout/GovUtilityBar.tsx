'use client';

import { useState } from 'react';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/translations';
import { useLanguage } from '@/context/LanguageContext';

// Font-size accessibility control — saved in localStorage
function useFontSize() {
  const sizes = ['text-sm', 'text-base', 'text-lg'] as const;
  const labels = ['A-', 'A', 'A+'];
  const [sizeIdx, setSizeIdx] = useState(1);

  function apply(idx: number) {
    setSizeIdx(idx);
    document.documentElement.style.fontSize =
      idx === 0 ? '14px' : idx === 1 ? '16px' : '18px';
  }

  return { sizes, labels, sizeIdx, apply };
}

export function GovUtilityBar() {
  const { lang, setLanguage } = useLanguage();
  const { labels, sizeIdx, apply } = useFontSize();

  return (
    <div className="gov-utility-bar">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-9 flex items-center justify-between gap-4">
        {/* Left: India flag + govt label */}
        <div className="flex items-center gap-2">
          <span className="text-base" role="img" aria-label="India flag">🇮🇳</span>
          <span className="text-xs font-medium tracking-wide hidden sm:inline">
            Government of India
          </span>
          <span className="text-xs text-white/40 hidden sm:inline">|</span>
          <span className="text-xs text-white/70 hidden sm:inline">
            Nagrik Seva Portal
          </span>
        </div>

        {/* Right: Font size + Language */}
        <div className="flex items-center gap-4">
          {/* Font size */}
          <div className="flex items-center gap-1" aria-label="Adjust font size">
            {labels.map((label, i) => (
              <button
                key={label}
                onClick={() => apply(i)}
                className={`px-2 py-0.5 rounded text-white/80 transition-colors text-[10px] font-semibold ${
                  sizeIdx === i
                    ? 'bg-white/20 text-white'
                    : 'hover:bg-white/10'
                }`}
                aria-pressed={sizeIdx === i}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <span className="text-white/30">|</span>

          {/* Language */}
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-white/60 text-sm">translate</span>
            <select
              id="util-lang-select"
              aria-label="Select language"
              value={lang}
              onChange={(e) => setLanguage(e.target.value as SupportedLocale)}
              className="bg-transparent text-white/85 text-xs font-medium focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LOCALES.map((loc) => (
                <option key={loc.code} value={loc.code} className="text-[#1a2332] bg-white">
                  {loc.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
