'use client';

import { useState, useEffect } from 'react';
import { OTPForm } from '@/components/auth/OTPForm';
import { getTranslation, type SupportedLocale } from '@/lib/translations';

export default function LoginPage() {
  const [lang, setLang] = useState<SupportedLocale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('app_lang') as SupportedLocale | null;
    if (saved && ['en', 'hi', 'bn', 'mr', 'ta', 'ml'].includes(saved)) {
      setLang(saved);
    }
  }, []);

  function handleLangChange(newLang: SupportedLocale) {
    setLang(newLang);
    try {
      localStorage.setItem('app_lang', newLang);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <span
            className="material-symbols-outlined text-[#001e40] text-5xl mb-3 block"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_balance
          </span>
          <h1 className="text-2xl font-semibold text-[#001e40] tracking-tight">
            {getTranslation(lang, 'portal_title')}
          </h1>
          <p className="text-sm text-[#545f72] mt-1">
            {getTranslation(lang, 'portal_subtitle')}
          </p>
        </div>

        <OTPForm lang={lang} onLangChange={handleLangChange} />

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-sm text-[#545f72]">
            {getTranslation(lang, 'footer_text')}
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="/privacy" className="text-sm text-[#545f72] hover:text-[#001e40] transition-colors">
              {getTranslation(lang, 'privacy')}
            </a>
            <a href="#" className="text-sm text-[#545f72] hover:text-[#001e40] transition-colors">
              {getTranslation(lang, 'terms')}
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
