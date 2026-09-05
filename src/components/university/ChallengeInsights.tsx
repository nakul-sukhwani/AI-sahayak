'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { computeChallengeInsights } from '@/lib/university-heuristics';

interface ChallengeData {
  id: string;
  title: string;
  description: string;
  domain: string;
  tags: string[];
  district: string | null;
  submitter_type: string;
  submitted_on_behalf_of: string | null;
  image_url?: string | null;
  status: string;
  created_at: string;
}

interface ChallengeInsightsProps {
  challenge: ChallengeData;
  className?: string;
}

export function ChallengeInsights({ challenge, className = '' }: ChallengeInsightsProps) {
  const insights = useMemo(() => computeChallengeInsights(challenge), [challenge]);

  const formattedDate = useMemo(() => {
    try {
      const date = new Date(challenge.created_at);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return challenge.created_at;
    }
  }, [challenge.created_at]);

  const relativeTime = useMemo(() => {
    try {
      const diffMs = Date.now() - new Date(challenge.created_at).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHours > 0) return `${diffHours}h ago`;
      return 'Just now';
    } catch {
      return '';
    }
  }, [challenge.created_at]);

  return (
    <div className={['border border-[#E2E8F0] bg-white rounded-xl p-5 space-y-4 shadow-sm', className].join(' ')}>
      {/* Header with Severity & Infrastructure */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#001e40] text-xl">analytics</span>
          <h4 className="text-sm font-bold text-[#191c1e] tracking-tight uppercase">
            Detailed Challenge Insights
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#545f72] font-medium">Assessed Severity:</span>
          <Badge
            variant={insights.severity}
            label={insights.severity.toUpperCase()}
          />
        </div>
      </div>

      {/* Grid of Situational Attributes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Localized Context */}
        <div className="bg-[#f7f9fb] p-3 rounded-lg border border-[#E2E8F0]/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#545f72] mb-1">
            <span className="material-symbols-outlined text-base text-[#001e40]">location_on</span>
            <span>Localized Context &amp; Region</span>
          </div>
          <p className="text-sm font-medium text-[#191c1e]">
            {challenge.district ? `${challenge.district} District` : 'Municipal Jurisdiction'}
          </p>
          <p className="text-xs text-[#545f72] mt-0.5">
            {challenge.submitted_on_behalf_of
              ? `On behalf of: ${challenge.submitted_on_behalf_of}`
              : `Submitter: ${challenge.submitter_type.replace(/_/g, ' ')}`}
          </p>
        </div>

        {/* Affected Infrastructure */}
        <div className="bg-[#f7f9fb] p-3 rounded-lg border border-[#E2E8F0]/80">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#545f72] mb-1">
            <span className="material-symbols-outlined text-base text-[#001e40]">account_tree</span>
            <span>Affected Public Asset</span>
          </div>
          <p className="text-sm font-medium text-[#191c1e] truncate" title={insights.infrastructureType}>
            {insights.infrastructureType}
          </p>
          <p className="text-xs text-[#059669] font-medium mt-0.5">
            Est. Reach: {insights.estimatedBeneficiaries}
          </p>
        </div>

        {/* Reported Timestamp & Urgency */}
        <div className="bg-[#f7f9fb] p-3 rounded-lg border border-[#E2E8F0]/80 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#545f72] mb-1">
            <span className="material-symbols-outlined text-base text-[#001e40]">schedule</span>
            <span>Reported Timestamp</span>
          </div>
          <p className="text-sm font-medium text-[#191c1e]">
            {formattedDate} {relativeTime && <span className="text-xs text-[#545f72]">({relativeTime})</span>}
          </p>
          <p className="text-xs text-[#545f72] mt-0.5 truncate" title={insights.urgencyReason}>
            {insights.urgencyReason}
          </p>
        </div>
      </div>

      {/* Category Domain & Keywords */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-semibold text-[#545f72]">Domain &amp; Classification Tags:</span>
        <Badge variant="default" label={challenge.domain} />
        {challenge.tags && challenge.tags.map((tag, idx) => (
          <Badge key={idx} variant="neutral" label={`#${tag}`} />
        ))}
      </div>

      {/* Optional Attachment Image Preview */}
      {challenge.image_url && (
        <div className="pt-2 border-t border-[#E2E8F0]">
          <p className="text-xs font-semibold text-[#545f72] mb-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">photo_camera</span>
            <span>Reported Visual Evidence:</span>
          </p>
          <div className="relative w-full max-w-sm h-48 rounded-lg overflow-hidden border border-[#E2E8F0] bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={challenge.image_url}
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
