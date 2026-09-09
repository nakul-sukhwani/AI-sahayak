'use client';

import { useState, useTransition } from 'react';

interface CSRAdoptModalProps {
  complaintId: string;
  complaintTitle: string;
  daysOpen: number;
  orgName?: string;
  onAdoptComplete?: () => void;
}

export function CSRAdoptModal({
  complaintId,
  complaintTitle,
  daysOpen,
  orgName = 'Civic Organization',
  onAdoptComplete,
}: CSRAdoptModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [adoptionType, setAdoptionType] = useState<'csr_grant' | 'community_crowdfund' | 'rwa_volunteer_crew'>('csr_grant');
  const [sponsorName, setSponsorName] = useState(orgName);
  const [budget, setBudget] = useState<number>(8500);
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notes.trim().length < 5) {
      setMsg({ type: 'err', text: 'Please enter at least 5 characters of deployment plan notes.' });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/ngo/adopt-issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            complaint_id: complaintId,
            estimated_budget_inr: budget,
            sponsor_name: sponsorName,
            adoption_type: adoptionType,
            notes,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to adopt issue');

        setMsg({ type: 'ok', text: data.message });
        setTimeout(() => {
          setIsOpen(false);
          setMsg(null);
          onAdoptComplete?.();
        }, 1500);
      } catch (err) {
        setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error adopting issue' });
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
        title="Bypass government delays: Adopt with CSR funds or community resources"
      >
        <span className="material-symbols-outlined text-sm">handshake</span>
        <span>Adopt &amp; Fund</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl">volunteer_activism</span>
                <div>
                  <h3 className="text-sm font-bold">Community &amp; CSR Issue Adoption</h3>
                  <p className="text-[11px] text-amber-200">
                    Bypassing municipal tender delays (Open {daysOpen} days)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <p className="text-xs font-bold text-slate-800 mb-1">Issue to Adopt:</p>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                  {complaintTitle}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Funding &amp; Resource Model *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'csr_grant', label: 'Corporate CSR Grant', icon: 'corporate_fare' },
                    { id: 'community_crowdfund', label: 'Local Crowdfund', icon: 'savings' },
                    { id: 'rwa_volunteer_crew', label: 'RWA / Shramdaan', icon: 'handyman' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAdoptionType(opt.id as typeof adoptionType)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        adoptionType === opt.id
                          ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{opt.icon}</span>
                      <span className="text-[10px] leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Sponsoring Entity / RWA *
                  </label>
                  <input
                    type="text"
                    required
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    placeholder="e.g. HSR Welfare Association"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Estimated Budget (INR) *
                  </label>
                  <input
                    type="number"
                    min={500}
                    max={500000}
                    step={500}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Action Plan &amp; Contractor / Labor Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Hiring private asphalt patching mini-roller crew. Work will be executed this Saturday morning under RWA volunteer supervision."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-600 resize-none"
                />
              </div>

              {msg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    msg.type === 'ok'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-red-50 text-red-800 border border-red-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {msg.type === 'ok' ? 'check_circle' : 'error'}
                  </span>
                  <span>{msg.text}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isPending ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-sm">handshake</span>
                  )}
                  <span>Confirm Issue Adoption</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
