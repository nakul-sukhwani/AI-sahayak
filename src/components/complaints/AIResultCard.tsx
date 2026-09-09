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
    <div className="bg-gradient-to-br from-purple-50/50 via-white to-white border border-purple-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      {/* Header with confidence pill */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-[#7C3AED] shadow-sm">
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
              {t('ai_analysis') || 'Multi-Modal AI Classification'}
            </p>
            <p className="text-sm font-bold text-slate-900">
              Confidence &amp; Jurisdiction Report
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/80 border border-purple-200 text-xs font-bold text-purple-800">
          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
          <span>{confidencePct}% AI Certainty</span>
        </div>
      </div>

      {/* Confidence progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-700 shadow-sm"
          style={{ width: `${confidencePct}%` }}
        />
      </div>

      {/* Classification Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Detected Issue
          </p>
          <p className="text-sm font-bold text-slate-900 capitalize">
            {issueName}
          </p>
          {result.subcategory && (
            <p className="text-xs text-slate-500 mt-0.5 capitalize">
              {result.subcategory}
            </p>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Severity Rating
          </p>
          <div className="mt-0.5">
            <Badge variant={result.severity as ComplaintSeverity} />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Target Dept
          </p>
          <p className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">
            {result.suggested_department}
          </p>
        </div>
      </div>

      {/* Description Box */}
      <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          AI Auto-Generated Summary
        </p>
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
          {result.description_en}
        </p>
        {result.description_hi && (
          <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200 leading-relaxed font-hindi">
            {result.description_hi}
          </p>
        )}
      </div>

      {/* Tags */}
      {result.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Tags:</span>
          {result.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-semibold px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-200/60"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Urgency reason */}
      {result.urgency_reason && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs">
          <span className="material-symbols-outlined text-base text-amber-600 flex-shrink-0 mt-0.5">
            priority_high
          </span>
          <p className="italic leading-snug">{result.urgency_reason}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onAccept}
          className="flex-1 py-3 bg-[#002147] hover:bg-[#001833] text-white text-xs sm:text-sm font-bold rounded-xl
                     shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base">check_circle</span>
          {t('looks_correct') || 'Accept AI Classification'} →
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="px-4 py-3 border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold
                     rounded-xl transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base text-slate-500">edit</span>
          {t('edit_btn') || 'Modify'}
        </button>
      </div>
    </div>
  );
}
