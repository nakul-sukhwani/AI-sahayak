'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { CreateProposalInput } from '@/lib/validators/proposal';

export function ProposalForm({ 
  challengeId, 
  universityId,
  challengeTitle
}: { 
  challengeId: string; 
  universityId: string;
  challengeTitle?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    team_members: [] as string[],
    content: {
      abstract: '',
      methodology: '',
      expected_outcomes: '',
      estimated_budget_inr: 0,
      timeline_months: 6,
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/universities/${universityId}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: challengeId,
          team_members: formData.team_members.filter(m => m.trim() !== ''),
          content: formData.content,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Proposal submitted successfully');
      router.push('/university/inbox');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...formData.team_members];
    newMembers[index] = value;
    setFormData({ ...formData, team_members: newMembers });
  };

  return (
    <Card className="max-w-3xl mx-auto shadow-sm border-slate-200">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100">
        <CardTitle className="text-2xl font-bold">Submit Research Proposal</CardTitle>
        {challengeTitle && (
          <CardDescription className="text-base font-medium mt-2">
            Challenge: {challengeTitle}
          </CardDescription>
        )}
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Technical Approach</h3>
            
            <div className="space-y-2">
              <Label htmlFor="abstract">Abstract</Label>
              <Textarea 
                id="abstract" 
                placeholder="Brief summary of your proposed solution..."
                className="min-h-[100px]"
                value={formData.content.abstract}
                onChange={(e) => setFormData({
                  ...formData,
                  content: { ...formData.content, abstract: e.target.value }
                })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="methodology">Methodology</Label>
              <Textarea 
                id="methodology" 
                placeholder="Detailed technical approach..."
                className="min-h-[150px]"
                value={formData.content.methodology}
                onChange={(e) => setFormData({
                  ...formData,
                  content: { ...formData.content, methodology: e.target.value }
                })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="outcomes">Expected Outcomes</Label>
              <Textarea 
                id="outcomes" 
                placeholder="What will be the final deliverables?"
                className="min-h-[100px]"
                value={formData.content.expected_outcomes}
                onChange={(e) => setFormData({
                  ...formData,
                  content: { ...formData.content, expected_outcomes: e.target.value }
                })}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Logistics & Team</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Estimated Budget (INR)</Label>
                <Input 
                  id="budget" 
                  type="number" 
                  min="0"
                  value={formData.content.estimated_budget_inr}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: { ...formData.content, estimated_budget_inr: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline (Months)</Label>
                <Input 
                  id="timeline" 
                  type="number" 
                  min="1"
                  max="60"
                  value={formData.content.timeline_months}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: { ...formData.content, timeline_months: parseInt(e.target.value) || 1 }
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Team Members (Names / Emails)</Label>
              {[0, 1, 2].map((index) => (
                <Input 
                  key={index}
                  placeholder={`Member ${index + 1}`}
                  value={formData.team_members[index] || ''}
                  onChange={(e) => handleMemberChange(index, e.target.value)}
                />
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex justify-end p-6">
          <Button type="button" variant="ghost" onClick={() => router.back()} className="mr-2">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-primary">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Submit Proposal
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
