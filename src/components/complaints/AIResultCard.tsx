'use client';

import type { AIAnalysisResult } from '@/types/ai';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import type { ComplaintSeverity } from '@/types/complaint';
import type { TranslationKey } from '@/lib/translations';

interface AIResultCardProps {
  result: AIAnalysisResult;
  onAccept: () => void;
  onEdit: () => void;
}

const confidenceColor = (score: number): string => {
  if (score >= 0.8) return 'text-[#059669]';
  if (score >= 0.5) return 'text-[#D97706]';
  return 'text-[#DC2626]';
};

export function AIResultCard({ result, onAccept, onEdit }: AIResultCardProps) {
  const { t } = useLanguage();
  const confidencePct = Math.round(result.confidence_score * 100);
  const issueName = t(result.issue_type as TranslationKey) || result.issue_type.replace(/_/g, ' ');

  return (
    <div className="border border-[#7C3AED]/30 bg-[#faf8ff] rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-[#7C3AED] text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-[#7C3AED]">
          {t('ai_analysis')}
        </span>
        <span className={['ml-auto text-sm font-semibold', confidenceColor(result.confidence_score)].join(' ')}>
          {confidencePct}% {t('confident')}
        </span>
      </div>

      {/* Confidence bar */}
      <div className="w-full h-1.5 bg-[#e0e3e5] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#7C3AED] rounded-full transition-all duration-500"
          style={{ width: `${confidencePct}%` }}
        />
      </div>

      {/* Classification */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-1">
            {t('issue_type_label')}
          </p>
          <p className="text-sm text-[#191c1e] font-medium capitalize">
            {issueName}
          </p>
          {result.subcategory && (
            <p className="text-xs text-[#545f72] mt-0.5 capitalize">
              {result.subcategory}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-1">
            {t('severity_label')}
          </p>
          <Badge variant={result.severity as ComplaintSeverity} />
        </div>
        <div className="col-span-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-1">
            {t('department')}
          </p>
          <p className="text-sm text-[#191c1e]">{result.suggested_department}</p>
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-1">
          {t('ai_description')}
        </p>
        <p className="text-sm text-[#191c1e] leading-relaxed">{result.description_en}</p>
        {result.description_hi && (
          <p className="text-sm text-[#545f72] mt-1 leading-relaxed">{result.description_hi}</p>
        )}
      </div>

      {/* Tags */}
      {result.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-[#ede9fe] text-[#7C3AED] rounded-full border border-[#7C3AED]/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Urgency reason */}
      {result.urgency_reason && (
        <p className="text-xs text-[#545f72] italic border-l-2 border-[#7C3AED]/30 pl-2">
          {result.urgency_reason}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onAccept}
          className="flex-1 py-2.5 bg-[#001e40] text-white text-sm font-semibold rounded-lg
                     hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">check</span>
          {t('looks_correct')}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="px-4 py-2.5 border border-[#001e40] text-[#001e40] text-sm font-medium
                     rounded-lg hover:bg-[#f7f9fb] transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">edit</span>
          {t('edit_btn')}
        </button>
      </div>
    </div>
  );
}
