'use client';

import Link from 'next/link';
import type { Complaint } from '@/types/complaint';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
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
    <Link href={`/dashboard/${complaint.id}`} className="block">
      <Card hover padding="md">
        <div className="flex items-start gap-3">
          {/* Icon — colored by severity */}
          <div className={[
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            complaint.severity === 'critical' ? 'bg-[#fee2e2]' :
            complaint.severity === 'high'     ? 'bg-[#fef3c7]' :
            complaint.severity === 'medium'   ? 'bg-[#dbeafe]' :
                                                'bg-[#d1fae5]',
          ].join(' ')}>
            <span className={[
              'material-symbols-outlined text-xl',
              complaint.severity === 'critical' ? 'text-[#DC2626]' :
              complaint.severity === 'high'     ? 'text-[#D97706]' :
              complaint.severity === 'medium'   ? 'text-[#2563EB]' :
                                                  'text-[#059669]',
            ].join(' ')} style={{ fontVariationSettings: "'FILL' 1" }}>
              report_problem
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-[#191c1e] truncate">
                {issueName}
              </p>
              <Badge variant={complaint.status as ComplaintStatus} />
            </div>

            <p className="text-xs text-[#545f72] mt-0.5 line-clamp-2">
              {complaint.description_en}
            </p>

            <div className="mt-2 flex items-center gap-3">
              <Badge variant={complaint.severity as ComplaintSeverity} />
              {complaint.ward_name && (
                <span className="text-xs text-[#737780] flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">location_on</span>
                  {complaint.ward_name}
                </span>
              )}
              <span className="text-xs text-[#737780] ml-auto">{timeAgo(complaint.created_at)}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
