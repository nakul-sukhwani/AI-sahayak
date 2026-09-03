'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Circle, Clock, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Milestone {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  order_index: number;
}

export function MilestoneTracker({ 
  proposalId, 
  isOwner 
}: { 
  proposalId: string; 
  isOwner: boolean; 
}) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const fetchMilestones = async () => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/milestones`);
      if (!res.ok) throw new Error('Failed to load milestones');
      const data = await res.json();
      setMilestones(data.milestones);
    } catch (error) {
      toast.error('Could not load milestones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [proposalId]);

  const handleAdd = async () => {
    if (!newTitle || !newDueDate) {
      toast.error('Title and due date are required');
      return;
    }
    
    setAdding(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          due_date: newDueDate,
          order_index: milestones.length
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Milestone added');
      setNewTitle('');
      setNewDueDate('');
      fetchMilestones();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/milestones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      toast.success('Status updated');
      fetchMilestones();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center">
            <Clock className="w-5 h-5 mr-2 text-slate-500" />
            Project Milestones
          </CardTitle>
          <Badge variant="outline" className="bg-white">
            {milestones.filter(m => m.status === 'completed').length} / {milestones.length} Completed
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
          {milestones.map((m, index) => (
            <div key={m.id} className="relative pl-6">
              {/* Timeline dot */}
              <div className={`absolute -left-[11px] top-1 rounded-full bg-white ${
                m.status === 'completed' ? 'text-green-500' : 'text-slate-300'
              }`}>
                {m.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 bg-white" />
                ) : (
                  <Circle className="w-5 h-5 bg-white fill-white" />
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h4 className={`font-semibold text-base ${m.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                    {m.title}
                  </h4>
                  <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    <span>Due: {m.due_date}</span>
                    <span className="text-slate-300">•</span>
                    <Badge variant={
                      m.status === 'completed' ? 'secondary' :
                      m.status === 'overdue' ? 'destructive' :
                      m.status === 'in_progress' ? 'default' : 'outline'
                    }>
                      {m.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                
                {isOwner && m.status !== 'completed' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
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
            <p className="pl-6 text-sm text-slate-500">No milestones defined yet.</p>
          )}
        </div>

        {isOwner && (
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mt-8 flex flex-col sm:flex-row gap-3">
            <Input 
              placeholder="New milestone title..." 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 bg-white"
            />
            <Input 
              type="date" 
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full sm:w-40 bg-white"
            />
            <Button onClick={handleAdd} disabled={adding} className="shrink-0">
              {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
