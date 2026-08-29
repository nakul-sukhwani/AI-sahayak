import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { WorkerComplaintDetailClient } from './WorkerComplaintDetailClient';
import type { Complaint } from '@/types/complaint';

export const metadata: Metadata = {
  title: 'Task Details — Worker Portal',
  description: 'View assigned civic task details and update status.',
};

interface Props {
  params: Promise<{ id: string }>;
}

const DEMO_COMPLAINTS: Record<string, Complaint> = {
  'demo-task-1': {
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
  'demo-task-2': {
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
  }
};

export default async function WorkerComplaintPage({ params }: Props) {
  const { id } = await params;
  let complaint: Complaint | null = null;
  let imageSignedUrl: string | null = null;

  try {
    const supabase = await createClient();
    const { data: row } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (row) {
      complaint = row as Complaint;
      if (complaint.image_url) {
        const { data } = await supabase.storage
          .from('complaints')
          .createSignedUrl(complaint.image_url, 3600);
        imageSignedUrl = data?.signedUrl ?? null;
      }
    }
  } catch {
    // Fallback to demo
  }

  // Fallback demo complaint
  if (!complaint) {
    complaint = DEMO_COMPLAINTS[id] ?? {
      ...DEMO_COMPLAINTS['demo-task-1'],
      id,
    };
    imageSignedUrl = complaint.image_url;
  }

  return (
    <WorkerComplaintDetailClient
      complaint={complaint}
      imageSignedUrl={imageSignedUrl}
    />
  );
}
