'use client';

import { useLanguage } from '@/context/LanguageContext';
import { ComplaintForm } from '@/components/complaints/ComplaintForm';
import { DynamicDashboardBackground } from '@/components/ui/DynamicDashboardBackground';

export default function NewComplaintPage() {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-[85vh]">
      {/* Interactive ambient particle background */}
      <DynamicDashboardBackground variant="citizen" />

      <div className="relative z-10 space-y-6">
        {/* Bento Hero Header Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#e8f5e9]/70 via-[#e8f5e9]/20 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: '#1b5e20', color: '#ffffff' }}
              >
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  add_a_photo
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#e8f5e9] text-[#1b5e20] border border-[#a5d6a7]">
                    Citizen Portal · Quick Redressal
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    AI Triage Online
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#002147] tracking-tight mt-1">
                  {t('report_issue_title') || 'Report a Civic Issue'}
                </h1>
                <p className="text-sm text-[#545f72] max-w-2xl mt-1">
                  {t('report_issue_subtitle') || 'Capture a photo and our multi-modal AI will detect authenticity, classify the problem, and dispatch field crews automatically.'}
                </p>
              </div>
            </div>

            {/* Quick Guarantees / Badges */}
            <div className="flex items-center gap-2 flex-wrap md:flex-col md:items-end">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
                <span className="material-symbols-outlined text-emerald-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  timer
                </span>
                <span>24h Resolution SLA</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
                <span className="material-symbols-outlined text-blue-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
                <span>Authentic Photo Gate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-step Bento Workflow Form */}
        <ComplaintForm />
      </div>
    </div>
  );
}

