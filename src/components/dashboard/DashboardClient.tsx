'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { ComplaintCard } from '@/components/complaints/ComplaintCard';
import { DynamicDashboardBackground } from '@/components/ui/DynamicDashboardBackground';
import type { Complaint } from '@/types/complaint';

interface DashboardClientProps {
  displayName: string;
  complaints: Complaint[];
}

export function DashboardClient({ displayName, complaints }: DashboardClientProps) {
  const { t } = useLanguage();

  const active = complaints.filter((c) => !['resolved', 'rejected'].includes(c.status));
  const resolved = complaints.filter((c) => ['resolved', 'rejected'].includes(c.status));

  return (
    <div className="relative">
      {/* Dynamic ambient & interactive background */}
      <DynamicDashboardBackground variant="citizen" />

      <div className="relative z-10">
        {/* ── Hero panel ─────────────────────────────────────────── */}
        <div className="nx-hero-panel nx-hero-citizen">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ color: 'var(--nx-citizen)', fontVariationSettings: "'FILL' 1" }}
                >
                  groups
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--nx-citizen)' }}
                >
                  Citizen Portal
                </span>
              </div>
              <h1 className="text-xl font-bold text-[#002147] tracking-tight">
                {t('welcome')}, {displayName}
              </h1>
              <p className="text-sm text-[#718096] mt-0.5">
                {complaints.length} {t('complaints_filed')}
              </p>
            </div>
            <Link
              href="/dashboard/new"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded uppercase tracking-wider flex-shrink-0 transition-colors"
              style={{ background: 'var(--nx-citizen)' }}
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {t('report_issue')}
            </Link>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────── */}
        {complaints.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-7">
            {[
              { label: t('active'),   count: active.length,                                           accent: '#1565c0', bg: 'var(--nx-admin-light)',   icon: 'pending_actions' },
              { label: t('resolved'), count: resolved.filter((c) => c.status === 'resolved').length,  accent: '#1b5e20', bg: 'var(--nx-citizen-light)', icon: 'task_alt' },
              { label: t('total'),    count: complaints.length,                                        accent: '#002147', bg: 'var(--nx-navy-light)',     icon: 'assignment' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="nx-card nx-stat-card p-4 text-center flex flex-col items-center gap-1.5"
                style={{ background: stat.bg, borderColor: 'rgba(0,0,0,0.06)' }}
              >
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ color: stat.accent, fontVariationSettings: "'FILL' 1" }}
                >
                  {stat.icon}
                </span>
                <p className="text-2xl font-bold" style={{ color: stat.accent }}>{stat.count}</p>
                <p className="text-xs text-[#718096] capitalize">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────── */}
        {complaints.length === 0 && (
          <div className="nx-card py-20 text-center flex flex-col items-center gap-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--nx-citizen-light)' }}
            >
              <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--nx-citizen)' }}>
                assignment
              </span>
            </div>
            <div>
              <p className="text-base font-semibold text-[#1a2332]">{t('no_complaints')}</p>
              <p className="text-sm text-[#718096] mt-1">{t('start_first_issue')}</p>
            </div>
            <Link
              href="/dashboard/new"
              className="px-6 py-2.5 text-sm font-semibold text-white rounded transition-colors"
              style={{ background: 'var(--nx-citizen)' }}
            >
              {t('report_first_issue')}
            </Link>
          </div>
        )}

        {/* ── Active complaints ───────────────────────────────────── */}
        {active.length > 0 && (
          <section className="mb-7">
            <div className="nx-section-label">
              <span className="material-symbols-outlined text-sm" style={{ color: 'var(--nx-admin)' }}>pending_actions</span>
              <span>{t('active')} ({active.length})</span>
            </div>
            <div className="flex flex-col gap-3">
              {active.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
            </div>
          </section>
        )}

        {/* ── Resolved complaints ─────────────────────────────────── */}
        {resolved.length > 0 && (
          <section>
            <div className="nx-section-label">
              <span className="material-symbols-outlined text-sm" style={{ color: 'var(--nx-citizen)' }}>task_alt</span>
              <span>{t('resolved')} ({resolved.length})</span>
            </div>
            <div className="flex flex-col gap-3">
              {resolved.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
