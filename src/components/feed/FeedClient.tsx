'use client';

import { useLanguage } from '@/context/LanguageContext';
import { ComplaintCard } from '@/components/complaints/ComplaintCard';
import type { Complaint } from '@/types/complaint';

interface FeedClientProps {
  feed: Complaint[];
}

export function FeedClient({ feed }: FeedClientProps) {
  const { t } = useLanguage();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#191c1e] tracking-tight">{t('public_feed')}</h1>
        <p className="text-sm text-[#545f72] mt-1">{t('public_feed_subtitle')}</p>
      </div>

      {feed.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-[#c3c6d1]">public_off</span>
          <div>
            <p className="text-base font-medium text-[#191c1e]">{t('no_complaints')}</p>
            <p className="text-sm text-[#545f72] mt-1">{t('start_first_issue')}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {feed.map((c) => (
            <ComplaintCard key={c.id} complaint={c} />
          ))}
        </div>
      )}
    </div>
  );
}
