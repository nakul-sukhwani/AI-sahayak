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
    <div>
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="mb-6 pb-5 border-b border-[#dde3ed] flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--nx-worker-light)' }}
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ color: 'var(--nx-worker)', fontVariationSettings: "'FILL' 1" }}
              >
                engineering
              </span>
            </div>
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--nx-worker)' }}
            >
              Field Worker Portal
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#002147] tracking-tight">
            {t('tasks_title')} — {displayName}
          </h1>
          <p className="text-sm text-[#718096] mt-0.5">
            {activeTasks.length} {t('active')} · {completedTasks.length} {t('done')}
          </p>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {[
          { label: t('active'), count: activeTasks.length,                                          accent: '#b45309', bg: 'var(--nx-worker-light)', icon: 'pending_actions' },
          { label: t('done'),   count: completedTasks.filter((c) => c.status === 'resolved').length, accent: '#1b5e20', bg: 'var(--nx-citizen-light)', icon: 'task_alt' },
          { label: t('total'),  count: activeTasks.length + completedTasks.length,                   accent: '#002147', bg: 'var(--nx-navy-light)',    icon: 'assignment' },
        ].map((s) => (
          <div
            key={s.label}
            className="nx-card p-4 text-center flex flex-col items-center gap-1.5"
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
        <h2
          className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3 flex items-center gap-2"
          style={{ color: '#718096' }}
        >
          <span
            className="material-symbols-outlined text-sm"
            style={{ color: 'var(--nx-worker)' }}
          >
            pending_actions
          </span>
          {t('active_tasks')} ({activeTasks.length})
        </h2>
        {activeTasks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {activeTasks.map((c) => (
              <AssignmentCard key={c.id} complaint={c} />
            ))}
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
          <h2
            className="text-[10px] font-bold uppercase tracking-[0.12em] mb-3 flex items-center gap-2"
            style={{ color: '#718096' }}
          >
            <span
              className="material-symbols-outlined text-sm"
              style={{ color: 'var(--nx-citizen)' }}
            >
              task_alt
            </span>
            {t('recent_completed')} ({completedTasks.length})
          </h2>
          <div className="flex flex-col gap-3">
            {completedTasks.map((c) => (
              <AssignmentCard key={c.id} complaint={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
