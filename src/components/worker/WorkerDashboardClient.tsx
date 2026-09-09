'use client';

import { useLanguage } from '@/context/LanguageContext';
import { AssignmentCard } from '@/components/worker/AssignmentCard';
import { DynamicDashboardBackground } from '@/components/ui/DynamicDashboardBackground';
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
  const completedCount = completedTasks.filter((c) => ['resolved', 'proof_submitted'].includes(c.status)).length;

  return (
    <div className="relative">
      {/* Dynamic ambient background */}
      <DynamicDashboardBackground variant="worker" />

      <div className="relative z-10 space-y-6">
        {/* ── Quixotic Top Bar & Greeting ──────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur rounded-2xl border border-[#dde3ed] p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b45309] animate-pulse"></span>
              <span className="text-[11px] font-bold text-[#b45309] uppercase tracking-wider">
                Field Operations Workspace
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#002147] tracking-tight">
              {t('tasks_title')} — {displayName}
            </h1>
            <p className="text-xs text-[#718096] mt-0.5">
              {activeTasks.length} assigned task{activeTasks.length !== 1 ? 's' : ''} in queue • Central Zone Dispatch
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#fef3e2] text-[#b45309] border border-[#f6c17a]">
              <span className="w-2 h-2 rounded-full bg-[#b45309]"></span>
              Active Shift • On Duty
            </span>
          </div>
        </div>

        {/* ── Quixotic Bento Top Grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Shift Status Tile (Quixotic "Card" slot in Worker Amber) */}
          <div
            className="rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[170px]"
            style={{ background: 'linear-gradient(135deg, #b45309 0%, #d97706 70%, #f59e0b 100%)' }}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-base">engineering</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">My Workload</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                Priority Tasks
              </span>
            </div>

            <div className="my-3 relative z-10">
              <p className="text-xs text-white/80">Tasks Awaiting Action</p>
              <h2 className="text-3xl font-bold tracking-tight text-white mt-0.5">
                {activeTasks.length} <span className="text-sm font-normal text-white/80">Pending Sites</span>
              </h2>
            </div>

            <div className="text-[11px] text-white/80 border-t border-white/15 pt-2 relative z-10 flex items-center justify-between">
              <span>GPS Coordinates Active</span>
              <span className="font-semibold text-amber-100">Ward Dispatch #12</span>
            </div>
          </div>

          {/* Card 2: Completed / Resolved Today */}
          <div className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#718096]">Proof Submitted</p>
                <span className="material-symbols-outlined text-lg text-[#1b5e20]">fact_check</span>
              </div>
              <h3 className="text-3xl font-bold text-[#1a2332]">{completedCount}</h3>
              <p className="text-xs text-[#718096] mt-1">Sites fixed and submitted for officer review</p>
            </div>

            <div className="pt-3 border-t border-[#dde3ed] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#1b5e20] bg-[#e8f5e9] px-2.5 py-0.5 rounded-full">
                AI Match Score &gt; 90%
              </span>
              <span className="text-xs text-[#718096]">Daily Goal: 5 Tasks</span>
            </div>
          </div>

          {/* Card 3: Camera & Verification Guideline */}
          <div className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#718096]">Photo Verification Tip</p>
                <span className="material-symbols-outlined text-lg text-[#b45309]">photo_camera</span>
              </div>
              <h3 className="text-base font-bold text-[#1a2332]">Match Original Angle</h3>
              <p className="text-xs text-[#718096] mt-1">
                Take completion photo from the same viewpoint as the complaint to ensure instant AI verification pass.
              </p>
            </div>

            <div className="pt-3 border-t border-[#dde3ed] flex items-center justify-between text-xs text-[#718096]">
              <span>Geo-tag required</span>
              <span className="font-semibold text-[#b45309]">Automatic Sync</span>
            </div>
          </div>
        </div>

        {/* ── Active Tasks ─────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base" style={{ color: 'var(--nx-worker)' }}>pending_actions</span>
              <h2 className="text-base font-bold text-[#1a2332]">{t('active_tasks')}</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#fef3e2] text-[#b45309]">
                {activeTasks.length}
              </span>
            </div>
          </div>

          {activeTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTasks.map((c) => <AssignmentCard key={c.id} complaint={c} />)}
            </div>
          ) : (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#fef3e2] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl" style={{ color: 'var(--nx-worker)' }}>task_alt</span>
              </div>
              <p className="text-sm font-bold text-[#1a2332]">{t('no_active_tasks')}</p>
              <p className="text-xs text-[#718096]">{t('no_active_tasks_desc')}</p>
            </div>
          )}
        </section>

        {/* ── Completed Tasks ──────────────────────────────────────── */}
        {completedTasks.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#dde3ed] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base" style={{ color: 'var(--nx-citizen)' }}>task_alt</span>
                <h2 className="text-base font-bold text-[#1a2332]">{t('recent_completed')}</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#e8f5e9] text-[#1b5e20]">
                  {completedTasks.length}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedTasks.map((c) => <AssignmentCard key={c.id} complaint={c} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
