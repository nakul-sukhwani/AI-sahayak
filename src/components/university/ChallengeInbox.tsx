'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
// Modular feature components for University Challenge Review
import { ChallengeInsights } from '@/components/university/ChallengeInsights';
import { AIImprovementSuggestions } from '@/components/university/AIImprovementSuggestions';
import { MaterialRecommendations } from '@/components/university/MaterialRecommendations';
import { AssignStudentModal } from '@/components/university/AssignStudentModal';
import type { StudentAssignment } from '@/lib/university-heuristics';

interface Challenge {
  id: string;
  title: string;
  description: string;
  domain: string;
  tags: string[];
  district: string | null;
  submitter_type: string;
  submitted_on_behalf_of: string | null;
  image_url?: string | null;
  status: string;
  created_at: string;
}

interface InboxItem {
  id: string;
  similarity_score: number;
  distance_km: number | null;
  rank: number;
  status: string;
  created_at: string;
  challenges: Challenge;
}

export function ChallengeInbox({ universityId, isAdmin }: { universityId: string; isAdmin: boolean }) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // State hooks for expanded insights and student assignments
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [assignedMap, setAssignedMap] = useState<Record<string, StudentAssignment>>({});
  const [assignModalChallenge, setAssignModalChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    fetchInbox();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universityId]);

  const fetchInbox = async () => {
    try {
      const res = await fetch(`/api/universities/${universityId}/challenges`);
      if (!res.ok) throw new Error('Failed to load inbox');
      const data = await res.json();
      setItems(data.inbox);
    } catch {
      toast('Could not load inbox', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (challengeId: string, action: 'accepted' | 'rejected') => {
    try {
      const res = await fetch(`/api/universities/${universityId}/challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(data.message, 'success');
      fetchInbox();
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Action failed', 'error');
    }
  };

  const toggleExpand = (challengeId: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [challengeId]: !prev[challengeId],
    }));
  };

  const handleStudentAssigned = (challengeId: string, assignment: StudentAssignment) => {
    setAssignedMap((prev) => ({
      ...prev,
      [challengeId]: assignment,
    }));
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-[#E2E8F0] bg-[#f7f9fb]">
        <div className="flex flex-col items-center justify-center py-12 text-center text-[#545f72]">
          <span className="material-symbols-outlined text-5xl mb-4 text-[#c3c6d1]">inbox</span>
          <p className="text-lg font-medium">No challenges routed to your institution yet.</p>
          <p className="text-sm mt-1">When the government routes a challenge here, it will appear for review.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => {
        const isExpanded = !!expandedMap[item.challenges.id];
        const studentAssignment = assignedMap[item.challenges.id];

        return (
          <Card key={item.id} hover={false} className="transition-all duration-200">
            <div className="flex flex-col md:flex-row">
              {/* Main Content Area */}
              <div className="flex-1 p-6">
                {/* Status Badges & Match Score */}
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.status === 'approved' ? 'filed' :
                        item.status === 'accepted' ? 'resolved' :
                        'rejected'
                      }
                      label={`Routing: ${item.status.toUpperCase()}`}
                    />
                    {studentAssignment && (
                      <Badge
                        variant="ai"
                        label={`Field Lead: ${studentAssignment.leadName}`}
                      />
                    )}
                  </div>
                  <span className="text-sm text-[#545f72] font-medium bg-[#f7f9fb] px-2.5 py-1 rounded-md border border-[#E2E8F0]">
                    Match: {(item.similarity_score * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Challenge Title & Overview */}
                <h3 className="text-lg font-bold text-[#191c1e] mb-2">{item.challenges.title}</h3>
                <p className="text-[#545f72] text-sm leading-relaxed mb-4">
                  {item.challenges.description}
                </p>

                {/* Domain & Region Tags */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant="neutral" label={item.challenges.domain} />
                  {item.challenges.district && (
                    <Badge variant="neutral" label={`📍 ${item.challenges.district}`} />
                  )}
                  <Badge variant="filed" label={item.challenges.submitter_type.replace(/_/g, ' ')} />
                </div>

                {/* Active Student Study Assignment Callout (if assigned) */}
                {studentAssignment && (
                  <div className="mb-4 p-3.5 bg-[#ede9fe]/40 border border-[#7C3AED]/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#191c1e]">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#ede9fe] text-[#7C3AED] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg">school</span>
                      </div>
                      <div>
                        <p className="font-bold text-[#191c1e]">
                          {studentAssignment.studyScope}
                        </p>
                        <p className="text-[#545f72] text-[11px] mt-0.5">
                          Assigned to: <strong className="text-[#7C3AED]">{studentAssignment.leadName}</strong> ({studentAssignment.leadId})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Badge variant="ai" label={`Target: ${studentAssignment.deadline}`} />
                      <button
                        onClick={() => setAssignModalChallenge(item.challenges)}
                        className="text-[#7C3AED] hover:underline font-semibold text-xs"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}

                {/* Toggle Button for Expandable Detailed Insights & AI Recommendations */}
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.challenges.id)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#001e40] hover:text-[#7C3AED] transition-colors py-1 focus:outline-none"
                  >
                    <span
                      className="material-symbols-outlined text-base transition-transform duration-200"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      expand_more
                    </span>
                    <span>
                      {isExpanded
                        ? 'Collapse Technical Insights & Specs'
                        : 'View Detailed Insights, AI Recommendations & Materials'}
                    </span>
                  </button>
                </div>

                {/* ─── HOOK POINT 1, 2, 3: Expandable Detailed Views ─── */}
                {isExpanded && (
                  <div className="mt-4 space-y-4 animate-[fadeIn_0.2s_ease-out]">
                    {/* Feature 1: Detailed Insights & Localized Situational Parameters */}
                    <ChallengeInsights challenge={item.challenges} />

                    {/* Feature 2: AI Heuristic Technical Improvement Roadmap */}
                    <AIImprovementSuggestions challenge={item.challenges} />

                    {/* Feature 3: Recommended Materials, Equipment & Civic Engineering Specs */}
                    <MaterialRecommendations challenge={item.challenges} />
                  </div>
                )}
              </div>

              {/* Administrative Actions Sidebar Panel */}
              <div className="bg-[#f7f9fb] p-6 md:w-64 border-t md:border-t-0 md:border-l border-[#E2E8F0] flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  {item.status === 'approved' ? (
                    <>
                      <p className="text-xs text-[#545f72] font-semibold text-center uppercase tracking-wider mb-1">
                        Institution Action
                      </p>
                      {isAdmin ? (
                        <>
                          <Button
                            variant="primary"
                            onClick={() => handleAction(item.challenges.id, 'accepted')}
                            className="w-full !bg-[#059669] !border-[#059669] text-xs py-2"
                          >
                            Accept Challenge
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleAction(item.challenges.id, 'rejected')}
                            className="w-full !text-[#DC2626] !border-[#DC2626] hover:!bg-[#fee2e2] text-xs py-2"
                          >
                            Decline
                          </Button>
                        </>
                      ) : (
                        <p className="text-xs text-center text-[#545f72]">
                          Only university administrators can accept or decline.
                        </p>
                      )}
                    </>
                  ) : item.status === 'accepted' ? (
                    <>
                      <div className="flex items-center justify-center gap-1.5 text-[#059669] bg-[#d1fae5] rounded-lg py-2 px-3 text-xs font-semibold">
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                        Accepted by Institution
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => router.push(`/university/proposals/new?challenge_id=${item.challenges.id}&university_id=${universityId}`)}
                        className="w-full text-xs py-2"
                      >
                        Submit Proposal
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-[#DC2626] bg-[#fee2e2] rounded-lg py-2 px-3 text-xs font-semibold">
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        cancel
                      </span>
                      Declined
                    </div>
                  )}
                </div>

                {/* ─── HOOK POINT 4: Feature 4 - Student Field Work Assignment Action ─── */}
                <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => setAssignModalChallenge(item.challenges)}
                    className="w-full text-xs py-2 border-[#001e40] text-[#001e40] hover:bg-white flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">school</span>
                    <span>{studentAssignment ? 'Reassign Work' : 'Assign Field Study'}</span>
                  </Button>
                  <p className="text-[11px] text-center text-[#545f72]">
                    Delegate field research or testing to student groups
                  </p>
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Feature 4 Modal: Student / Research Group Assignment Dialog */}
      <AssignStudentModal
        challenge={assignModalChallenge}
        isOpen={!!assignModalChallenge}
        onClose={() => setAssignModalChallenge(null)}
        onAssign={handleStudentAssigned}
      />
    </div>
  );
}
