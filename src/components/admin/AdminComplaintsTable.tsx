'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Complaint } from '@/types/complaint';
import type { DispatchEvaluation } from '@/lib/dispatch-agent';

/* ── Types ─────────────────────────────────────────────────────── */
interface Worker { id: string; full_name: string | null; display_name: string | null; }
interface ProofRow {
  id: string;
  complaint_id: string;
  after_photo_url: string | null;
  ai_verified: boolean | null;
  ai_observation: string | null;
  status: string;
}
interface ComplaintsTableProps {
  complaints: Complaint[];
  workers: Worker[];
  proofs: ProofRow[];
  statutoryWarningIds?: string[];
}

/* ── Status badge ───────────────────────────────────────────────── */
const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  filed:           { bg: '#e3f0fd', color: '#1565c0', label: 'Filed' },
  open:            { bg: '#e3f0fd', color: '#1565c0', label: 'Open' },
  assigned:        { bg: '#f3e5f5', color: '#6a1b9a', label: 'Assigned' },
  in_progress:     { bg: '#e0f7fa', color: '#00695c', label: 'In Progress' },
  proof_submitted: { bg: '#fff8e1', color: '#e65100', label: 'Proof Submitted' },
  resolved:        { bg: '#e8f5e9', color: '#1b5e20', label: 'Resolved' },
  closed:          { bg: '#f4f6fa', color: '#718096', label: 'Closed' },
  rejected:        { bg: '#ffebee', color: '#b71c1c', label: 'Rejected' },
  statutory_warning: { bg: '#ffebee', color: '#b71c1c', label: '⚠️ Statutory Warnings' },
};
const SEV_BADGE: Record<string, { bg: string; color: string }> = {
  critical: { bg: '#ffebee', color: '#b71c1c' },
  high:     { bg: '#fff3e0', color: '#e65100' },
  medium:   { bg: '#e3f0fd', color: '#1565c0' },
  low:      { bg: '#e8f5e9', color: '#1b5e20' },
};

function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

