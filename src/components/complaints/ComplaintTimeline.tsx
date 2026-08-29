'use client';

import type { ComplaintStatus } from '@/types/complaint';
import { STATUS_LABELS, STATUS_ICONS, STATUS_ORDER } from '@/constants/statuses';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKey } from '@/lib/translations';

interface TimelineEvent {
  status: ComplaintStatus;
  timestamp: string | null;
  actor?: string | null;
}

interface ComplaintTimelineProps {
  currentStatus: ComplaintStatus;
  events?: TimelineEvent[];
}

export function ComplaintTimeline({ currentStatus, events = [] }: ComplaintTimelineProps) {
  const { t } = useLanguage();
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  const getStepState = (status: ComplaintStatus) => {
    const stepIndex = STATUS_ORDER.indexOf(status);
    if (currentStatus === 'rejected') return stepIndex === currentIndex ? 'rejected' : 'pending';
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getEvent = (status: ComplaintStatus) =>
    events.find((e) => e.status === status) ?? null;

  const displaySteps = currentStatus === 'rejected'
    ? [...STATUS_ORDER.slice(0, currentIndex), 'rejected' as ComplaintStatus]
    : STATUS_ORDER;

  return (
    <div className="flex flex-col gap-0">
      {displaySteps.map((status, i) => {
        const state = getStepState(status);
        const event = getEvent(status);
        const isLast = i === displaySteps.length - 1;
        const statusLabel = t(status as TranslationKey) || STATUS_LABELS[status] || status;

        return (
          <div key={status} className="flex gap-3">
            {/* Line + circle */}
            <div className="flex flex-col items-center">
              <div className={[
                'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 z-10',
                state === 'done'     ? 'bg-[#059669] border-[#059669]' :
                state === 'active'   ? 'bg-[#001e40] border-[#001e40]' :
                state === 'rejected' ? 'bg-[#DC2626] border-[#DC2626]' :
                                       'bg-white border-[#E2E8F0]',
              ].join(' ')}>
                {state === 'done' ? (
                  <span className="material-symbols-outlined text-white text-xs">check</span>
                ) : state === 'active' ? (
                  <span className="material-symbols-outlined text-white text-xs">{STATUS_ICONS[status]}</span>
                ) : state === 'rejected' ? (
                  <span className="material-symbols-outlined text-white text-xs">close</span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c3c6d1]" />
                )}
              </div>
              {!isLast && (
                <div className={['w-0.5 flex-1 my-0.5', state === 'done' ? 'bg-[#059669]' : 'bg-[#E2E8F0]'].join(' ')} />
              )}
            </div>

            {/* Content */}
            <div className={['pb-4 flex-1', isLast ? '' : ''].join('')}>
              <p className={[
                'text-sm font-medium',
                state === 'pending' ? 'text-[#737780]' : 'text-[#191c1e]',
              ].join(' ')}>
                {statusLabel}
              </p>
              {event?.timestamp && (
                <p className="text-xs text-[#545f72] mt-0.5">
                  {new Date(event.timestamp).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                  {event.actor && ` · ${event.actor}`}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
