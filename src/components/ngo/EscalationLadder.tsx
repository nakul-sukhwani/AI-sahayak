'use client';

import { useState } from 'react';
import { NGOAdvocacyModal } from '@/components/ngo/NGOAdvocacyModal';
import { NGOLetterModal } from '@/components/ngo/NGOLetterModal';
import { CSRAdoptModal } from '@/components/ngo/CSRAdoptModal';

interface EscalationLadderProps {
  complaintId: string;
  complaintTitle: string;
  daysOpen: number;
  orgName?: string;
}

export function EscalationLadder({
  complaintId,
  complaintTitle,
  daysOpen,
  orgName = 'Civic Organization',
}: EscalationLadderProps) {
  const [showLadder, setShowLadder] = useState(false);

  // Determine current statutory stage
  const currentStage = daysOpen >= 14 ? 3 : daysOpen >= 7 ? 2 : 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              currentStage === 3
                ? 'bg-red-100 text-red-800 border border-red-200'
                : currentStage === 2
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}
          >
            Escalation Stage {currentStage} of 3
          </span>

          <button
            type="button"
            onClick={() => setShowLadder(!showLadder)}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline flex items-center gap-0.5"
          >
            <span>{showLadder ? 'Hide Ladder' : 'View Ladder'}</span>
            <span className="material-symbols-outlined text-xs">
              {showLadder ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {/* Action button cluster */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <CSRAdoptModal
            complaintId={complaintId}
            complaintTitle={complaintTitle}
            daysOpen={daysOpen}
            orgName={orgName}
          />
          <NGOAdvocacyModal
            complaintId={complaintId}
            complaintTitle={complaintTitle}
            daysOpen={daysOpen}
            orgName={orgName}
          />
          <NGOLetterModal
            complaintId={complaintId}
            complaintTitle={complaintTitle}
            daysOpen={daysOpen}
          />
        </div>
      </div>

      {/* Visual Escalation Ladder Steps */}
      {showLadder && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in">
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
            <div
              className={`p-2 rounded-lg border ${
                currentStage >= 1
                  ? 'bg-blue-50 border-blue-300 text-blue-900 ring-1 ring-blue-300/30'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <p className="uppercase text-[9px] tracking-wider text-slate-500">Stage 1</p>
              <p className="mt-0.5">Junior Eng. Notice</p>
              <span className="text-[9px] font-normal text-slate-500">Day 1–7</span>
            </div>

            <div
              className={`p-2 rounded-lg border ${
                currentStage >= 2
                  ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-300/30'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <p className="uppercase text-[9px] tracking-wider text-slate-500">Stage 2</p>
              <p className="mt-0.5">Exec. Summons</p>
              <span className="text-[9px] font-normal text-slate-500">Day 8–14</span>
            </div>

            <div
              className={`p-2 rounded-lg border ${
                currentStage >= 3
                  ? 'bg-red-50 border-red-300 text-red-900 ring-1 ring-red-300/30'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <p className="uppercase text-[9px] tracking-wider text-slate-500">Stage 3</p>
              <p className="mt-0.5">Section 6 RTI &amp; Lokayukta</p>
              <span className="text-[9px] font-normal text-slate-500">Day 15+</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 leading-snug">
            {currentStage === 3
              ? 'This issue is critically overdue. Municipal officers are subject to Section 20(1) delay penalties. Click "RTI & Legal" to download the formal statutory petition.'
              : currentStage === 2
              ? 'Issue has breached the 7-day Citizen Charter SLA. Click "Outreach & Admin" to issue an Administrative Summons demanding a 72-hour joint inspection.'
              : 'Issue is within standard municipal triage period. Routine tracking active.'}
          </p>
        </div>
      )}
    </div>
  );
}
