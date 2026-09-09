'use client';

import { useState, useTransition } from 'react';

interface GroundAuditModalProps {
  complaintId: string;
  complaintTitle: string;
  orgName?: string;
  onAuditComplete?: () => void;
}

export function GroundAuditModal({
  complaintId,
  complaintTitle,
  orgName = 'Community Organization',
  onAuditComplete,
}: GroundAuditModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [verdict, setVerdict] = useState<'verified_solid' | 'flagged_substandard' | 'fake_completion'>('verified_solid');
  const [rating, setRating] = useState<number>(5);
  const [debrisCleared, setDebrisCleared] = useState(true);
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const [resultMsg, setResultMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = () => {
    if (notes.trim().length < 5) {
      setResultMsg({ type: 'err', text: 'Please enter at least 5 characters of inspection notes.' });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/ngo/ground-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            complaint_id: complaintId,
            audit_verdict: verdict,
            quality_rating: rating,
            debris_cleared: debrisCleared,
            notes,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit ground audit');

        setResultMsg({ type: 'ok', text: data.message });
        setTimeout(() => {
          setIsOpen(false);
          setResultMsg(null);
          onAuditComplete?.();
        }, 1500);
      } catch (err) {
        setResultMsg({
          type: 'err',
          text: err instanceof Error ? err.message : 'Error submitting ground audit',
        });
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00695c] hover:bg-[#004d40] text-white flex items-center gap-1.5 shadow-xs transition-colors"
        title="Conduct independent ground inspection as Citizen Ombudsman"
      >
        <span className="material-symbols-outlined text-sm">fact_check</span>
        <span>Ground Audit</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-[#002147] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-300 text-lg">
                    verified_user
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Citizen Ombudsman Ground Audit</h3>
                  <p className="text-[11px] text-slate-300 truncate max-w-xs">{complaintTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Physical Ground Verdict *
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'verified_solid',
                      label: '✓ Verified Solid Work',
                      desc: 'Work is physically complete, properly engineered, and safe for citizens.',
                      color: 'border-emerald-300 bg-emerald-50/70 text-emerald-900',
                    },
                    {
                      id: 'flagged_substandard',
                      label: '⚠ Substandard Workmanship',
                      desc: 'Temporary patch or poor quality that will likely wash away or fail soon.',
                      color: 'border-amber-300 bg-amber-50/70 text-amber-900',
                    },
                    {
                      id: 'fake_completion',
                      label: '✖ Fake Completion / Unresolved',
                      desc: 'Photo was manipulated or taken at wrong spot; problem remains dangerous.',
                      color: 'border-red-300 bg-red-50/70 text-red-900',
                    },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        verdict === opt.id ? `${opt.color} ring-2 ring-slate-800/10 shadow-xs font-semibold` : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="audit_verdict"
                        checked={verdict === opt.id}
                        onChange={() => {
                          setVerdict(opt.id as typeof verdict);
                          if (opt.id === 'fake_completion') setRating(1);
                          else if (opt.id === 'flagged_substandard') setRating(2);
                          else setRating(5);
                        }}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-xs font-bold">{opt.label}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quality rating */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Work Quality Rating ({rating} / 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        rating >= star
                          ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-300'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Debris checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={debrisCleared}
                  onChange={(e) => setDebrisCleared(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Site Cleanliness: Broken rubble and trash were completely cleared</span>
              </label>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Inspection Observation &amp; Sign-off Notes *
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Visited site at 10 AM. Asphalt roller compaction is smooth and curb stones are intact. No leftover gravel."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#002147] resize-none"
                />
              </div>

              {resultMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    resultMsg.type === 'ok'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-red-50 text-red-800 border border-red-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {resultMsg.type === 'ok' ? 'check_circle' : 'error'}
                  </span>
                  <span>{resultMsg.text}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                Audited as: <strong>{orgName}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#00695c] hover:bg-[#004d40] rounded-xl flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isPending ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-sm">send</span>
                  )}
                  <span>Submit Ground Audit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
