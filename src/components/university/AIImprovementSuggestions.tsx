'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { generateImprovementSuggestions } from '@/lib/university-heuristics';

interface ChallengeData {
  title: string;
  description: string;
  domain: string;
  tags: string[];
}

interface AIImprovementSuggestionsProps {
  challenge: ChallengeData;
  className?: string;
}

export function AIImprovementSuggestions({ challenge, className = '' }: AIImprovementSuggestionsProps) {
  const suggestions = useMemo(() => generateImprovementSuggestions(challenge), [challenge]);

  return (
    <div className={['border border-[#7C3AED]/30 bg-[#faf8ff] rounded-xl p-5 space-y-4 shadow-sm', className].join(' ')}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#7C3AED]/20 pb-3">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[#7C3AED] text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <div>
            <h4 className="text-sm font-bold text-[#191c1e] tracking-tight">
              Recommended Improvement Actions
            </h4>
            <p className="text-xs text-[#545f72]">
              AI-generated civic engineering heuristics &amp; technical resolution roadmap
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="ai"
            label={`Feasibility: ${suggestions.feasibilityScore}%`}
          />
          <Badge
            variant="neutral"
            label={`⏱ ${suggestions.timeframe}`}
          />
        </div>
      </div>

      {/* Primary Technical Approach Title & Summary */}
      <div className="bg-white/80 border border-[#7C3AED]/15 rounded-lg p-3.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7C3AED] uppercase tracking-wider mb-1">
          <span className="material-symbols-outlined text-sm">engineering</span>
          <span>Core Engineering Strategy</span>
        </div>
        <h5 className="text-sm font-bold text-[#191c1e] mb-1">
          {suggestions.approachTitle}
        </h5>
        <p className="text-xs text-[#545f72] leading-relaxed">
          {suggestions.summary}
        </p>
      </div>

      {/* Actionable Resolution Steps */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#43474f] flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-[#7C3AED]">task_alt</span>
          <span>Actionable Engineering Steps</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {suggestions.actionSteps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 bg-white p-3 rounded-lg border border-[#E2E8F0] text-xs text-[#191c1e]"
            >
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-[#ede9fe] text-[#7C3AED] font-bold text-[11px]">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Impact & Academic Focus Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-[#7C3AED]/20">
        <div className="flex items-start gap-2 bg-[#f0fdf4] border border-[#bbf7d0] p-2.5 rounded-lg">
          <span className="material-symbols-outlined text-[#059669] text-base mt-0.5">verified</span>
          <div>
            <p className="text-xs font-semibold text-[#059669]">Projected Civic Impact</p>
            <p className="text-xs text-[#166534] mt-0.5">{suggestions.estimatedImpact}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 bg-[#fdf4ff] border border-[#f5d0fe] p-2.5 rounded-lg">
          <span className="material-symbols-outlined text-[#a21caf] text-base mt-0.5">school</span>
          <div>
            <p className="text-xs font-semibold text-[#a21caf]">University Research Focus</p>
            <p className="text-xs text-[#701a75] mt-0.5">{suggestions.researchFocus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
