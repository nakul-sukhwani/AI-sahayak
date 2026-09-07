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
    try { localStorage.setItem('app_lang', newLang); } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--nx-bg)' }}>

      {/* ── Utility bar ──────────────────────────────────────────── */}
      <div className="gov-utility-bar">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-9 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🇮🇳</span>
            <span className="text-xs font-medium text-white/85 hidden sm:inline">Government of India</span>
          </div>
          <a href="/" className="text-xs text-white/70 hover:text-white transition-colors">
            ← Back to Home
          </a>
        </div>
      </div>

      {/* ── Brand header ─────────────────────────────────────────── */}
      <div className="gov-brand-header">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#002147] flex items-center justify-center shadow-md flex-shrink-0">
            <span
              className="material-symbols-outlined text-white text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-[#002147] leading-tight tracking-tight">Nagrik Seva</p>
            <p className="text-[11px] text-[#4a5568] leading-tight">
              Municipal Corporation &amp; Civic Services
            </p>
          </div>
        </div>
      </div>

      {/* ── Main login area ───────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Ashoka wheel watermark */}
        <div
          className="pointer-events-none select-none absolute right-0 bottom-0 text-[#002147] opacity-[0.03] text-[380px] leading-none translate-x-1/4 translate-y-1/4"
          aria-hidden="true"
        >
          ☸
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Card */}
          <div className="nx-card nx-card-navy p-8 shadow-md">
            {/* Card header */}
            <div className="text-center mb-7">
              <div className="w-16 h-16 rounded-full bg-[#002147] flex items-center justify-center mx-auto mb-4 shadow-md">
                <span
                  className="material-symbols-outlined text-white text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  account_balance
                </span>
              </div>
              <h1 className="text-lg font-bold text-[#002147] uppercase tracking-widest">
                Nagrik Seva Portal
              </h1>
              <div className="w-16 h-0.5 bg-[#002147] mx-auto my-3 opacity-30" />
              <p className="text-sm text-[#4a5568]">
                {getTranslation(lang, 'portal_subtitle')}
              </p>
            </div>

            {/* Auth form */}
            <OTPForm lang={lang} onLangChange={handleLangChange} />
          </div>

          {/* Footer links */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#718096] mb-3">
              {getTranslation(lang, 'footer_text')}
            </p>
            <div className="flex justify-center gap-6">
              <a href="/privacy" className="text-xs text-[#4a5568] hover:text-[#002147] transition-colors">
                {getTranslation(lang, 'privacy')}
              </a>
              <a href="#" className="text-xs text-[#4a5568] hover:text-[#002147] transition-colors">
                {getTranslation(lang, 'terms')}
              </a>
              <a href="#" className="text-xs text-[#4a5568] hover:text-[#002147] transition-colors">
                Helpdesk
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="nx-footer">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-xs">🇮🇳</span>
            <span className="text-xs text-white/70">Government of India</span>
          </div>
          <div className="flex items-center gap-5">
            {['Terms & Conditions', 'Privacy Policy', 'Helpdesk'].map((l) => (
              <a key={l} href="#" className="text-xs text-white/60 hover:text-white transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
