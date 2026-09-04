'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';

interface Challenge {
  id: string;
  title: string;
  description: string;
  domain: string;
  tags: string[];
  district: string | null;
  submitter_type: string;
  submitted_on_behalf_of: string | null;
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
      {items.map((item) => (
        <Card key={item.id} hover>
          <div className="flex flex-col md:flex-row">
            {/* Content */}
            <div className="flex-1 p-6">
              <div className="flex items-center justify-between mb-3">
                <Badge
                  variant={
                    item.status === 'approved' ? 'filed' :
                    item.status === 'accepted' ? 'resolved' :
                    'rejected'
                  }
                  label={`Routing: ${item.status.toUpperCase()}`}
                />
                <span className="text-sm text-[#545f72] font-medium bg-[#f7f9fb] px-2 py-1 rounded-md">
                  Match: {(item.similarity_score * 100).toFixed(1)}%
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#191c1e] mb-2">{item.challenges.title}</h3>
              <p className="text-[#545f72] text-sm leading-relaxed mb-4 line-clamp-3">
                {item.challenges.description}
              </p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral" label={item.challenges.domain} />
                {item.challenges.district && (
                  <Badge variant="neutral" label={`📍 ${item.challenges.district}`} />
                )}
                <Badge variant="filed" label={item.challenges.submitter_type.replace('_', ' ')} />
              </div>
            </div>

            {/* Actions */}
            <div className="bg-[#f7f9fb] p-6 md:w-60 border-t md:border-t-0 md:border-l border-[#E2E8F0] flex flex-col justify-center gap-3">
              {item.status === 'approved' ? (
                <>
                  <p className="text-xs text-[#545f72] font-medium text-center uppercase tracking-wider mb-1">
                    Institution Action Required
                  </p>
                  {isAdmin ? (
                    <>
                      <Button
                        variant="primary"
                        onClick={() => handleAction(item.challenges.id, 'accepted')}
                        className="w-full !bg-[#059669] !border-[#059669]"
                      >
                        Accept Challenge
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleAction(item.challenges.id, 'rejected')}
                        className="w-full !text-[#DC2626] !border-[#DC2626] hover:!bg-[#fee2e2]"
                      >
                        Decline
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-center text-[#545f72]">Only university administrators can accept or decline.</p>
                  )}
                </>
              ) : item.status === 'accepted' ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-[#059669] bg-[#d1fae5] rounded-lg py-2 px-3 text-sm font-medium">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Accepted
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/university/proposals/new?challenge_id=${item.challenges.id}&university_id=${universityId}`)}
                    className="w-full"
                  >
                    Submit Proposal
                  </Button>
                </>
              ) : (
                <div className="flex items-center justify-center gap-2 text-[#DC2626] bg-[#fee2e2] rounded-lg py-2 px-3 text-sm font-medium">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                  Declined
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
