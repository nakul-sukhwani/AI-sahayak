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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#191c1e] tracking-tight">
          {t('tasks_title')} — {displayName}
        </h1>
        <p className="text-sm text-[#545f72] mt-1">
          {activeTasks.length} {t('active')} · {completedTasks.length} {t('done')}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: t('active'), count: activeTasks.length, color: 'text-[#D97706]', bg: 'bg-[#fef3c7]' },
          { label: t('done'), count: completedTasks.filter((c) => c.status === 'resolved').length, color: 'text-[#059669]', bg: 'bg-[#d1fae5]' },
          { label: t('total'), count: activeTasks.length + completedTasks.length, color: 'text-[#001e40]', bg: 'bg-[#f7f9fb]' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-[#E2E8F0]`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-[#545f72] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active Tasks */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-[#43474f] uppercase tracking-widest mb-3">
          {t('active_tasks')} ({activeTasks.length})
        </h2>
        {activeTasks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {activeTasks.map((c) => (
              <AssignmentCard key={c.id} complaint={c} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-xl border border-[#E2E8F0] p-4">
            <span className="material-symbols-outlined text-4xl text-[#c3c6d1]">task_alt</span>
            <p className="text-sm font-medium text-[#191c1e] mt-2">{t('no_active_tasks')}</p>
            <p className="text-xs text-[#545f72] mt-0.5">{t('no_active_tasks_desc')}</p>
          </div>
        )}
      </section>

      {/* Recent Completed */}
      {completedTasks.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#43474f] uppercase tracking-widest mb-3">
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
