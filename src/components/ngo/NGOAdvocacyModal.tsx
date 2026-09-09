'use client';

import { useState, useEffect } from 'react';
import type { RTIPetition } from '@/lib/legal-agent';

interface NGOAdvocacyModalProps {
  complaintId: string;
  complaintTitle: string;
  daysOpen: number;
  orgName: string;
}

type TabType = 'rti' | 'citizen' | 'admin';

export function NGOAdvocacyModal({
  complaintId,
  complaintTitle,
  daysOpen,
  orgName,
}: NGOAdvocacyModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('rti');

  // RTI state
  const [petition, setPetition] = useState<RTIPetition | null>(null);
  const [loadingRTI, setLoadingRTI] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  // Outreach message states
  const [citizenMsg, setCitizenMsg] = useState(
    `Hello. ${orgName} has adopted your civic complaint (#${complaintId.slice(0, 8)}) for active monitoring. Our community legal team is following up with the ward engineer for immediate repair.`
  );
  const [adminMsg, setAdminMsg] = useState(
    `NOTICE OF STATUTORY DEFAULT: Grievance #${complaintId.slice(0, 8)} (${complaintTitle}) has exceeded the 7-day Citizen Charter SLA by ${daysOpen} days. A formal joint site inspection is demanded within 72 hours, failing which proceedings under Section 20(1) of the RTI Act 2005 and the Lokayukta Act will be initiated.`
  );
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Load RTI Petition when modal opens
  useEffect(() => {
    if (!open) return;
    let active = true;

    async function loadRTI() {
      setLoadingRTI(true);
      try {
        const res = await fetch(`/api/complaints/${complaintId}/generate-rti?orgName=${encodeURIComponent(orgName)}`);
        const data = await res.json();
        if (active && data.success && data.petition) {
          setPetition(data.petition);
        }
      } catch (e) {
        console.error('Failed to load RTI petition', e);
      } finally {
        if (active) setLoadingRTI(false);
      }
    }

    loadRTI();
    return () => { active = false; };
  }, [open, complaintId, orgName]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const url = `/api/complaints/${complaintId}/generate-rti?format=pdf&orgName=${encodeURIComponent(orgName)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `RTI-Petition-${complaintId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopyText = () => {
    if (!petition) return;
    navigator.clipboard.writeText(petition.full_legal_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendAdvocacy = async (type: 'connect_citizen' | 'connect_admin') => {
    setIsSending(true);
    setActionStatus(null);
    try {
      const msg = type === 'connect_citizen' ? citizenMsg : adminMsg;
      const res = await fetch('/api/ngo/advocacy-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: type,
          complaint_id: complaintId,
          message: msg,
          urgency_level: type === 'connect_admin' ? 'statutory_demand' : 'normal',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionStatus(data.message || 'Action executed successfully.');
      } else {
        setActionStatus(data.error || 'Failed to execute action.');
      }
    } catch {
      setActionStatus('Network error occurred.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3.5 py-1.5 bg-[#00695c] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
      >
        <span className="material-symbols-outlined text-sm">gavel</span>
        <span>AI Legal &amp; Outreach</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-[#002147] px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg text-emerald-300">account_balance</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold">Civic Legal Escalation &amp; Outreach Hub</h3>
                  <p className="text-[11px] text-white/70">
                    Ticket #{complaintId.slice(0, 8)} · Overdue by {daysOpen} days
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15 transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Tri-Party Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => { setActiveTab('rti'); setActionStatus(null); }}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'rti'
                    ? 'border-[#00695c] text-[#00695c]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-sm">description</span>
                <span>1. RTI Legal Petition</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('citizen'); setActionStatus(null); }}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'citizen'
                    ? 'border-[#00695c] text-[#00695c]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-sm">support_agent</span>
                <span>2. Connect with Citizen</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('admin'); setActionStatus(null); }}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'admin'
                    ? 'border-[#00695c] text-[#00695c]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-sm">campaign</span>
                <span>3. Connect with Admin</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Tab 1: RTI Legal Petition */}
              {activeTab === 'rti' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-lg text-[#00695c] flex-shrink-0 mt-0.5">verified</span>
                    <div>
                      <p className="font-bold">Automated Section 6(1) Right to Information (RTI) Notice</p>
                      <p className="text-[11px] text-emerald-900 mt-0.5 leading-relaxed">
                        Cites Section 20(1) penalties (Rs 250/day) and BBMP Act municipal mandates. Download as an official PDF ready for submission to the Public Information Officer.
                      </p>
                    </div>
                  </div>

                  {loadingRTI ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-2xl animate-spin text-[#00695c]">progress_activity</span>
                      <span>Drafting statutory legal application…</span>
                    </div>
                  ) : petition ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap border border-slate-800 select-all">
                        {petition.full_legal_text}
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleDownloadPdf}
                          disabled={downloadingPdf}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-[#002147] hover:bg-[#003166] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          <span>{downloadingPdf ? 'Generating PDF…' : 'Download RTI Section 6 PDF'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyText}
                          className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {copied ? 'check' : 'content_copy'}
                          </span>
                          <span>{copied ? 'Copied!' : 'Copy Draft Text'}</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Tab 2: Connect with Citizen */}
              {activeTab === 'citizen' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-lg text-blue-700 flex-shrink-0 mt-0.5">forum</span>
                    <div>
                      <p className="font-bold">Citizen Direct Support Line</p>
                      <p className="text-[11px] text-blue-900 mt-0.5 leading-relaxed">
                        Direct communication channel with the citizen who lodged this complaint. Offer community legal backing, share RTI escalation status, or coordinate site verification.
                      </p>
                    </div>
                  </div>

                  {/* Preset quick templates */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Quick Advocacy Templates
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Adopt for active municipal tracking',
                        'Offer pro-bono RTI legal representation',
                        'Request joint site photo verification',
                      ].map((tmpl) => (
                        <button
                          key={tmpl}
                          type="button"
                          onClick={() => setCitizenMsg(`Hello from ${orgName}: ${tmpl} regarding Complaint #${complaintId.slice(0, 8)}.`)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700 transition-colors"
                        >
                          + {tmpl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Message to Complainant Citizen
                    </label>
                    <textarea
                      rows={4}
                      value={citizenMsg}
                      onChange={(e) => setCitizenMsg(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#00695c] focus:ring-2 focus:ring-[#00695c]/10 resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendAdvocacy('connect_citizen')}
                    disabled={isSending || !citizenMsg.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#00695c] hover:bg-[#004d40] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    <span>{isSending ? 'Sending…' : 'Send Direct Support Notice to Citizen'}</span>
                  </button>
                </div>
              )}

              {/* Tab 3: Connect with Admin */}
              {activeTab === 'admin' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-lg text-amber-800 flex-shrink-0 mt-0.5">policy</span>
                    <div>
                      <p className="font-bold">Municipal Administration Summons Line</p>
                      <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                        Dispatch a formal administrative inquiry and joint inspection summons directly to the Ward Executive Engineer and Zonal Joint Commissioner.
                      </p>
                    </div>
                  </div>

                  {/* Preset quick templates */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Statutory Demand Templates
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Demand joint site inspection within 72h',
                        'Issue notice for default of Section 20(1) SLA',
                        'Request contractor tender & materials audit',
                      ].map((tmpl) => (
                        <button
                          key={tmpl}
                          type="button"
                          onClick={() => setAdminMsg(`OFFICIAL NOTICE: ${tmpl} for Complaint #${complaintId.slice(0, 8)} (${complaintTitle}), currently ${daysOpen} days overdue.`)}
                          className="px-2.5 py-1 rounded-lg bg-amber-100/70 hover:bg-amber-200/70 text-[11px] font-medium text-amber-900 transition-colors"
                        >
                          + {tmpl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Administrative Notice Text
                    </label>
                    <textarea
                      rows={4}
                      value={adminMsg}
                      onChange={(e) => setAdminMsg(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/10 resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendAdvocacy('connect_admin')}
                    disabled={isSending || !adminMsg.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#002147] hover:bg-[#003166] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">campaign</span>
                    <span>{isSending ? 'Filing Summons…' : 'Dispatch Formal Notice to Ward Engineer'}</span>
                  </button>
                </div>
              )}

              {/* Action feedback status */}
              {actionStatus && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>{actionStatus}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
