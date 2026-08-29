import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AssignmentQueue } from '@/components/supervisor/AssignmentQueue';
import type { Complaint } from '@/types/complaint';

export const metadata: Metadata = {
  title: 'Assignment Queue — Supervisor',
  description: 'Assign pending civic complaints to field workers.',
};

const DEMO_UNASSIGNED: Complaint[] = [
  {
    id: 'demo-unassigned-1',
    user_id: '00000000-0000-0000-0000-000000000002',
    latitude: 12.9308,
    longitude: 77.5838,
    address: '4th Block, Jayanagar, Bangalore',
    ward_name: 'Jayanagar',
    issue_type: 'garbage',
    subcategory: 'Overflowing Bin',
    severity: 'high',
    description_en: 'Commercial garbage accumulation on corner footpath causing severe blockage.',
    description_hi: 'फुटपाथ पर कचरे का ढेर लगा हुआ है।',
    user_notes: null,
    ai_confidence: 0.95,
    ai_tags: ['garbage', 'sanitation'],
    ai_urgency_reason: 'Sanitary hazard in crowded market area.',
    ai_suggested_department: 'Solid Waste Management',
    is_anonymous: false,
    visibility: 'public',
    suggested_authority_id: 3,
    ai_suggested_worker_id: null,
    assigned_to: null,
    assigned_by: null,
    assigned_at: null,
    image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop',
    voice_url: null,
    status: 'filed',
    status_updated_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export default async function SupervisorDashboardPage() {
  let complaints: Complaint[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('status', 'filed')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) complaints = data as Complaint[];
  } catch {
    // Fallback handled below
  }

  if (complaints.length === 0) {
    complaints = DEMO_UNASSIGNED;
  }

  return <AssignmentQueue initialComplaints={complaints} />;
}
