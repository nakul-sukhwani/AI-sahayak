'use client';

import { useLanguage } from '@/context/LanguageContext';
import { ComplaintForm } from '@/components/complaints/ComplaintForm';

export default function NewComplaintPage() {
  const { t } = useLanguage();

  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#191c1e] tracking-tight">
          {t('report_issue_title')}
        </h1>
        <p className="text-sm text-[#545f72] mt-1">
          {t('report_issue_subtitle')}
        </p>
      </div>
      <ComplaintForm />
    </div>
  );
}
