'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';

type CommitmentType = 'mentorship' | 'funding' | 'prototyping' | 'testing' | 'deployment';

interface Commitment {
  id: string;
  commitment_type: CommitmentType;
  mentorship_hours: number | null;
  funding_inr: number | null;
  in_kind_description: string | null;
  status: string;
  created_at: string;
  industry_partners: {
    id: string;
    org_name: string;
    partner_type: string;
  };
}

const TYPE_ICONS: Record<CommitmentType | 'default', string> = {
  funding:     'currency_rupee',
  mentorship:  'schedule',
  prototyping: 'bolt',
  testing:     'target',
  deployment:  'rocket_launch',
  default:     'handshake',
};

const COMMITMENT_TYPES: { value: CommitmentType; label: string }[] = [
  { value: 'mentorship',  label: 'Mentorship' },
  { value: 'funding',     label: 'Funding / Grant' },
  { value: 'prototyping', label: 'Prototyping Facilities' },
  { value: 'testing',     label: 'Testing & Validation' },
  { value: 'deployment',  label: 'Deployment Support' },
];

export function CommitmentPanel({
  proposalId,
  userRole,
}: {
  proposalId: string;
  userRole: string;
}) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pledging, setPledging] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    commitment_type: '' as CommitmentType | '',
    mentorship_hours: '',
    funding_inr: '',
    in_kind_description: '',
  });

  const fetchCommitments = async () => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/commitments`);
      if (!res.ok) throw new Error('Failed to load commitments');
      const data = await res.json();
      setCommitments(data.commitments);
    } catch {
      toast('Could not load industry commitments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  const handlePledge = async () => {
    if (!formData.commitment_type) {
      toast('Please select a commitment type', 'error');
      return;
    }
    setPledging(true);
    try {
      const payload: Record<string, unknown> = { commitment_type: formData.commitment_type };
      if (formData.commitment_type === 'mentorship' && formData.mentorship_hours)
        payload.mentorship_hours = parseInt(formData.mentorship_hours);
      if (formData.commitment_type === 'funding' && formData.funding_inr)
        payload.funding_inr = parseInt(formData.funding_inr);
      if (formData.in_kind_description)
        payload.in_kind_description = formData.in_kind_description;

      const res = await fetch(`/api/proposals/${proposalId}/commitments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast('Commitment pledged successfully!', 'success');
      setShowForm(false);
      setFormData({ commitment_type: '', mentorship_hours: '', funding_inr: '', in_kind_description: '' });
      fetchCommitments();
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Failed to pledge commitment', 'error');
    } finally {
      setPledging(false);
    }
  };

  const isIndustryPartner = userRole === 'industry_partner' || userRole === 'admin';

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
        <h3 className="text-lg font-semibold text-[#191c1e] flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-[#7C3AED]" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
          Industry Backing
        </h3>
        {isIndustryPartner && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>Pledge Support</Button>
        )}
      </div>

      {/* Pledge form */}
      {showForm && (
        <div className="bg-[#ede9fe]/30 p-6 border-b border-[#ede9fe]">
          <h4 className="text-sm font-semibold text-[#7C3AED] mb-4">Pledge New Commitment</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Native select — no external dependency */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#191c1e]">Commitment Type</label>
                <select
                  value={formData.commitment_type}
                  onChange={(e) => setFormData({ ...formData, commitment_type: e.target.value as CommitmentType })}
                  className="w-full px-4 py-3 bg-white text-sm text-[#191c1e] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:border-[#001e40] focus:ring-[#001e40]"
                >
                  <option value="">Select type…</option>
                  {COMMITMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {formData.commitment_type === 'mentorship' && (
                <Input
                  type="number"
                  label="Mentorship Hours"
                  placeholder="Total hours"
                  value={formData.mentorship_hours}
                  onChange={(e) => setFormData({ ...formData, mentorship_hours: e.target.value })}
                />
              )}
              {formData.commitment_type === 'funding' && (
                <Input
                  type="number"
                  label="Funding Amount (INR)"
                  placeholder="Amount"
                  value={formData.funding_inr}
                  onChange={(e) => setFormData({ ...formData, funding_inr: e.target.value })}
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#191c1e]">Additional Details</label>
              <textarea
                rows={3}
                placeholder="In-kind descriptions, conditions…"
                value={formData.in_kind_description}
                onChange={(e) => setFormData({ ...formData, in_kind_description: e.target.value })}
                className="w-full px-4 py-3 bg-white text-sm text-[#191c1e] placeholder-[#737780] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:border-[#001e40] focus:ring-[#001e40] resize-y"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handlePledge} disabled={pledging}>
                {pledging && <Spinner size="sm" />}
                Confirm Pledge
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Commitments list */}
      <div className="divide-y divide-[#E2E8F0]">
        {commitments.map((c) => {
          const iconName = TYPE_ICONS[c.commitment_type] ?? TYPE_ICONS.default;
          return (
            <div key={c.id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#f7f9fb] rounded-xl border border-[#E2E8F0]">
                  <span className="material-symbols-outlined text-xl text-[#545f72]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {iconName}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-[#191c1e] flex items-center gap-2">
                    {c.industry_partners.org_name}
                    <Badge variant="neutral" label={c.industry_partners.partner_type.replace('_', ' ')} />
                  </h4>
                  <p className="text-sm text-[#545f72] mt-0.5 capitalize">
                    {c.commitment_type} Support
                    {c.commitment_type === 'mentorship' && c.mentorship_hours && ` • ${c.mentorship_hours} hrs`}
                    {c.commitment_type === 'funding' && c.funding_inr && ` • ₹${c.funding_inr.toLocaleString()}`}
                  </p>
                  {c.in_kind_description && (
                    <p className="text-sm text-[#737780] mt-0.5 italic">"{c.in_kind_description}"</p>
                  )}
                </div>
              </div>
              <Badge
                variant={c.status === 'committed' ? 'resolved' : 'neutral'}
                label={c.status}
                className="capitalize shrink-0"
              />
            </div>
          );
        })}

        {commitments.length === 0 && (
          <div className="p-8 text-center text-[#545f72]">
            <span className="material-symbols-outlined text-4xl text-[#c3c6d1] mb-3 block">business_center</span>
            <p>No industry commitments yet.</p>
            <p className="text-sm mt-1">Partners can pledge funding, mentorship, or facilities.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
