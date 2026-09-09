'use client';

import { useState, useTransition } from 'react';

interface StatutoryWarningButtonProps {
  complaintId: string;
  daysOpen: number;
  initialHasWarning?: boolean;
  warningDate?: string | null;
  orgName?: string;
  variant?: 'banner' | 'card';
}

export function StatutoryWarningButton({
  complaintId,
  daysOpen,
  initialHasWarning = false,
  warningDate: initialWarningDate = null,
  orgName = 'Bangalore Civic Action Alliance',
  variant = 'banner',
}: StatutoryWarningButtonProps) {
  const [hasWarning, setHasWarning] = useState(initialHasWarning);
  const [warningDate, setWarningDate] = useState<string | null>(initialWarningDate);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleIssueWarning = () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/ngo/advocacy-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: 'statutory_warning',
            complaint_id: complaintId,
            sender_org: orgName,
            urgency_level: 'statutory_demand',
            message: `Statutory Section 6(1) Notice & Section 20(1) Officer Penalty Warning: Complaint #${complaintId.slice(0, 8)} is ${daysOpen} days overdue. Civil Society organization "${orgName}" has triggered statutory administrative escalation. 72-hour joint site inspection and contractor accountability demanded.`,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to dispatch warning to admin');

        const nowStr = new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

        setHasWarning(true);
        setWarningDate(nowStr);
        setToast({
          type: 'ok',
          text: `🚨 Statutory Warning dispatched to Municipal Admin Portal! 72-hour penalty clock recorded on civic docket.`,
        });

        setTimeout(() => setToast(null), 5000);
      } catch (err) {
        setToast({
          type: 'err',
          text: err instanceof Error ? err.message : 'Failed to issue statutory warning.',
        });
        setTimeout(() => setToast(null), 5000);
      }
    });
  };

  return (
    <div className="relative inline-flex items-center">
      {hasWarning ? (
        <div className="px-3.5 py-2 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
          <span className="material-symbols-outlined text-sm text-amber-700">warning</span>
          <span>
            Admin Warned (72h Clock Active) · {warningDate || 'Active'}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleIssueWarning}
          disabled={isPending}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-60 ${
            variant === 'banner'
              ? 'bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-700 hover:to-rose-800'
              : 'bg-red-700 hover:bg-red-800'
          }`}
          title="Send statutory administrative warning directly to the Municipal Admin Portal"
        >
          {isPending ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Dispatching Warning to Admin…</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">notifications_active</span>
              <span>Issue Warning to Municipal Admin</span>
            </>
          )}
        </button>
      )}

      {/* Floating Notification Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 border ${
            toast.type === 'ok'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-red-900 text-white border-red-700'
          }`}
        >
          <span className="material-symbols-outlined text-base text-amber-400">
            {toast.type === 'ok' ? 'gavel' : 'error'}
          </span>
          <span className="max-w-sm">{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
