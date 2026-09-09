'use client';

import Link from 'next/link';
import type { Complaint } from '@/types/complaint';

export interface StatutoryWarningItem {
  id: string | number;
  complaint_id: string;
  sender_ngo: string;
  recipient_authority?: string;
  ward?: string;
  message: string;
  sent_at: string;
  complaint?: Complaint;
}

interface StatutoryWarningsNoticeBoardProps {
  warnings: StatutoryWarningItem[];
}

export function StatutoryWarningsNoticeBoard({ warnings }: StatutoryWarningsNoticeBoardProps) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50/95 via-rose-50/70 to-amber-50/60 p-6 shadow-sm space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-xl">gavel</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-200 text-red-900 animate-pulse">
                Statutory Escalation Active
              </span>
              <span className="text-xs font-bold text-red-800">
                {warnings.length} {warnings.length === 1 ? 'Notice' : 'Notices'} Received
              </span>
            </div>
            <h2 className="text-base font-bold text-[#002147] tracking-tight mt-0.5">
              Urgent Statutory RTI &amp; Civil Society Warnings
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-red-700 font-semibold flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-xl border border-red-200 shadow-2xs">
            <span className="material-symbols-outlined text-sm text-red-600">timer</span>
            <span>72-Hour Legal Redress Clock Running</span>
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Civil society organizations and citizens have issued formal warnings under <strong>Section 6(1)</strong> and <strong>Section 20(1)</strong> of the Right to Information Act, 2005 for unresolved overdue grievances. Officer failure to respond triggers daily statutory penalties.
      </p>

      {/* Warnings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {warnings.map((w) => {
          const c = w.complaint;
          const daysOpen = c?.created_at
            ? Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 3600 * 24))
            : 7;

          return (
            <div
              key={w.id}
              className="bg-white rounded-xl border border-red-200 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider">
                      From: {w.sender_ngo}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      Grievance #{w.complaint_id.slice(0, 8)} · {c?.issue_type.replace(/_/g, ' ') || 'Civic Issue'}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-300 flex-shrink-0">
                    {daysOpen} Days Overdue
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 italic">
                  &ldquo;{w.message}&rdquo;
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-slate-400">location_on</span>
                    <span className="truncate">{c?.ward_name || c?.address || 'Central Ward'}</span>
                  </span>
                  <span>•</span>
                  <span>Issued {new Date(w.sent_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/dashboard/${w.complaint_id}`}
                  className="text-xs font-bold text-[#1565c0] hover:underline flex items-center gap-1"
                >
                  <span>Inspect Docket</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>

                <a
                  href={`#complaint-${w.complaint_id}`}
                  className="px-3 py-1.5 bg-[#002147] hover:bg-[#003166] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">bolt</span>
                  <span>Expedite Dispatch</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
