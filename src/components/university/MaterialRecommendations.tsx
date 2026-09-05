'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { generateMaterialRecommendations } from '@/lib/university-heuristics';

interface ChallengeData {
  title: string;
  description: string;
  domain: string;
  tags: string[];
}

interface MaterialRecommendationsProps {
  challenge: ChallengeData;
  className?: string;
}

export function MaterialRecommendations({ challenge, className = '' }: MaterialRecommendationsProps) {
  const data = useMemo(() => generateMaterialRecommendations(challenge), [challenge]);

  return (
    <div className={['border border-[#E2E8F0] bg-white rounded-xl p-5 space-y-4 shadow-sm', className].join(' ')}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#001e40] text-xl">construction</span>
          <div>
            <h4 className="text-sm font-bold text-[#191c1e] tracking-tight">
              Recommended Materials &amp; Specifications
            </h4>
            <p className="text-xs text-[#545f72]">
              Standard civic engineering materials, grades, and compliance standards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="resolved" label={`Durability: ${data.durabilityRating}`} />
        </div>
      </div>

      {/* Materials List */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#43474f] flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-[#001e40]">inventory_2</span>
          <span>Required Materials &amp; Standards</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.materials.map((mat, idx) => (
            <div
              key={idx}
              className="bg-[#f7f9fb] border border-[#E2E8F0] rounded-lg p-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h5 className="text-xs font-bold text-[#191c1e]">{mat.name}</h5>
                  <Badge variant="outline" label={mat.grade} className="text-[10px] py-0 px-1.5" />
                </div>
                <p className="text-xs font-medium text-[#1d4ed8] mb-1">
                  Code: {mat.standardCode}
                </p>
                <p className="text-xs text-[#545f72] leading-relaxed mb-2">
                  {mat.specification}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0]/60 text-[11px] text-[#43474f] flex items-center gap-1">
                <span className="font-semibold text-[#001e40]">Function:</span>
                <span className="truncate" title={mat.purpose}>{mat.purpose}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Field Testing & Equipment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="bg-[#f7f9fb] p-3.5 rounded-lg border border-[#E2E8F0]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#43474f] flex items-center gap-1 mb-2">
            <span className="material-symbols-outlined text-sm text-[#001e40]">hardware</span>
            <span>Field Equipment &amp; Testing Tools</span>
          </p>
          <ul className="space-y-1.5 text-xs text-[#191c1e]">
            {data.fieldEquipment.map((eq, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="material-symbols-outlined text-xs text-[#059669] mt-0.5">check</span>
                <span>{eq}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#f7f9fb] p-3.5 rounded-lg border border-[#E2E8F0] flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#43474f] flex items-center gap-1 mb-2">
              <span className="material-symbols-outlined text-sm text-[#001e40]">policy</span>
              <span>Regulatory Standards &amp; Maintenance</span>
            </p>
            <div className="space-y-1 text-xs text-[#545f72] mb-3">
              <p>
                <strong className="text-[#191c1e]">Cycle:</strong> {data.inspectionInterval}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#E2E8F0]">
            {data.safetyStandards.map((std, idx) => (
              <Badge key={idx} variant="neutral" label={std} className="text-[10px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
