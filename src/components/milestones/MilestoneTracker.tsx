'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';

type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

interface Milestone {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: MilestoneStatus;
  order_index: number;
}

const STATUS_BADGE_MAP: Record<MilestoneStatus, 'resolved' | 'in_progress' | 'rejected' | 'neutral'> = {
  completed:   'resolved',
  in_progress: 'in_progress',
  overdue:     'rejected',
  pending:     'neutral',
  cancelled:   'neutral',
};

export function MilestoneTracker({
  proposalId,
  isOwner,
}: {
  proposalId: string;
  isOwner: boolean;
}) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const { toast } = useToast();

  const fetchMilestones = async () => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/milestones`);
      if (!res.ok) throw new Error('Failed to load milestones');
      const data = await res.json();
      setMilestones(data.milestones);
    } catch {
      toast('Could not load milestones', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId]);

  const handleAdd = async () => {
    if (!newTitle || !newDueDate) {
      toast('Title and due date are required', 'error');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, due_date: newDueDate, order_index: milestones.length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast('Milestone added', 'success');
      setNewTitle('');
      setNewDueDate('');
      fetchMilestones();
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Failed to add milestone', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/milestones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast('Status updated', 'success');
      fetchMilestones();
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Update failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const completed = milestones.filter((m) => m.status === 'completed').length;

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
        <h3 className="text-lg font-semibold text-[#191c1e] flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-[#545f72]">schedule</span>
          Project Milestones
        </h3>
        <Badge variant="neutral" label={`${completed} / ${milestones.length} Completed`} />
      </div>

      {/* Timeline */}
      <div className="p-6">
        <div className="relative border-l-2 border-[#E2E8F0] ml-3 space-y-8">
          {milestones.map((m) => (
            <div key={m.id} className="relative pl-6">
              {/* Timeline dot */}
              <span
                className={[
                  'absolute -left-[11px] top-0.5 material-symbols-outlined text-xl bg-white',
                  m.status === 'completed' ? 'text-[#059669]' : 'text-[#c3c6d1]',
                ].join(' ')}
                style={{ fontVariationSettings: m.status === 'completed' ? "'FILL' 1" : "'FILL' 0" }}
              >
                {m.status === 'completed' ? 'check_circle' : 'circle'}
              </span>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h4 className={['font-semibold text-base', m.status === 'completed' ? 'text-[#737780] line-through' : 'text-[#191c1e]'].join(' ')}>
                    {m.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-[#545f72]">Due: {m.due_date}</span>
                    <span className="text-[#c3c6d1]">•</span>
                    <Badge variant={STATUS_BADGE_MAP[m.status]} label={m.status.replace('_', ' ')} />
                  </div>
                </div>

                {isOwner && m.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleStatusChange(m.id, 'completed')}
                    className="shrink-0"
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          ))}

          {milestones.length === 0 && (
            <p className="pl-6 text-sm text-[#545f72]">No milestones defined yet.</p>
          )}
        </div>

        {/* Add milestone form */}
        {isOwner && (
          <div className="bg-[#f7f9fb] border border-[#E2E8F0] rounded-lg p-4 mt-8 flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="New milestone title…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1"
            />
            <Input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full sm:w-44"
            />
            <Button onClick={handleAdd} disabled={adding} className="shrink-0">
              {adding && <Spinner size="sm" />}
              Add
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
