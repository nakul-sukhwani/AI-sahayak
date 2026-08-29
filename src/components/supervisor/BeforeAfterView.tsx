'use client';

import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/context/LanguageContext';

interface BeforeAfterViewProps {
  beforeUrl: string | null;
  afterUrl: string | null;
  aiVerified: boolean | null;
  aiConfidence: number | null;
  aiObservation: string | null;
  damageType?: string | null;
  workerIssues?: string | null;
  toolsRequired?: string[] | null;
  capturedLatitude?: number | null;
  capturedLongitude?: number | null;
  capturedAt?: string | null;
  complaintLatitude?: number | null;
  complaintLongitude?: number | null;
  complaintCreatedAt?: string | null;
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function BeforeAfterView({
  beforeUrl,
  afterUrl,
  aiVerified,
  aiConfidence,
  aiObservation,
  damageType,
  workerIssues,
  toolsRequired,
  capturedLatitude,
  capturedLongitude,
  capturedAt,
  complaintLatitude,
  complaintLongitude,
  complaintCreatedAt,
}: BeforeAfterViewProps) {
  const { t } = useLanguage();
  const distance =
    capturedLatitude && capturedLongitude && complaintLatitude && complaintLongitude
      ? getDistanceMeters(complaintLatitude, complaintLongitude, capturedLatitude, capturedLongitude)
      : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Before / After Photo Comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-1">{t('before_complaint')}</p>
          {beforeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={beforeUrl} alt="Before" className="w-full aspect-square object-cover rounded-lg border border-[#E2E8F0]" />
          ) : (
            <div className="w-full aspect-square bg-[#f2f4f6] rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#c3c6d1]">
              <span className="material-symbols-outlined text-3xl">image_not_supported</span>
            </div>
          )}
          {complaintCreatedAt && (
            <p className="text-[11px] text-[#545f72] mt-1 truncate">🕒 {t('filed_label')}: {new Date(complaintCreatedAt).toLocaleString('en-IN', { hour12: true })}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#43474f] mb-1">{t('after_resolution')}</p>
          {afterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={afterUrl} alt="After" className="w-full aspect-square object-cover rounded-lg border border-[#E2E8F0]" />
          ) : (
            <div className="w-full aspect-square bg-[#f2f4f6] rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#c3c6d1]">
              <span className="material-symbols-outlined text-3xl">image_not_supported</span>
            </div>
          )}
          {capturedAt && (
            <p className="text-[11px] text-[#545f72] mt-1 truncate">🕒 {t('captured_label')}: {new Date(capturedAt).toLocaleString('en-IN', { hour12: true })}</p>
          )}
        </div>
      </div>

      {/* Worker Job Report & Tamper Inspection */}
      {(damageType || capturedLatitude || capturedAt) && (
        <div className="bg-[#f7f9fb] p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col gap-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#43474f]">{t('worker_report_geo')}</span>
            {damageType && (
              <Badge
                variant="neutral"
                label={damageType}
                className={`px-3 py-1 text-xs font-semibold shadow-sm ${aiVerified === true ? 'bg-[#d1fae5] text-[#059669] border border-[#059669]/30' : aiVerified === false ? 'bg-[#fee2e2] text-[#DC2626] border border-[#DC2626]/30' : 'bg-[#ede9fe] text-[#7C3AED] border border-[#7C3AED]/30'}`}
              />
            )}
          </div>
          {capturedLatitude && capturedLongitude && (
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-1 border-t border-[#E2E8F0]/60">
              <a href={`https://www.google.com/maps?q=${capturedLatitude},${capturedLongitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#1d4ed8] hover:underline">
                📍 {t('view_captured_location')} ({capturedLatitude.toFixed(4)}, {capturedLongitude.toFixed(4)})
              </a>
              {distance !== null && (
                <Badge
                  variant={distance <= 300 ? 'resolved' : 'high'}
                  label={distance <= 300 ? `✓ ${t('onsite_pin')} (${distance}m)` : `⚠️ ${t('discrepancy')} (${distance > 1000 ? `${(distance / 1000).toFixed(1)}km` : `${distance}m`})`}
                  className="text-[11px] font-medium"
                />
              )}
            </div>
          )}
          {workerIssues && (
            <p className="text-xs text-[#545f72]"><span className="font-medium text-[#191c1e]">{t('observation')}:</span> {workerIssues}</p>
          )}
          {toolsRequired && toolsRequired.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-[#545f72] font-medium">{t('tools')}:</span>
              {toolsRequired.map((tool, idx) => (
                <span key={idx} className="inline-block px-2 py-0.5 text-[11px] bg-white border border-[#E2E8F0] rounded text-[#43474f]">{tool}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Verdict */}
      {aiVerified !== null && (
        <div className={`p-4 rounded-xl border ${aiVerified ? 'bg-[#d1fae5] border-[#059669]/30' : 'bg-[#fee2e2] border-[#DC2626]/30'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className={`material-symbols-outlined ${aiVerified ? 'text-[#059669]' : 'text-[#DC2626]'}`} style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <p className={`text-sm font-bold uppercase tracking-widest ${aiVerified ? 'text-[#059669]' : 'text-[#DC2626]'}`}>{t('ai_verdict')}: {aiVerified ? t('resolved') : t('issues_remain')}</p>
            </div>
            {aiConfidence !== null && (
              <span className={`text-xs font-semibold ${aiVerified ? 'text-[#059669]' : 'text-[#DC2626]'}`}>{Math.round(aiConfidence * 100)}% {t('confident')}</span>
            )}
          </div>
          {aiObservation && (
            <p className={`text-sm leading-relaxed ${aiVerified ? 'text-[#065f46]' : 'text-[#991b1b]'}`}>{aiObservation}</p>
          )}
        </div>
      )}
    </div>
  );
}
