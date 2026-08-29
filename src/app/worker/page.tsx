import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorkerDashboardClient } from '@/components/worker/WorkerDashboardClient';
import type { Complaint } from '@/types/complaint';

export const metadata: Metadata = {
  title: 'My Tasks — Worker',
  description: 'View and manage your assigned civic complaint tasks.',
};

const DEMO_ACTIVE: Complaint[] = [
  {
    id: 'demo-task-1',
    user_id: '00000000-0000-0000-0000-000000000001',
    latitude: 12.9352,
    longitude: 77.6245,
    address: '80 Feet Road, 4th Block, Koramangala, Bangalore',
    ward_name: 'Koramangala',
    issue_type: 'pothole',
    subcategory: 'Deep Pothole',
    severity: 'high',
    description_en: 'Severe pothole causing traffic obstruction and two-wheeler hazard near 80 Feet Road signal.',
    description_hi: '80 फीट रोड सिग्नल के पास गहरा गड्ढा यातायात में बाधा उत्पन्न कर रहा है।',
    user_notes: 'Water gathers inside during rain.',
    ai_confidence: 0.94,
    ai_tags: ['pothole', 'road_damage'],
    ai_urgency_reason: 'High risk of accidents for two-wheelers during night hours.',
    ai_suggested_department: 'Roads & Infrastructure',
    is_anonymous: false,
    visibility: 'public',
    suggested_authority_id: 1,
    ai_suggested_worker_id: '00000000-0000-0000-0000-000000000001',
    assigned_to: '00000000-0000-0000-0000-000000000001',
    assigned_by: '00000000-0000-0000-0000-000000000004',
    assigned_at: new Date(Date.now() - 3600000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop',
    voice_url: null,
    status: 'in_progress',
    status_updated_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-task-2',
    user_id: '00000000-0000-0000-0000-000000000001',
    latitude: 12.9784,
    longitude: 77.6408,
    address: '12th Main Road, Indiranagar, Bangalore',
    ward_name: 'Indiranagar',
    issue_type: 'streetlight',
    subcategory: 'Broken Streetlight',
    severity: 'medium',
    description_en: 'Streetlight completely dark for 3 consecutive days.',
    description_hi: 'लगातार 3 दिनों से स्ट्रीट लाइट पूरी तरह बंद है।',
    user_notes: null,
    ai_confidence: 0.91,
    ai_tags: ['streetlight', 'electrical'],
    ai_urgency_reason: 'Dark street in residential zone.',
    ai_suggested_department: 'Electrical',
    is_anonymous: false,
    visibility: 'public',
    suggested_authority_id: 2,
    ai_suggested_worker_id: '00000000-0000-0000-0000-000000000001',
    assigned_to: '00000000-0000-0000-0000-000000000001',
    assigned_by: '00000000-0000-0000-0000-000000000004',
    assigned_at: new Date(Date.now() - 7200000).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop',
    voice_url: null,
    status: 'assigned',
    status_updated_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default async function WorkerDashboardPage() {
  const isLocalDev = process.env.NODE_ENV === 'development';
  let active: Complaint[] | null = null;
  let completed: Complaint[] | null = null;
  let displayName = 'Demo Worker';

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && !isLocalDev) redirect('/login');

    if (user) {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('full_name, display_name')
        .eq('id', user.id)
        .single();
      if (profile) displayName = profile.display_name ?? profile.full_name ?? 'Worker';

      const { data: activeRows } = await supabase
        .from('complaints')
        .select('*')
        .eq('assigned_to', user.id)
        .in('status', ['assigned', 'in_progress'])
        .order('assigned_at', { ascending: false });
      active = activeRows as Complaint[];

      const { data: completedRows } = await supabase
        .from('complaints')
        .select('*')
        .eq('assigned_to', user.id)
        .in('status', ['proof_submitted', 'resolved', 'rejected'])
        .order('status_updated_at', { ascending: false })
        .limit(20);
      completed = completedRows as Complaint[];
    }
  } catch {
    // Handled in fallback below
  }

  const activeTasks = active && active.length > 0 ? active : DEMO_ACTIVE;
  const completedTasks = completed ?? [];

  return (
    <WorkerDashboardClient
      displayName={displayName}
      activeTasks={activeTasks}
      completedTasks={completedTasks}
    />
  );
}
