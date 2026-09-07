'use client';

import { useState, useTransition } from 'react';
import type { Complaint } from '@/types/complaint';

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

/* ── Assign modal ───────────────────────────────────────────────── */
function AssignModal({
  complaint, workers, onClose,
}: { complaint: Complaint; workers: Worker[]; onClose: () => void }) {
  const [workerId, setWorkerId] = useState('');
  const [loading, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function submit() {
    if (!workerId) return;
    startTransition(async () => {
      const res = await fetch(`/api/complaints/${complaint.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: workerId }),
      });
      const data = await res.json();
      if (res.ok) { setMsg({ type: 'ok', text: 'Assigned successfully. Refreshing…' }); setTimeout(() => { onClose(); location.reload(); }, 1500); }
      else setMsg({ type: 'err', text: data.error ?? 'Failed to assign.' });
    });
  }

  return (
    <div className="nx-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="nx-modal">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#dde3ed] flex items-center justify-between" style={{ background: 'var(--nx-admin-light)' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--nx-admin)' }}>Assign Work</p>
            <h2 className="text-base font-bold text-[#002147] capitalize">{complaint.issue_type.replace('_', ' ')}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#dde3ed] transition-colors">
            <span className="material-symbols-outlined text-lg text-[#718096]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Details */}
          <div className="nx-card p-4 space-y-2">
            <p className="text-xs text-[#718096]">
              <strong className="text-[#1a2332]">Address:</strong> {complaint.address || '—'}
            </p>
            <p className="text-xs text-[#718096]">
              <strong className="text-[#1a2332]">Description:</strong> {complaint.description_en || '—'}
            </p>
            <p className="text-xs text-[#718096]">
              <strong className="text-[#1a2332]">Open for:</strong> {daysSince(complaint.created_at)} day(s)
            </p>
          </div>

          {/* Worker select */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#718096] mb-1.5">
              Select Field Worker
            </label>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="nx-input"
            >
              <option value="">— Choose a worker —</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.display_name ?? w.full_name ?? w.id.slice(0, 8)}
                </option>
              ))}
            </select>
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
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-[#4a5568] bg-[#f4f6fa] rounded border border-[#dde3ed] hover:bg-[#dde3ed] transition-colors">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!workerId || loading}
              className="flex-1 py-2.5 text-sm font-bold text-white rounded transition-colors disabled:opacity-50"
              style={{ background: 'var(--nx-admin)' }}
            >
              {loading ? 'Assigning…' : 'Assign Worker'}
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
      <div className="nx-modal">
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#718096] mb-2">Before</p>
              {complaint.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={complaint.image_url} alt="Before" className="w-full aspect-square object-cover rounded-lg border border-[#dde3ed]" />
              ) : (
                <div className="w-full aspect-square bg-[#f4f6fa] rounded-lg border border-[#dde3ed] flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-[#b8c4d6]">image</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#718096] mb-2">After (Submitted)</p>
              {proof.after_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proof.after_photo_url} alt="After" className="w-full aspect-square object-cover rounded-lg border border-[#dde3ed]" />
              ) : (
                <div className="w-full aspect-square bg-[#f4f6fa] rounded-lg border border-[#dde3ed] flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-[#b8c4d6]">image_not_supported</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Observation */}
          {proof.ai_observation && (
            <div className="nx-card p-3 flex items-start gap-2" style={{ background: '#faf8ff', borderColor: 'rgba(124,58,237,0.25)' }}>
              <span className="material-symbols-outlined text-base flex-shrink-0" style={{ color: '#7C3AED', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#7C3AED' }}>
                  AI Assessment — {proof.ai_verified ? '✓ Verified' : '⚠ Issues found'}
                </p>
                <p className="text-xs text-[#4a5568]">{proof.ai_observation}</p>
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
const STATUS_FILTERS = ['all', 'filed', 'assigned', 'in_progress', 'proof_submitted', 'resolved', 'rejected'];
const SEV_FILTERS = ['all', 'critical', 'high', 'medium', 'low'];

export function AdminComplaintsTable({ complaints, workers, proofs }: ComplaintsTableProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [sevFilter, setSevFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState<Complaint | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<{ proof: ProofRow; complaint: Complaint } | null>(null);
  const [page, setPage] = useState(0);
  const PER_PAGE = 15;

  const proofMap = new Map(proofs.map((p) => [p.complaint_id, p]));

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
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
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-base text-[#b8c4d6]">search</span>
          <input
            type="search"
            placeholder="Search complaints…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="nx-input pl-9"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="nx-input w-auto min-w-[140px]"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : STATUS_BADGE[s]?.label ?? s}</option>
          ))}
        </select>

        <select
          value={sevFilter}
          onChange={(e) => { setSevFilter(e.target.value); setPage(0); }}
          className="nx-input w-auto min-w-[130px]"
        >
          {SEV_FILTERS.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Severities' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <span className="text-xs text-[#718096] ml-auto flex-shrink-0">
          {filtered.length} complaint{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="nx-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="nx-table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Age</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#718096] text-sm">
                    No complaints match the selected filters.
                  </td>
                </tr>
              ) : (
                visible.map((c) => {
                  const statusInfo = STATUS_BADGE[c.status] ?? { bg: '#f4f6fa', color: '#718096', label: c.status };
                  const sevInfo = SEV_BADGE[c.severity] ?? { bg: '#f4f6fa', color: '#718096' };
                  const proof = proofMap.get(c.id);
                  const days = daysSince(c.created_at);
                  const isOverdue = days > 7 && !['resolved', 'closed'].includes(c.status);

                  return (
                    <tr key={c.id}>
                      {/* Issue */}
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: sevInfo.bg }}
                          >
                            <span className="material-symbols-outlined text-sm" style={{ color: sevInfo.color }}>report_problem</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1a2332] capitalize">{c.issue_type.replace('_', ' ')}</p>
                            {c.subcategory && <p className="text-xs text-[#718096]">{c.subcategory}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td>
                        <p className="text-xs text-[#4a5568] max-w-[140px] truncate">{c.ward_name || c.address || '—'}</p>
                      </td>

                      {/* Severity */}
                      <td>
                        <span
                          className="nx-badge capitalize"
                          style={{ background: sevInfo.bg, color: sevInfo.color }}
                        >
                          {c.severity}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className="nx-badge"
                          style={{ background: statusInfo.bg, color: statusInfo.color }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Age */}
                      <td>
                        <span className={`text-xs font-semibold ${isOverdue ? 'text-[#b71c1c]' : 'text-[#718096]'}`}>
                          {isOverdue ? '⚠ ' : ''}{days}d
                        </span>
                      </td>

                      {/* Assigned */}
                      <td>
                        <span className="text-xs text-[#718096]">
                          {c.assigned_to ? (workers.find((w) => w.id === c.assigned_to)?.display_name ?? workers.find((w) => w.id === c.assigned_to)?.full_name ?? 'Worker') : '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center gap-2">
                          {/* Assign — only for unassigned complaints */}
                          {['filed', 'open'].includes(c.status) && (
                            <button
                              onClick={() => setAssignTarget(c)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white rounded transition-colors"
                              style={{ background: 'var(--nx-admin)' }}
                            >
                              <span className="material-symbols-outlined text-sm">assignment_ind</span>
                              Assign
                            </button>
                          )}

                          {/* Verify — only when proof is submitted */}
                          {c.status === 'proof_submitted' && proof && (
                            <button
                              onClick={() => setVerifyTarget({ proof, complaint: c })}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white rounded transition-colors"
                              style={{ background: 'var(--nx-warning)' }}
                            >
                              <span className="material-symbols-outlined text-sm">fact_check</span>
                              Verify
                            </button>
                          )}

                          {/* View detail */}
                          <a
                            href={`/dashboard/${c.id}`}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#4a5568] bg-[#f4f6fa] rounded border border-[#dde3ed] hover:bg-[#dde3ed] transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            View
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
      </div>

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
