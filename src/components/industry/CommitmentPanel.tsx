'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Briefcase, Handshake, IndianRupee, Clock, Zap, Target } from 'lucide-react';
import { toast } from 'sonner';

interface Commitment {
  id: string;
  commitment_type: string;
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

export function CommitmentPanel({ 
  proposalId,
  userRole 
}: { 
  proposalId: string;
  userRole: string;
}) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPledgeForm, setShowPledgeForm] = useState(false);
  const [pledging, setPledging] = useState(false);
  
  const [formData, setFormData] = useState({
    commitment_type: '',
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
    } catch (error) {
      toast.error('Could not load industry commitments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitments();
  }, [proposalId]);

  const handlePledge = async () => {
    if (!formData.commitment_type) {
      toast.error('Please select a commitment type');
      return;
    }
    
    setPledging(true);
    try {
      const payload: any = {
        commitment_type: formData.commitment_type,
      };
      
      if (formData.commitment_type === 'mentorship') payload.mentorship_hours = parseInt(formData.mentorship_hours);
      if (formData.commitment_type === 'funding') payload.funding_inr = parseInt(formData.funding_inr);
      if (formData.in_kind_description) payload.in_kind_description = formData.in_kind_description;

      const res = await fetch(`/api/proposals/${proposalId}/commitments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Commitment pledged successfully!');
      setShowPledgeForm(false);
      fetchCommitments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to pledge commitment');
    } finally {
      setPledging(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'funding': return <IndianRupee className="w-5 h-5 text-emerald-600" />;
      case 'mentorship': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'prototyping': return <Zap className="w-5 h-5 text-amber-500" />;
      case 'testing': return <Target className="w-5 h-5 text-purple-500" />;
      default: return <Briefcase className="w-5 h-5 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isIndustryPartner = userRole === 'industry_partner' || userRole === 'admin';

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold flex items-center">
          <Handshake className="w-5 h-5 mr-2 text-indigo-600" />
          Industry Backing
        </CardTitle>
        {isIndustryPartner && !showPledgeForm && (
          <Button size="sm" onClick={() => setShowPledgeForm(true)}>Pledge Support</Button>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {showPledgeForm && (
          <div className="bg-indigo-50/50 p-6 border-b border-indigo-100">
            <h4 className="font-medium text-indigo-900 mb-4">Pledge New Commitment</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select 
                  onValueChange={(val) => setFormData({ ...formData, commitment_type: val })}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mentorship">Mentorship</SelectItem>
                    <SelectItem value="funding">Funding / Grant</SelectItem>
                    <SelectItem value="prototyping">Prototyping Facilities</SelectItem>
                    <SelectItem value="testing">Testing & Validation</SelectItem>
                    <SelectItem value="deployment">Deployment Support</SelectItem>
                  </SelectContent>
                </Select>
                
                {formData.commitment_type === 'mentorship' && (
                  <Input 
                    type="number" 
                    placeholder="Total Mentorship Hours" 
                    value={formData.mentorship_hours}
                    onChange={(e) => setFormData({ ...formData, mentorship_hours: e.target.value })}
                    className="bg-white"
                  />
                )}
                
                {formData.commitment_type === 'funding' && (
                  <Input 
                    type="number" 
                    placeholder="Funding Amount (INR)" 
                    value={formData.funding_inr}
                    onChange={(e) => setFormData({ ...formData, funding_inr: e.target.value })}
                    className="bg-white"
                  />
                )}
              </div>
              
              <Textarea 
                placeholder="Additional details (in-kind descriptions, conditions...)" 
                value={formData.in_kind_description}
                onChange={(e) => setFormData({ ...formData, in_kind_description: e.target.value })}
                className="bg-white"
              />
              
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowPledgeForm(false)}>Cancel</Button>
                <Button onClick={handlePledge} disabled={pledging} className="bg-indigo-600 hover:bg-indigo-700">
                  {pledging ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Confirm Pledge
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {commitments.map((c) => (
            <div key={c.id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                  {getIconForType(c.commitment_type)}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    {c.industry_partners.org_name}
                    <Badge variant="outline" className="text-[10px] font-medium tracking-wide uppercase">
                      {c.industry_partners.partner_type.replace('_', ' ')}
                    </Badge>
                  </h4>
                  <p className="text-sm text-slate-600 mt-1 capitalize">
                    {c.commitment_type} Support
                    {c.commitment_type === 'mentorship' && c.mentorship_hours && ` • ${c.mentorship_hours} hours`}
                    {c.commitment_type === 'funding' && c.funding_inr && ` • ₹${c.funding_inr.toLocaleString()}`}
                  </p>
                  {c.in_kind_description && (
                    <p className="text-sm text-slate-500 mt-1 italic">"{c.in_kind_description}"</p>
                  )}
                </div>
              </div>
              <Badge variant={c.status === 'active' || c.status === 'completed' ? 'default' : 'secondary'} className="capitalize shrink-0">
                {c.status}
              </Badge>
            </div>
          ))}
          
          {commitments.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p>No industry commitments yet.</p>
              <p className="text-sm mt-1">Partners can pledge funding, mentorship, or facilities to support this project.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
