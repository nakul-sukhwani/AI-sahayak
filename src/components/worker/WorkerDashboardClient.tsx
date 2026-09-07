'use client';

import { useLanguage } from '@/context/LanguageContext';
import { AssignmentCard } from '@/components/worker/AssignmentCard';
import type { Complaint } from '@/types/complaint';

interface WorkerDashboardClientProps {
  displayName: string;
  activeTasks: Complaint[];
  completedTasks: Complaint[];
}

export function WorkerDashboardClient({
  displayName,
  activeTasks,
  completedTasks,
}: WorkerDashboardClientProps) {
  const { t } = useLanguage();

  return (
    <div className="relative">
      {/* Dot-grid page decoration */}
      <div
        className="pointer-events-none fixed inset-0 nx-dot-grid"
        style={{ zIndex: 0, opacity: 0.35 }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* ── Hero panel ─────────────────────────────────────────── */}
        <div className="nx-hero-panel nx-hero-worker">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(180,83,9,0.15)' }}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{ color: 'var(--nx-worker)', fontVariationSettings: "'FILL' 1" }}
              >
                engineering
              </span>
            </div>
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--nx-worker)' }}
              >
                Field Worker Portal
              </p>
              <h1 className="text-xl font-bold text-[#002147] tracking-tight">
                {t('tasks_title')} — {displayName}
              </h1>
              <p className="text-sm text-[#718096] mt-0.5">
                {activeTasks.length} {t('active')} · {completedTasks.length} {t('done')}
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: t('active'), count: activeTasks.length,                                          accent: '#b45309', bg: 'var(--nx-worker-light)',  icon: 'pending_actions' },
            { label: t('done'),   count: completedTasks.filter((c) => c.status === 'resolved').length, accent: '#1b5e20', bg: 'var(--nx-citizen-light)', icon: 'task_alt' },
            { label: t('total'),  count: activeTasks.length + completedTasks.length,                   accent: '#002147', bg: 'var(--nx-navy-light)',     icon: 'assignment' },
          ].map((s) => (
            <div
              key={s.label}
              className="nx-card nx-stat-card p-4 text-center flex flex-col items-center gap-1.5"
              style={{ background: s.bg, borderColor: 'rgba(0,0,0,0.06)' }}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{ color: s.accent, fontVariationSettings: "'FILL' 1" }}
              >
                {s.icon}
              </span>
              <p className="text-2xl font-bold" style={{ color: s.accent }}>{s.count}</p>
              <p className="text-xs text-[#718096] capitalize">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Active Tasks ─────────────────────────────────────────── */}
        <section className="mb-7">
          <div className="nx-section-label">
            <span className="material-symbols-outlined text-sm" style={{ color: 'var(--nx-worker)' }}>pending_actions</span>
            <span>{t('active_tasks')} ({activeTasks.length})</span>
          </div>
          {activeTasks.length > 0 ? (
            <div className="flex flex-col gap-3">
              {activeTasks.map((c) => <AssignmentCard key={c.id} complaint={c} />)}
            </div>
          ) : (
            <div
              className="nx-card py-16 text-center flex flex-col items-center gap-3"
              style={{ background: 'var(--nx-worker-light)', borderColor: 'rgba(180,83,9,0.15)' }}
            >
              <span
                className="material-symbols-outlined text-4xl"
                style={{ color: 'var(--nx-worker)', opacity: 0.5 }}
              >
                task_alt
              </span>
              <p className="text-sm font-semibold text-[#1a2332]">{t('no_active_tasks')}</p>
              <p className="text-xs text-[#718096]">{t('no_active_tasks_desc')}</p>
            </div>
          )}
        </section>

        {/* ── Completed Tasks ──────────────────────────────────────── */}
        {completedTasks.length > 0 && (
          <section>
            <div className="nx-section-label">
              <span className="material-symbols-outlined text-sm" style={{ color: 'var(--nx-citizen)' }}>task_alt</span>
              <span>{t('recent_completed')} ({completedTasks.length})</span>
            </div>
            <div className="flex flex-col gap-3">
              {completedTasks.map((c) => <AssignmentCard key={c.id} complaint={c} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
