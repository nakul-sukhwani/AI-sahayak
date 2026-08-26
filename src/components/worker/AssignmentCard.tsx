'use client';

import Link from 'next/link';
import type { Complaint } from '@/types/complaint';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getIssueLabel } from '@/constants/issue-types';
import type { ComplaintSeverity, ComplaintStatus } from '@/types/complaint';

interface AssignmentCardProps {
  complaint: Complaint;
}

const STATUS_CTA: Partial<Record<ComplaintStatus, string>> = {
  assigned:    'Start Work',
  in_progress: 'Submit Proof',
};

export function AssignmentCard({ complaint }: AssignmentCardProps) {
  return (
    <Link href={`/worker/${complaint.id}`} className="block">
      <Card hover padding="md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#dbeafe] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[#2563EB] text-xl">construction</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-[#191c1e]">
                {getIssueLabel(complaint.issue_type)}
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
              {STATUS_CTA[complaint.status as ComplaintStatus] && (
                <span className="ml-auto text-xs font-semibold text-[#001e40]">
                  {STATUS_CTA[complaint.status as ComplaintStatus]} →
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