/* ── Assign modal with AI Smart Dispatch ────────────────────────── */
function AssignModal({
  complaint, workers, onClose,
}: { complaint: Complaint; workers: Worker[]; onClose: () => void }) {
  const [workerId, setWorkerId] = useState('');
  const [loading, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [recommendations, setRecommendations] = useState<DispatchEvaluation[]>([]);
  const [loadingAI, setLoadingAI] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchRecommendations() {
      setLoadingAI(true);
      try {
        const res = await fetch('/api/complaints/auto-dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ complaint_id: complaint.id }),
        });
        const data = await res.json();
        if (active && data.success && data.evaluations) {
          setRecommendations(data.evaluations);
          if (data.recommended_worker?.worker_id) {
            setWorkerId(data.recommended_worker.worker_id);
          }
        }
      } catch (err) {
        console.error('Failed to load dispatch evaluations', err);
      } finally {
        if (active) setLoadingAI(false);
      }
    }
    fetchRecommendations();
    return () => { active = false; };
  }, [complaint.id]);

  const topPick = recommendations[0];

  async function submit(targetWorkerId?: string) {
    const finalWorkerId = targetWorkerId || workerId;
    if (!finalWorkerId) return;
    startTransition(async () => {
      const res = await fetch(`/api/complaints/${complaint.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: finalWorkerId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'ok', text: 'Assigned successfully. Refreshing…' });
        setTimeout(() => { onClose(); location.reload(); }, 1200);
      } else {
        setMsg({ type: 'err', text: data.error ?? 'Failed to assign.' });
      }
    });
  }

  return (
    <div className="nx-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="nx-modal max-w-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#dde3ed] flex items-center justify-between" style={{ background: 'var(--nx-admin-light)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#002147] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#1565c0]">Autonomous Dispatch</p>
              <h2 className="text-base font-bold text-[#002147] capitalize">{complaint.issue_type.replace('_', ' ')}</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#dde3ed] transition-colors">
            <span className="material-symbols-outlined text-lg text-[#718096]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Complaint Context */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Ward / Address:</span>
              <span className="text-slate-900 font-semibold">{complaint.ward_name || complaint.address || 'Central Bangalore'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Severity / Priority:</span>
              <span className="font-bold uppercase tracking-wider text-red-600">{complaint.severity}</span>
            </div>
            <p className="text-slate-600 italic line-clamp-2 pt-1 border-t border-slate-200/60">
              &ldquo;{complaint.description_en}&rdquo;
            </p>
          </div>

          {/* AI Autonomous Recommendation Card */}
          {loadingAI ? (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center gap-3 text-xs text-blue-900">
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              <span>Evaluating technician proximity, skill matrix, and queue capacity…</span>
            </div>
          ) : topPick ? (
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#e3f0fd] to-[#f0f7ff] border-2 border-[#1565c0]/30 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#1565c0] text-white">
                    Optimal AI Match · {topPick.dispatch_score}%
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {topPick.active_tasks_count} active tickets
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#002147]">{topPick.worker_name}</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  <span className="font-semibold text-slate-800">{topPick.department}</span> · {topPick.area_name}
                </p>
                <p className="text-[11px] text-blue-900/80 font-medium mt-1 bg-white/70 px-2.5 py-1 rounded-lg border border-blue-200/50">
                  ⚡ {topPick.recommendation_reason}
                </p>
              </div>

              <button
                type="button"
                onClick={() => submit(topPick.worker_id)}
                disabled={loading}
                className="w-full py-2 px-3 bg-[#002147] hover:bg-[#003166] text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">flash_on</span>
                <span>Auto-Dispatch Recommended Technician</span>
              </button>
            </div>
          ) : null}

          {/* Manual Select Worker Option */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#718096] mb-1.5">
              Select or Override Field Personnel
            </label>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#002147] focus:ring-2 focus:ring-[#002147]/10"
            >
              <option value="">— Choose a field worker —</option>
              {workers.map((w) => {
                const evalMatch = recommendations.find((r) => r.worker_id === w.id);
                return (
                  <option key={w.id} value={w.id}>
                    {w.display_name ?? w.full_name ?? w.id.slice(0, 8)}
                    {evalMatch ? ` (${evalMatch.dispatch_score}% Match · ${evalMatch.department})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {msg && (
            <div
              className="flex items-center gap-2 p-3 rounded-xl border text-xs font-medium"
              style={
                msg.type === 'ok'
                  ? { background: 'var(--nx-success-light)', color: 'var(--nx-success)', borderColor: '#a5d6a7' }
                  : { background: 'var(--nx-error-light)', color: 'var(--nx-error)', borderColor: '#ffcdd2' }
              }
            >
              <span className="material-symbols-outlined text-base">{msg.type === 'ok' ? 'check_circle' : 'error'}</span>
              {msg.text}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-xs font-semibold text-[#4a5568] bg-[#f4f6fa] rounded-xl border border-[#dde3ed] hover:bg-[#dde3ed] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => submit()}
              disabled={!workerId || loading}
              className="flex-1 py-2 text-xs font-bold text-white rounded-xl transition-colors disabled:opacity-50"
              style={{ background: 'var(--nx-admin)' }}
            >
              {loading ? 'Assigning…' : 'Confirm Dispatch'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Verify Proof modal ─────────────────────────────────────────── */
function VerifyModal({
  proof, complaint, onClose,
}: { proof: ProofRow; complaint: Complaint; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [loading, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [beforeUrl, setBeforeUrl] = useState<string | null>(complaint.image_url);
  const [afterUrl, setAfterUrl] = useState<string | null>(proof.after_photo_url);
  const [isLoadingBefore, setIsLoadingBefore] = useState(false);
  const [isLoadingAfter, setIsLoadingAfter] = useState(false);
  const [beforeFailed, setBeforeFailed] = useState(false);
  const [afterFailed, setAfterFailed] = useState(false);

  useEffect(() => {
    // Resolve Before photo if not an absolute HTTP URL
    if (complaint.image_url && !complaint.image_url.startsWith('http') && !complaint.image_url.startsWith('data:')) {
      setIsLoadingBefore(true);
      fetch(`/api/storage/signed-url?path=${encodeURIComponent(complaint.image_url)}`)
        .then((r) => r.json())
        .then((d) => { if (d.signedUrl) setBeforeUrl(d.signedUrl); })
        .catch(() => setBeforeFailed(true))
        .finally(() => setIsLoadingBefore(false));
    } else {
      setBeforeUrl(complaint.image_url);
    }

    // Resolve After photo if not an absolute HTTP URL
    if (proof.after_photo_url && !proof.after_photo_url.startsWith('http') && !proof.after_photo_url.startsWith('data:')) {
      setIsLoadingAfter(true);
      fetch(`/api/storage/signed-url?path=${encodeURIComponent(proof.after_photo_url)}`)
        .then((r) => r.json())
        .then((d) => { if (d.signedUrl) setAfterUrl(d.signedUrl); })
        .catch(() => setAfterFailed(true))
        .finally(() => setIsLoadingAfter(false));
    } else {
      setAfterUrl(proof.after_photo_url);
    }
  }, [complaint.image_url, proof.after_photo_url]);

  async function submit(action: 'approved' | 'rejected') {
    if (action === 'rejected' && !reason.trim()) { setMsg({ type: 'err', text: 'Please provide a rejection reason.' }); return; }
    startTransition(async () => {
      const res = await fetch(`/api/work-proof/${proof.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action, rejection_reason: action === 'rejected' ? reason : null }),
      });
      const data = await res.json();
      if (res.ok) { setMsg({ type: 'ok', text: `Proof ${action}. Refreshing…` }); setTimeout(() => { onClose(); location.reload(); }, 1500); }
      else setMsg({ type: 'err', text: data.error ?? 'Failed.' });
    });
  }

  return (
    <div className="nx-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="nx-modal max-w-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#dde3ed] flex items-center justify-between" style={{ background: 'var(--nx-warning-light)' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--nx-warning)' }}>Verify Proof of Work</p>
            <h2 className="text-base font-bold text-[#002147] capitalize">{complaint.issue_type.replace('_', ' ')}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#dde3ed] transition-colors">
            <span className="material-symbols-outlined text-lg text-[#718096]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Before/After photos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Before (Problem)</p>
                {beforeUrl && !beforeFailed && !isLoadingBefore && (
                  <a href={beforeUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                    <span>Full size</span>
                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
                )}
              </div>
              {isLoadingBefore ? (
                <div className="w-full aspect-square bg-[#f4f6fa] rounded-lg border border-[#dde3ed] flex flex-col items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-[#1565c0] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px] text-[#718096]">Loading photo…</span>
                </div>
              ) : beforeUrl && !beforeFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={beforeUrl}
                  alt="Before"
                  onError={() => setBeforeFailed(true)}
                  className="w-full aspect-square object-cover rounded-lg border border-[#dde3ed] shadow-xs"
                />
              ) : (
                <div className="w-full aspect-square bg-[#f4f6fa] rounded-lg border border-[#dde3ed] flex flex-col items-center justify-center text-center p-3">
                  <span className="material-symbols-outlined text-3xl text-[#b8c4d6] mb-1">image_not_supported</span>
                  <span className="text-[11px] text-[#718096]">No photo or storage unavailable</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">After (Submitted)</p>
                {afterUrl && !afterFailed && !isLoadingAfter && (
                  <a href={afterUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5">
                    <span>Full size</span>
                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                  </a>
                )}
              </div>
              {isLoadingAfter ? (
                <div className="w-full aspect-square bg-[#f4f6fa] rounded-lg border border-[#dde3ed] flex flex-col items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-[#1565c0] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px] text-[#718096]">Loading photo…</span>
                </div>
              ) : afterUrl && !afterFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={afterUrl}
                  alt="After"
                  onError={() => setAfterFailed(true)}
                  className="w-full aspect-square object-cover rounded-lg border border-[#dde3ed] shadow-xs"
                />
              ) : (
                <div className="w-full aspect-square bg-[#f4f6fa] rounded-lg border border-[#dde3ed] flex flex-col items-center justify-center text-center p-3">
                  <span className="material-symbols-outlined text-3xl text-[#b8c4d6] mb-1">image_not_supported</span>
                  <span className="text-[11px] text-[#718096]">No photo or storage unavailable</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Observation & Inspection Check */}
          {proof.ai_observation && (
            <div className="nx-card p-3.5 space-y-2" style={{ background: '#faf8ff', borderColor: 'rgba(124,58,237,0.25)' }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base" style={{ color: '#7C3AED', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#7C3AED' }}>
                    AI Photo Check — {proof.ai_verified ? '✓ Work Verified' : '⚠ Issue Detected'}
                  </p>
                </div>
                {proof.ai_observation.includes('Fraud Risk: HIGH') || proof.ai_observation.toLowerCase().includes('different place') || proof.ai_observation.toLowerCase().includes('different location') ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                    Location Mismatch
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                    Photo Matches
                  </span>
                )}
              </div>

              <div className="text-xs text-[#4a5568] whitespace-pre-line leading-relaxed">
                {proof.ai_observation}
              </div>
            </div>
          )}

          {/* Rejection reason */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#718096] mb-1.5">
              Rejection Reason <span className="text-[#718096] normal-case font-normal">(required only if rejecting)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Explain why the proof is insufficient…"
              className="nx-input resize-none"
            />
          </div>

          {msg && (
            <div
              className="flex items-center gap-2 p-3 rounded border text-sm font-medium"
              style={
                msg.type === 'ok'
                  ? { background: 'var(--nx-success-light)', color: 'var(--nx-success)', borderColor: '#a5d6a7' }
                  : { background: 'var(--nx-error-light)', color: 'var(--nx-error)', borderColor: '#ffcdd2' }
              }
            >
              <span className="material-symbols-outlined text-base">{msg.type === 'ok' ? 'check_circle' : 'error'}</span>
              {msg.text}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => submit('rejected')}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded transition-colors disabled:opacity-50"
              style={{ background: 'var(--nx-error)' }}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-base">cancel</span>
                Reject Proof
              </span>
            </button>
            <button
              onClick={() => submit('approved')}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded transition-colors disabled:opacity-50"
              style={{ background: 'var(--nx-success)' }}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-base">verified</span>
                Approve &amp; Resolve
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main table ─────────────────────────────────────────────────── */
const STATUS_FILTERS = ['all', 'statutory_warning', 'filed', 'assigned', 'in_progress', 'proof_submitted', 'resolved', 'rejected'];
const SEV_FILTERS = ['all', 'critical', 'high', 'medium', 'low'];

export function AdminComplaintsTable({ complaints, workers, proofs, statutoryWarningIds = [] }: ComplaintsTableProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [sevFilter, setSevFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState<Complaint | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<{ proof: ProofRow; complaint: Complaint } | null>(null);
  const [page, setPage] = useState(0);
  const pathname = usePathname();
  const isDedicatedPage = pathname?.startsWith('/admin/complaints');
  const PER_PAGE = 15;
  const getIssueIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pothole': return 'construction';
      case 'streetlight': return 'lightbulb';
      case 'garbage': return 'delete_sweep';
      case 'water_leak':
      case 'water': return 'water_drop';
      case 'drainage':
      case 'sewage': return 'plumbing';
      case 'park': return 'park';
      default: return 'report_problem';
    }
  };

  const proofMap = new Map(proofs.map((p) => [p.complaint_id, p]));

  const filtered = complaints.filter((c) => {
    if (statusFilter === 'statutory_warning') {
      const isWarned = Boolean(
        statutoryWarningIds.includes(c.id) ||
        (c.user_notes && c.user_notes.includes('[STATUTORY_WARNING_ACTIVE]'))
      );
      if (!isWarned) return false;
    } else if (statusFilter !== 'all' && c.status !== statusFilter) {
      return false;
    }
    if (sevFilter !== 'all' && c.severity !== sevFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !c.issue_type.toLowerCase().includes(q) &&
        !c.address?.toLowerCase().includes(q) &&
        !(c.description_en?.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const visible = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div className="bg-white rounded-2xl border border-[#dde3ed] p-5 shadow-sm">
      {/* Header & Filter Controls (Quixotic style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1a2332] flex items-center gap-2">
              <span>Recent Grievances</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#e3f0fd] text-[#1565c0]">
                {filtered.length}
              </span>
            </h2>
            {!isDedicatedPage && (
              <Link
                href="/admin/complaints"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1565c0] hover:text-[#002147] bg-[#e3f0fd]/60 hover:bg-[#e3f0fd] px-2 py-0.5 rounded-lg border border-[#b8c4d6]/60 transition-colors"
                title="Open dedicated full-screen grievance management view"
              >
                <span>Full Tab</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            )}
          </div>
          <p className="text-xs text-[#718096]">Live queue of citizen reports and field progress</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-base text-[#b8c4d6]">search</span>
            <input
              type="search"
              placeholder="Search by issue, ward…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#dde3ed] focus:outline-none focus:border-[#1565c0] bg-[#f8fafc]"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="text-xs rounded-xl border border-[#dde3ed] px-3 py-1.5 bg-[#f8fafc] text-[#4a5568] focus:outline-none font-medium"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : STATUS_BADGE[s]?.label ?? s}</option>
            ))}
          </select>

          {/* Severity filter */}
          <select
            value={sevFilter}
            onChange={(e) => { setSevFilter(e.target.value); setPage(0); }}
            className="text-xs rounded-xl border border-[#dde3ed] px-3 py-1.5 bg-[#f8fafc] text-[#4a5568] focus:outline-none font-medium"
          >
            {SEV_FILTERS.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Severities' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table (Quixotic style) */}
      <div className="overflow-x-auto no-scrollbar scrollbar-none">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#dde3ed] text-[11px] font-bold uppercase tracking-wider text-[#718096]">
              <th className="py-3 px-3">Grievance / Type</th>
              <th className="py-3 px-3">Ward / Location</th>
              <th className="py-3 px-3">Reported At</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Assigned Crew</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dde3ed]/60">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-[#718096] text-xs">
                  No complaints match the selected filters.
                </td>
              </tr>
            ) : (
              visible.map((c) => {
                const statusInfo = STATUS_BADGE[c.status] ?? { bg: '#f4f6fa', color: '#718096', label: c.status };
                const proof = proofMap.get(c.id);
                const dateObj = new Date(c.created_at);
                const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                const hasWarning = Boolean(
                  statutoryWarningIds.includes(c.id) ||
                  (c.user_notes && c.user_notes.includes('[STATUTORY_WARNING_ACTIVE]'))
                );

                return (
                  <tr key={c.id} id={`complaint-${c.id}`} className={`hover:bg-[#f8fafc] transition-colors group ${hasWarning ? 'bg-red-50/30' : ''}`}>
                    {/* Issue */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{ background: hasWarning ? '#ffebee' : statusInfo.bg, color: hasWarning ? '#b71c1c' : statusInfo.color }}
                        >
                          <span className="material-symbols-outlined text-base">
                            {hasWarning ? 'gavel' : getIssueIcon(c.issue_type)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-[#1a2332] capitalize">
                              {c.issue_type.replace('_', ' ')}
                            </p>
                            {hasWarning && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                <span>RTI Warning</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#718096] truncate max-w-[180px]">
                            {c.subcategory || c.description_en || 'Municipal Grievance'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-3">
                      <p className="text-xs font-medium text-[#1a2332] max-w-[150px] truncate">
                        {c.ward_name || 'Central Ward'}
                      </p>
                      <p className="text-[11px] text-[#718096] max-w-[150px] truncate">
                        {c.address || 'Location registered'}
                      </p>
                    </td>

                    {/* Reported At */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <p className="text-xs font-medium text-[#1a2332]">{formattedDate}</p>
                      <p className="text-[11px] text-[#718096]">{formattedTime}</p>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                        style={{ background: statusInfo.bg, color: statusInfo.color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusInfo.color }}></span>
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* Assigned */}
                    <td className="py-3.5 px-3">
                      {c.assigned_to ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#1a2332] font-medium">
                          <span className="w-5 h-5 rounded-full bg-[#e3f0fd] text-[#1565c0] flex items-center justify-center text-[10px] font-bold">
                            {(workers.find((w) => w.id === c.assigned_to)?.display_name ?? 'W')[0].toUpperCase()}
                          </span>
                          <span className="truncate max-w-[100px]">
                            {workers.find((w) => w.id === c.assigned_to)?.display_name ?? 'Worker'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#b45309] font-medium italic">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {['filed', 'open'].includes(c.status) && (
                          <button
                            onClick={() => setAssignTarget(c)}
                            className="px-3 py-1 bg-[#002147] hover:bg-[#003166] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-xs">auto_awesome</span>
                            <span>AI Dispatch</span>
                          </button>
                        )}

                        {c.status === 'proof_submitted' && proof && (
                          <button
                            onClick={() => setVerifyTarget({ proof, complaint: c })}
                            className="px-3 py-1 bg-[#b45309] hover:bg-[#92400e] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-xs">fact_check</span>
                            <span>Verify</span>
                          </button>
                        )}

                        <a
                          href={`/dashboard/${c.id}`}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#4a5568] bg-[#f4f6fa] rounded-lg border border-[#dde3ed] hover:bg-[#dde3ed] transition-colors"
                        >
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                          <span>View</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#dde3ed] bg-[#f4f6fa]">
            <span className="text-xs text-[#718096]">
              Page {page + 1} of {pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs font-semibold text-[#4a5568] bg-white rounded border border-[#dde3ed] hover:bg-[#f4f6fa] disabled:opacity-40 transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                disabled={page === pages - 1}
                className="px-3 py-1.5 text-xs font-semibold text-[#4a5568] bg-white rounded border border-[#dde3ed] hover:bg-[#f4f6fa] disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

      {/* Modals */}
      {assignTarget && (
        <AssignModal
          complaint={assignTarget}
          workers={workers}
          onClose={() => setAssignTarget(null)}
        />
      )}
      {verifyTarget && (
        <VerifyModal
          proof={verifyTarget.proof}
          complaint={verifyTarget.complaint}
          onClose={() => setVerifyTarget(null)}
        />
      )}
    </div>
  );
}
