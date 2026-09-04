'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';

interface ProposalContent {
  abstract: string;
  methodology: string;
  expected_outcomes: string;
  estimated_budget_inr: number;
  timeline_months: number;
}

interface FormState {
  team_members: string[];
  content: ProposalContent;
}

export function ProposalForm({
  challengeId,
  universityId,
  challengeTitle,
}: {
  challengeId: string;
  universityId: string;
  challengeTitle?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    team_members: [],
    content: {
      abstract: '',
      methodology: '',
      expected_outcomes: '',
      estimated_budget_inr: 0,
      timeline_months: 6,
    },
  });

  const setContent = (patch: Partial<ProposalContent>) =>
    setFormData((prev) => ({ ...prev, content: { ...prev.content, ...patch } }));

  const handleMemberChange = (index: number, value: string) => {
    const next = [...formData.team_members];
    next[index] = value;
    setFormData((prev) => ({ ...prev, team_members: next }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/universities/${universityId}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: challengeId,
          team_members: formData.team_members.filter((m) => m.trim() !== ''),
          content: formData.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast('Proposal submitted successfully', 'success');
      router.push('/university/inbox');
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Failed to submit proposal', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#E2E8F0]">
        <h2 className="text-2xl font-bold text-[#191c1e]">Submit Research Proposal</h2>
        {challengeTitle && (
          <p className="text-sm text-[#545f72] mt-1">Challenge: {challengeTitle}</p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-6">
          {/* Technical Approach */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold text-[#191c1e] border-b border-[#E2E8F0] pb-2">
              Technical Approach
            </h3>

            <div className="space-y-1.5">
              <label htmlFor="abstract" className="text-sm font-medium text-[#191c1e]">Abstract</label>
              <textarea
                id="abstract"
                required
                rows={4}
                placeholder="Brief summary of your proposed solution…"
                value={formData.content.abstract}
                onChange={(e) => setContent({ abstract: e.target.value })}
                className="w-full px-4 py-3 bg-white text-sm text-[#191c1e] placeholder-[#737780] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:border-[#001e40] focus:ring-[#001e40] resize-y"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="methodology" className="text-sm font-medium text-[#191c1e]">Methodology</label>
              <textarea
                id="methodology"
                required
                rows={6}
                placeholder="Detailed technical approach…"
                value={formData.content.methodology}
                onChange={(e) => setContent({ methodology: e.target.value })}
                className="w-full px-4 py-3 bg-white text-sm text-[#191c1e] placeholder-[#737780] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:border-[#001e40] focus:ring-[#001e40] resize-y"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="outcomes" className="text-sm font-medium text-[#191c1e]">Expected Outcomes</label>
              <textarea
                id="outcomes"
                required
                rows={4}
                placeholder="What will be the final deliverables?"
                value={formData.content.expected_outcomes}
                onChange={(e) => setContent({ expected_outcomes: e.target.value })}
                className="w-full px-4 py-3 bg-white text-sm text-[#191c1e] placeholder-[#737780] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:border-[#001e40] focus:ring-[#001e40] resize-y"
              />
            </div>
          </section>

          {/* Logistics & Team */}
          <section className="space-y-4">
            <h3 className="text-base font-semibold text-[#191c1e] border-b border-[#E2E8F0] pb-2">
              Logistics &amp; Team
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="budget"
                type="number"
                label="Estimated Budget (INR)"
                min="0"
                value={formData.content.estimated_budget_inr}
                onChange={(e) => setContent({ estimated_budget_inr: parseInt(e.target.value) || 0 })}
              />
              <Input
                id="timeline"
                type="number"
                label="Timeline (Months)"
                min="1"
                max="60"
                value={formData.content.timeline_months}
                onChange={(e) => setContent({ timeline_months: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#191c1e]">Team Members (Names / Emails)</label>
              {[0, 1, 2].map((index) => (
                <Input
                  key={index}
                  placeholder={`Member ${index + 1}`}
                  value={formData.team_members[index] || ''}
                  onChange={(e) => handleMemberChange(index, e.target.value)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" /> : null}
            Submit Proposal
          </Button>
        </div>
      </form>
    </Card>
  );
}
