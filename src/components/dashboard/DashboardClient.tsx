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
  const verifiedCount = resolved.filter((c) => c.status === 'resolved').length;

  return (
    <div className="relative">
      {/* Dynamic ambient background */}
      <DynamicDashboardBackground variant="citizen" />

      <div className="relative z-10 space-y-6">
        {/* ── Quixotic Top Bar & Greeting ──────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur rounded-2xl border border-[#dde3ed] p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1b5e20] animate-pulse"></span>
              <span className="text-[11px] font-bold text-[#1b5e20] uppercase tracking-wider">
                Citizen Civic Workspace
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#002147] tracking-tight">
              {t('welcome')}, {displayName}
            </h1>
            <p className="text-xs text-[#718096] mt-0.5">
              {complaints.length} total grievance{complaints.length !== 1 ? 's' : ''} logged in your municipal zone
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f6fa] rounded-xl border border-[#dde3ed] text-xs font-semibold text-[#4a5568]">
              <span className="material-symbols-outlined text-sm text-[#718096]">calendar_today</span>
              <span>Active Cycle: 2026</span>
            </div>

            <Link
              href="/dashboard/new"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl uppercase tracking-wider shadow-sm transition-all hover:opacity-95"
              style={{ background: 'var(--nx-citizen)' }}
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>{t('report_issue')}</span>
            </Link>
          </div>
        </div>

        {/* ── Quixotic Bento Top Grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Active Status Tile (Quixotic "Card" slot in Citizen Green) */}
          <div
            className="rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[170px]"
            style={{ background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #388e3c 100%)' }}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-base">groups</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">My Status</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                Civic Watch
              </span>
            </div>

            <div className="my-3 relative z-10">
              <p className="text-xs text-white/80">Pending Field Inspection</p>
              <h2 className="text-3xl font-bold tracking-tight text-white mt-0.5">
                {active.length} <span className="text-sm font-normal text-white/80">Active Reports</span>
              </h2>
            </div>

            <div className="text-[11px] text-white/80 border-t border-white/15 pt-2 relative z-10 flex items-center justify-between">
              <span>Smart AI Triage Active</span>
              <span className="font-semibold text-emerald-200">{verifiedCount} Verified</span>
            </div>
          </div>

          {/* Card 2: Resolution Health */}
          <div className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#718096]">Resolved Grievances</p>
                <span className="material-symbols-outlined text-lg text-[#1b5e20]">task_alt</span>
              </div>
              <h3 className="text-3xl font-bold text-[#1a2332]">{verifiedCount}</h3>
              <p className="text-xs text-[#718096] mt-1">Successfully addressed by ward teams</p>
            </div>

            <div className="pt-3 border-t border-[#dde3ed] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#1b5e20] bg-[#e8f5e9] px-2.5 py-0.5 rounded-full">
                AI Photo Verified
              </span>
              <Link href="/feed" className="text-xs font-semibold text-[#1565c0] hover:underline">
                Public Feed →
              </Link>
            </div>
          </div>

          {/* Card 3: Civic Assistance / Quick Help */}
          <div className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#718096]">AI Sahayak Support</p>
                <span className="material-symbols-outlined text-lg text-[#1565c0]">smart_toy</span>
              </div>
              <h3 className="text-base font-bold text-[#1a2332]">Closed-Loop Verification</h3>
              <p className="text-xs text-[#718096] mt-1">
                Workers submit before/after photo proof checked by Gemini AI vision before closure.
              </p>
            </div>

            <div className="pt-3 border-t border-[#dde3ed] flex items-center justify-between">
              <span className="text-[11px] text-[#718096]">Helpline: 1913</span>
              <span className="text-[11px] font-bold text-[#1565c0]">24x7 Municipal Ops</span>
            </div>
          </div>
        </div>

        {/* ── Empty state ─────────────────────────────────────────── */}
        {complaints.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#dde3ed] py-16 text-center flex flex-col items-center gap-4 shadow-sm">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ background: 'var(--nx-citizen-light)' }}
            >
              <span className="material-symbols-outlined text-3xl" style={{ color: 'var(--nx-citizen)' }}>
                assignment_turned_in
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-[#1a2332]">{t('no_complaints')}</p>
              <p className="text-xs text-[#718096] mt-1">{t('start_first_issue')}</p>
            </div>
            <Link
              href="/dashboard/new"
              className="px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm transition-all hover:opacity-95"
              style={{ background: 'var(--nx-citizen)' }}
            >
              {t('report_first_issue')}
            </Link>
          </div>
        )}

        {/* ── Active complaints ───────────────────────────────────── */}
        {active.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base" style={{ color: 'var(--nx-admin)' }}>pending_actions</span>
                <h2 className="text-base font-bold text-[#1a2332]">{t('active')} Issues</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#e3f0fd] text-[#1565c0]">
                  {active.length}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {active.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
            </div>
          </section>
        )}

        {/* ── Resolved complaints ─────────────────────────────────── */}
        {resolved.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base" style={{ color: 'var(--nx-citizen)' }}>task_alt</span>
                <h2 className="text-base font-bold text-[#1a2332]">{t('resolved')} History</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#e8f5e9] text-[#1b5e20]">
                  {resolved.length}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resolved.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
