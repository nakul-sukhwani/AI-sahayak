import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { AdminComplaintsTable } from '@/components/admin/AdminComplaintsTable';
import { DynamicDashboardBackground } from '@/components/ui/DynamicDashboardBackground';
import type { Complaint } from '@/types/complaint';

export const metadata: Metadata = {
  title: 'Recent Grievances & Triage — Nagrik Seva Admin',
  description: 'Dedicated queue for reviewing citizen grievances, auto-dispatching field personnel, and inspecting repair proof.',
};

export default async function AdminComplaintsPage() {
  const supabase = await createClient();

  // ── All complaints ────────────────────────────────────────────
  const { data: allComplaints } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  const complaints = (allComplaints ?? []) as Complaint[];

  // ── Workers ───────────────────────────────────────────────────
  const { data: workersRaw } = await supabase
    .from('users_profile')
    .select('id, full_name, display_name')
    .eq('role', 'worker');
  const workers = (workersRaw ?? []) as { id: string; full_name: string | null; display_name: string | null }[];

  // ── Work proofs (for verify button) ──────────────────────────
  const proofComplaintIds = complaints
    .filter((c) => c.status === 'proof_submitted')
    .map((c) => c.id);

  let proofs: Array<{
    id: string; complaint_id: string;
    after_photo_url: string | null;
    ai_verified: boolean | null;
    ai_observation: string | null;
    status: string;
  }> = [];

  if (proofComplaintIds.length > 0) {
    const { data: proofsRaw } = await supabase
      .from('work_proof')
      .select('id, complaint_id, after_photo_url, ai_verified, ai_observation, status')
      .in('complaint_id', proofComplaintIds);
    const rawProofs = (proofsRaw ?? []) as typeof proofs;

    proofs = await Promise.all(
      rawProofs.map(async (p) => {
        let afterUrl = p.after_photo_url;
        if (afterUrl && !afterUrl.startsWith('http') && !afterUrl.startsWith('data:')) {
          const cleanPath = afterUrl.replace(/^complaints\//, '');
          const { data: signed } = await supabase.storage
            .from('complaints')
            .createSignedUrl(cleanPath, 7200);
          if (signed?.signedUrl) afterUrl = signed.signedUrl;
        }
        return { ...p, after_photo_url: afterUrl };
      })
    );
  }

  // Pre-generate signed URLs for complaint photos
  const complaintsWithSignedUrls = await Promise.all(
    complaints.map(async (c) => {
      if (c.image_url && !c.image_url.startsWith('http') && !c.image_url.startsWith('data:') && proofComplaintIds.includes(c.id)) {
        const cleanPath = c.image_url.replace(/^complaints\//, '');
        const { data: signed } = await supabase.storage
          .from('complaints')
          .createSignedUrl(cleanPath, 7200);
        if (signed?.signedUrl) {
          return { ...c, image_url: signed.signedUrl };
        }
      }
      return c;
    })
  );

  const unassignedCount = complaints.filter((c) => ['filed', 'open'].includes(c.status)).length;
  const verifyCount = complaints.filter((c) => c.status === 'proof_submitted').length;
  const assignedCount = complaints.filter((c) => ['assigned', 'in_progress'].includes(c.status)).length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  // ── Query Statutory Warnings ───────────────────────────────────
  const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : supabase;

  const { data: warningLogs } = await adminSupabase
    .from('audit_logs')
    .select('entity_id')
    .in('action', ['statutory_admin_warning', 'ngo_admin_summons']);

  const statutoryWarningIds = Array.from(
    new Set([
      ...(warningLogs ?? []).map((w) => w.entity_id),
      ...complaints.filter((c) => c.user_notes?.includes('[STATUTORY_WARNING_ACTIVE]')).map((c) => c.id),
    ])
  );

  return (
    <div className="relative min-h-[90vh]">
      <DynamicDashboardBackground variant="admin" />

      <div className="relative z-10 space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur rounded-2xl border border-[#dde3ed] p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1565c0] hover:underline"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Dashboard Overview</span>
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Grievance Queue
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#002147] tracking-tight">
              Recent Grievances &amp; Field Dispatch
            </h1>
            <p className="text-xs text-[#718096] mt-0.5">
              Full live queue of citizen complaints, AI routing recommendations, technician dispatch, and proof verification.
            </p>
          </div>

          {/* Status summary pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {statutoryWarningIds.length > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>RTI Warnings: {statutoryWarningIds.length}</span>
              </div>
            )}
            <div className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-orange-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Unassigned: {unassignedCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Needs Verification: {verifyCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-[#1565c0] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>In Field: {assignedCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Resolved: {resolvedCount}</span>
            </div>
          </div>
        </div>

        {/* Full Width Complaints Table */}
        <div className="bg-white rounded-2xl border border-[#dde3ed] overflow-hidden shadow-sm p-4 sm:p-6">
          <AdminComplaintsTable
            complaints={complaintsWithSignedUrls}
            workers={workers}
            proofs={proofs}
            statutoryWarningIds={statutoryWarningIds}
          />
        </div>
      </div>
    </div>
  );
}
