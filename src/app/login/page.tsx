'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { OTPForm } from '@/components/auth/OTPForm';
import { getTranslation, type SupportedLocale } from '@/lib/translations';

type PortalRole = 'citizen' | 'worker' | 'officer' | 'ngo' | 'university';

const PORTALS: Record<PortalRole, {
  name: string;
  shortLabel: string;
  color: string;
  bgLight: string;
  borderColor: string;
  icon: string;
  targetHref: string;
  desc: string;
}> = {
  citizen: {
    name: 'Citizen Portal',
    shortLabel: 'Citizen',
    color: '#1b5e20',
    bgLight: '#e8f5e9',
    borderColor: '#a5d6a7',
    icon: 'groups',
    targetHref: '/dashboard',
    desc: 'File grievances, track progress, and view verified work',
  },
  worker: {
    name: 'Field Worker Portal',
    shortLabel: 'Field Ops',
    color: '#b45309',
    bgLight: '#fef3e2',
    borderColor: '#f6c17a',
    icon: 'engineering',
    targetHref: '/worker',
    desc: 'Access ward task queue, GPS locations, and submit proof photos',
  },
  officer: {
    name: 'Officer Portal',
    shortLabel: 'Officer',
    color: '#002147',
    bgLight: '#e3f0fd',
    borderColor: '#b8c4d6',
    icon: 'admin_panel_settings',
    targetHref: '/admin',
    desc: 'Municipal analytics, AI triage review, worker assignment, and SLA control',
  },
  ngo: {
    name: 'NGO Portal',
    shortLabel: 'NGO',
    color: '#00695c',
    bgLight: '#e0f2f1',
    borderColor: '#80cbc4',
    icon: 'volunteer_activism',
    targetHref: '/ngo',
    desc: 'Monitor civic accountability, overdue complaints, and formal demand letters',
  },
  university: {
    name: 'University Portal',
    shortLabel: 'University',
    color: '#4a148c',
    bgLight: '#f3e5f5',
    borderColor: '#ce93d8',
    icon: 'school',
    targetHref: '/university',
    desc: 'Review civic challenges, submit R&D proposals, and collaborate on municipal solutions',
  },
};

const VALID_PORTALS: PortalRole[] = ['citizen', 'worker', 'officer', 'ngo', 'university'];

function LoginContent() {
  const searchParams = useSearchParams();
  const rawPortal = (searchParams.get('portal') || searchParams.get('role') || 'citizen').toLowerCase();
  const initialPortal: PortalRole = (VALID_PORTALS.includes(rawPortal as PortalRole) ? rawPortal : 'citizen') as PortalRole;

  const [selectedPortal, setSelectedPortal] = useState<PortalRole>(initialPortal);
  const [lang, setLang] = useState<SupportedLocale>('en');

  useEffect(() => {
    if (VALID_PORTALS.includes(rawPortal as PortalRole)) {
      setSelectedPortal(rawPortal as PortalRole);
    }
  }, [rawPortal]);

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

  const activeInfo = PORTALS[selectedPortal];

  return (
    <main className="flex-1 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10 relative overflow-hidden">
      {/* Ashoka wheel watermark */}
      <div
        className="pointer-events-none select-none absolute right-0 bottom-0 text-[#002147] opacity-[0.03] text-[260px] sm:text-[380px] leading-none translate-x-1/4 translate-y-1/4"
        aria-hidden="true"
      >
        ☸
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Role Selector Tabs */}
        <div className="bg-white/90 backdrop-blur border border-[#dde3ed] p-1 sm:p-1.5 rounded-2xl shadow-sm mb-4 grid grid-cols-5 gap-1">
          {(Object.keys(PORTALS) as PortalRole[]).map((key) => {
            const p = PORTALS[key];
            const isSelected = selectedPortal === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedPortal(key)}
                className={`py-2 px-1 sm:px-2 rounded-xl font-bold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition-all text-center ${
                  isSelected
                    ? 'shadow-sm text-white'
                    : 'text-[#4a5568] hover:bg-[#f4f6fa]'
                }`}
                style={isSelected ? { background: p.color } : {}}
              >
                <span
                  className="material-symbols-outlined text-base sm:text-sm flex-shrink-0"
                  style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {p.icon}
                </span>
                <span className="text-[10px] sm:text-xs tracking-tight truncate max-w-full">
                  {p.shortLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-[#dde3ed] p-5 sm:p-8 shadow-xl relative overflow-hidden">
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 transition-colors duration-300" style={{ background: activeInfo.color }} />

          {/* Card header */}
          <div className="text-center mb-5 sm:mb-6">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm transition-colors duration-300"
              style={{ background: activeInfo.bgLight, color: activeInfo.color }}
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {activeInfo.icon}
              </span>
            </div>
            <div className="inline-block px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1" style={{ background: activeInfo.bgLight, color: activeInfo.color }}>
              {activeInfo.name}
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#002147] tracking-tight">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs text-[#4a5568] mt-1 max-w-sm mx-auto">
              {activeInfo.desc}
            </p>
          </div>

          {/* Quick Demo Access banner (for judges, evaluators & testing) */}
          <div
            className="mb-5 sm:mb-6 p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            style={{ background: activeInfo.bgLight, borderColor: activeInfo.borderColor }}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: activeInfo.color }}>
                bolt
              </span>
              <div>
                <p className="font-bold text-[#1a2332]">Quick Demo / Evaluator Mode</p>
                <p className="text-[11px] text-[#4a5568]">Instant access without SMS OTP</p>
              </div>
            </div>
            <Link
              href={activeInfo.targetHref}
              className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-opacity hover:opacity-90 flex-shrink-0"
              style={{ background: activeInfo.color }}
            >
              <span>Explore</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#dde3ed]"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-[#718096]">
              <span className="bg-white px-2">or sign in with credentials</span>
            </div>
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
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--nx-bg)' }}>
      {/* ── Utility bar ──────────────────────────────────────────── */}
      <div className="gov-utility-bar">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-9 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🇮🇳</span>
            <span className="text-xs font-medium text-white/85">Government of India</span>
          </div>
          <a href="/" className="text-xs text-white/70 hover:text-white transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Home</span>
          </a>
        </div>
      </div>

      {/* ── Brand header ─────────────────────────────────────────── */}
      <div className="gov-brand-header">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3 sm:py-4 flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#002147] flex items-center justify-center shadow-md flex-shrink-0">
            <span
              className="material-symbols-outlined text-white text-lg sm:text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance
            </span>
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold text-[#002147] leading-tight tracking-tight">Nagrik Seva</p>
            <p className="text-[10px] sm:text-[11px] text-[#4a5568] leading-tight">
              Municipal Corporation &amp; Civic Services
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="flex-1 flex items-center justify-center p-12 text-sm text-[#718096]">Loading portal...</div>}>
        <LoginContent />
      </Suspense>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="nx-footer">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2">
            <span className="text-white/70 text-xs">🇮🇳</span>
            <span className="text-xs text-white/70">Government of India</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-5">
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
