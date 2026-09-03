'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, MapPin, Building, ArrowRight, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

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
  id: string; // routing id
  similarity_score: number;
  distance_km: number | null;
  rank: number;
  status: string;
  created_at: string;
  challenges: Challenge;
}

export function ChallengeInbox({ universityId, isAdmin }: { universityId: string, isAdmin: boolean }) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchInbox();
  }, [universityId]);

  const fetchInbox = async () => {
    try {
      const res = await fetch(`/api/universities/${universityId}/challenges`);
      if (!res.ok) throw new Error('Failed to load inbox');
      const data = await res.json();
      setItems(data.inbox);
    } catch (error) {
      toast.error('Could not load inbox');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (challengeId: string, action: 'accepted' | 'rejected') => {
    try {
      const res = await fetch(`/api/universities/${universityId}/challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, action })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      fetchInbox(); // Refresh
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed bg-transparent border-2 border-slate-200">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
          <BookOpen className="h-12 w-12 mb-4 text-slate-300" />
          <p className="text-lg font-medium">No challenges routed to your institution yet.</p>
          <p className="text-sm">When the government routes a challenge here, it will appear for review.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md border-slate-200">
          <div className="flex flex-col md:flex-row">
            {/* Left/Top Content */}
            <div className="flex-1 p-6">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={item.status === 'approved' ? 'default' : item.status === 'accepted' ? 'secondary' : 'destructive'}>
                  Routing: {item.status.toUpperCase()}
                </Badge>
                <div className="text-sm text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md">
                  Match Score: {(item.similarity_score * 100).toFixed(1)}%
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">{item.challenges.title}</h3>
              <p className="text-slate-600 line-clamp-3 mb-4 text-sm leading-relaxed">
                {item.challenges.description}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="bg-slate-50 text-slate-600">
                  <Building className="w-3 h-3 mr-1" />
                  {item.challenges.domain}
                </Badge>
                {item.challenges.district && (
                  <Badge variant="outline" className="bg-slate-50 text-slate-600">
                    <MapPin className="w-3 h-3 mr-1" />
                    {item.challenges.district}
                  </Badge>
                )}
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                  Submitter: {item.challenges.submitter_type.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {/* Right/Bottom Actions */}
            <div className="bg-slate-50 p-6 md:w-64 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-center">
              {item.status === 'approved' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 font-medium text-center mb-2 uppercase tracking-wider">
                    Institution Action Required
                  </p>
                  {isAdmin ? (
                    <>
                      <Button 
                        onClick={() => handleAction(item.challenges.id, 'accepted')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Challenge
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleAction(item.challenges.id, 'rejected')}
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-center text-slate-500">Only university administrators can accept or decline.</p>
                  )}
                </div>
              ) : item.status === 'accepted' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center text-green-600 bg-green-50 rounded-full py-2 px-4 mb-2 text-sm font-medium">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accepted
                  </div>
                  <Button 
                    onClick={() => router.push(`/university/proposals/new?challenge_id=${item.challenges.id}&university_id=${universityId}`)}
                    className="w-full"
                  >
                    Submit Proposal
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center text-red-600 bg-red-50 rounded-full py-2 px-4 text-sm font-medium">
                  <XCircle className="w-4 h-4 mr-2" />
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
