'use client';

import { useState } from 'react';

const JHARKHAND_DISTRICTS = [
  'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka',
  'East Singhbhum', 'Garhwa', 'Giridih', 'Godda', 'Gumla',
  'Hazaribagh', 'Jamtara', 'Khunti', 'Koderma', 'Latehar',
  'Lohardaga', 'Pakur', 'Palamu', 'Ramgarh', 'Ranchi',
  'Sahebganj', 'Saraikela Kharsawan', 'Simdega', 'West Singhbhum',
];

const ADDRESSEES = [
  { label: 'District Collector',                  value: 'District Collector' },
  { label: 'Sub-Divisional Magistrate (SDM)',      value: 'Sub-Divisional Magistrate' },
  { label: 'Block Development Officer (BDO)',      value: 'Block Development Officer' },
  { label: 'Municipal Corporation Commissioner',   value: 'Municipal Corporation Commissioner' },
  { label: 'Chief Minister, Jharkhand',            value: 'Chief Minister' },
];

interface Props {
  complaintId: string;
  complaintTitle: string;
  daysOpen: number;
}

export function NGOLetterModal({ complaintId, complaintTitle, daysOpen }: Props) {
  const [open, setOpen]           = useState(false);
  const [district, setDistrict]   = useState('Ranchi');
  const [addressee, setAddressee] = useState(ADDRESSEES[0].value);
  const [deadline, setDeadline]   = useState(7);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        id:       complaintId,
        district,
        addressee,
        deadline: deadline.toString(),
      });
      const res = await fetch(`/api/ngo/generate-letter?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Letter generation failed.');
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `ngo-letter-${complaintId.slice(0, 8)}-${district.replace(/\s/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#001e40] text-white text-xs font-semibold rounded-lg hover:bg-[#002a5c] transition-colors"
      >
        <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
        Generate Letter
      </button>

      {/* Modal Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#001e40] px-6 py-4 flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Generate Accountability Letter</h2>
                <p className="text-xs text-[#93c5fd] mt-0.5">Formal letter to Jharkhand Government</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white transition-colors ml-4"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Complaint Info Banner */}
            <div className="px-6 py-3 bg-[#fef3c7] border-b border-[#fde68a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#d97706] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                schedule
              </span>
              <p className="text-xs font-medium text-[#92400e] truncate">
                {complaintTitle} — <strong>{daysOpen} days</strong> overdue
              </p>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">

              {/* Date (dynamic, read-only) */}
              <div>
                <label className="block text-xs font-semibold text-[#545f72] uppercase tracking-wide mb-1.5">
                  Letter Date
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-[#f8fafc] border border-[#E2E8F0] rounded-xl text-sm text-[#191c1e]">
                  <span className="material-symbols-outlined text-base text-[#94a3b8]">calendar_today</span>
                  {today}
                  <span className="ml-auto text-xs text-[#94a3b8] italic">Auto-set to today</span>
                </div>
              </div>

              {/* Addressee */}
              <div>
                <label className="block text-xs font-semibold text-[#545f72] uppercase tracking-wide mb-1.5">
                  Addressed To
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-base text-[#94a3b8]">
                    person_pin
                  </span>
                  <select
                    value={addressee}
                    onChange={(e) => setAddressee(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#191c1e] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
                  >
                    {ADDRESSEES.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-semibold text-[#545f72] uppercase tracking-wide mb-1.5">
                  District (Jharkhand)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-base text-[#94a3b8]">
                    location_on
                  </span>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-[#191c1e] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
                  >
                    {JHARKHAND_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resolution Deadline */}
              <div>
                <label className="block text-xs font-semibold text-[#545f72] uppercase tracking-wide mb-1.5">
                  Resolution Deadline Demanded
                </label>
                <div className="flex items-center gap-3">
                  {[3, 7, 14, 30].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDeadline(d)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        deadline === d
                          ? 'bg-[#001e40] text-white border-[#001e40]'
                          : 'bg-white text-[#545f72] border-[#E2E8F0] hover:border-[#001e40]'
                      }`}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
              </div>

              {/* Letter Preview Summary */}
              <div className="bg-[#f8fafc] border border-[#E2E8F0] rounded-xl p-4 text-xs text-[#545f72] space-y-1">
                <p className="font-semibold text-[#191c1e] mb-2">Letter Preview</p>
                <p><span className="font-medium text-[#191c1e]">To:</span> The {addressee}, District {district}, Jharkhand</p>
                <p><span className="font-medium text-[#191c1e]">Subject:</span> Unresolved civic issue — {daysOpen} days overdue</p>
                <p><span className="font-medium text-[#191c1e]">Demand:</span> Resolution within <strong>{deadline} days</strong></p>
                <p><span className="font-medium text-[#191c1e]">Includes:</span> Before/after photos, AI verification findings</p>
                <p><span className="font-medium text-[#191c1e]">Escalation:</span> Jharkhand State Human Rights Commission</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-[#fee2e2] text-[#dc2626] text-sm px-3 py-2 rounded-lg">
                  <span className="material-symbols-outlined text-base">error</span>
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#545f72] hover:bg-[#f8fafc] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 py-2.5 bg-[#001e40] text-white rounded-xl text-sm font-semibold hover:bg-[#002a5c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                    Download Letter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
