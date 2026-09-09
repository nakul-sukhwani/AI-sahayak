'use client';

import Link from 'next/link';
import type { Complaint } from '@/types/complaint';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { getIssueLabel } from '@/constants/issue-types';
import type { ComplaintSeverity, ComplaintStatus } from '@/types/complaint';
import type { TranslationKey } from '@/lib/translations';

interface ComplaintCardProps {
  complaint: Complaint;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
  const { t } = useLanguage();
  const issueName = t(complaint.issue_type as TranslationKey) || getIssueLabel(complaint.issue_type);

  return (
    <Link href={`/dashboard/${complaint.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#1b5e20]/60 p-5 shadow-xs hover:shadow-md transition-all duration-200">
        <div className="flex items-start gap-4">
          {/* Category Avatar */}
          <div className={[
            'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs transition-transform group-hover:scale-105',
            complaint.severity === 'critical' ? 'bg-red-50 text-red-600 border border-red-200' :
            complaint.severity === 'high'     ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            complaint.severity === 'medium'   ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                'bg-emerald-50 text-emerald-700 border border-emerald-200',
          ].join(' ')}>
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {complaint.issue_type === 'pothole' ? 'report_problem' :
               complaint.issue_type === 'streetlight' ? 'lightbulb' :
               complaint.issue_type === 'garbage' ? 'delete' :
               complaint.issue_type === 'water_leakage' ? 'water_drop' : 'construction'}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <div className="flex items-center gap-2">
                <p className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#1b5e20] transition-colors truncate">
                  {issueName}
                </p>
                <Badge variant={complaint.status as ComplaintStatus} />
              </div>

              <span className="text-[11px] font-semibold text-slate-400">
                {timeAgo(complaint.created_at)}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {complaint.description_en}
            </p>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <Badge variant={complaint.severity as ComplaintSeverity} />
                {complaint.ward_name && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                    <span className="material-symbols-outlined text-xs text-blue-600">location_on</span>
                    {complaint.ward_name}
                  </span>
                )}
                {complaint.is_anonymous && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                    Anonymous
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-slate-400 group-hover:text-[#1b5e20] font-semibold text-xs transition-colors">
                <span>View Details</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
