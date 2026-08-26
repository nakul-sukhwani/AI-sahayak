import { Badge } from '@/components/ui/Badge';

interface BeforeAfterViewProps {
  beforeUrl: string | null;
  afterUrl: string | null;
  aiVerified: boolean | null;
  aiConfidence: number | null;
  aiObservation: string | null;
}

export function BeforeAfterView({
  beforeUrl,
  afterUrl,
  aiVerified,
  aiConfidence,
  aiObservation,
}: BeforeAfterViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-1">Before (Complaint)</p>
          {beforeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={beforeUrl} alt="Before" className="w-full aspect-square object-cover rounded-lg border border-[#E2E8F0]" />
          ) : (
            <div className="w-full aspect-square bg-[#f2f4f6] rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#c3c6d1]">
              <span className="material-symbols-outlined text-3xl">image_not_supported</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-1">After (Resolution)</p>
          {afterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={afterUrl} alt="After" className="w-full aspect-square object-cover rounded-lg border border-[#E2E8F0]" />
          ) : (
            <div className="w-full aspect-square bg-[#f2f4f6] rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#c3c6d1]">
              <span className="material-symbols-outlined text-3xl">image_not_supported</span>
            </div>
          )}
        </div>
      </div>

      {aiVerified !== null && (
        <div className={`p-4 rounded-xl border ${aiVerified ? 'bg-[#d1fae5] border-[#059669]/30' : 'bg-[#fee2e2] border-[#DC2626]/30'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className={`material-symbols-outlined ${aiVerified ? 'text-[#059669]' : 'text-[#DC2626]'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <p className={`text-sm font-bold uppercase tracking-widest ${aiVerified ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                AI Verdict: {aiVerified ? 'Resolved' : 'Issues Remain'}
              </p>
            </div>
            {aiConfidence !== null && (
              <span className={`text-xs font-semibold ${aiVerified ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                {Math.round(aiConfidence * 100)}% Confident
              </span>
            )}
          </div>
          {aiObservation && (
            <p className={`text-sm leading-relaxed ${aiVerified ? 'text-[#065f46]' : 'text-[#991b1b]'}`}>
              {aiObservation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
