import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export interface CommunityDrive {
  id: string;
  title: string;
  description: string;
  drive_type: 'cleanup' | 'plantation' | 'pothole_shramdaan' | 'drainage_unblock';
  ward_name: string;
  meeting_point: string;
  scheduled_date: string;
  volunteers_count: number;
  max_volunteers: number;
  organizer_org: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  is_joined?: boolean;
}

// In-memory persistent seed store for dev & live instances
let globalDrives: CommunityDrive[] = [
  {
    id: 'drive-01',
    title: 'Indiranagar 100ft Road Shramdaan & Debris Clearing',
    description:
      'Community volunteers coming together to clear broken kerb construction gravel, paint pedestrian crossings, and unblock corner storm drains.',
    drive_type: 'cleanup',
    ward_name: 'Indiranagar',
    meeting_point: 'Near Domlur Flyover Underpass & 12th Main Junction',
    scheduled_date: 'This Sunday · 07:30 AM',
    volunteers_count: 24,
    max_volunteers: 40,
    organizer_org: 'Bangalore Civic Action Alliance',
    status: 'upcoming',
  },
  {
    id: 'drive-02',
    title: 'HSR Layout Sector 2 Cold-Mix Pothole Patching Drive',
    description:
      'Volunteer drive to apply emergency cold-mix bitumen patches to 14 recurrent potholes near high-density residential school zones.',
    drive_type: 'pothole_shramdaan',
    ward_name: 'Ward 174 - HSR Layout',
    meeting_point: 'HSR BDA Complex Main Entrance Gate',
    scheduled_date: 'Saturday · 08:00 AM',
    volunteers_count: 18,
    max_volunteers: 25,
    organizer_org: 'Citizen First Karnataka',
    status: 'upcoming',
  },
  {
    id: 'drive-03',
    title: 'Koramangala 4th Block Green Native Tree Plantation',
    description:
      'Planting 60 native Neem and Honge saplings along footpath edges to prevent illegal garbage dumping and restore canopy shade.',
    drive_type: 'plantation',
    ward_name: 'Ward 151 - Koramangala',
    meeting_point: 'Koramangala 4th Block Park Gazebo',
    scheduled_date: 'Next Sunday · 07:00 AM',
    volunteers_count: 32,
    max_volunteers: 50,
    organizer_org: 'Green Bangalore Foundation',
    status: 'upcoming',
  },
];

const CreateDriveSchema = z.object({
  action: z.enum(['create', 'join', 'leave']),
  drive_id: z.string().optional(),
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(10).max(500).optional(),
  drive_type: z.enum(['cleanup', 'plantation', 'pothole_shramdaan', 'drainage_unblock']).default('cleanup'),
  ward_name: z.string().min(2).optional(),
  meeting_point: z.string().min(3).optional(),
  scheduled_date: z.string().min(3).optional(),
  max_volunteers: z.number().int().min(5).max(200).default(30),
}).strict();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const ward = searchParams.get('ward');

    let drives = [...globalDrives];
    if (ward && ward !== 'all') {
      drives = drives.filter((d) => d.ward_name.toLowerCase().includes(ward.toLowerCase()));
    }

    return NextResponse.json({ drives });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch community drives' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const parsed = CreateDriveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { action, drive_id, title, description, drive_type, ward_name, meeting_point, scheduled_date, max_volunteers } = parsed.data;

    if (action === 'leave') {
      if (!drive_id) return NextResponse.json({ error: 'drive_id required to cancel RSVP' }, { status: 400 });
      const target = globalDrives.find((d) => d.id === drive_id);
      if (!target) return NextResponse.json({ error: 'Drive not found' }, { status: 404 });

      target.volunteers_count = Math.max(0, target.volunteers_count - 1);
      target.is_joined = false;

      return NextResponse.json({
        success: true,
        message: `Cancelled volunteer RSVP for ${target.title}.`,
        drive: target,
      });
    }

    if (action === 'join') {
      if (!drive_id) return NextResponse.json({ error: 'drive_id required to join' }, { status: 400 });
      const target = globalDrives.find((d) => d.id === drive_id);
      if (!target) return NextResponse.json({ error: 'Drive not found' }, { status: 404 });

      target.volunteers_count += 1;
      target.is_joined = true;

      return NextResponse.json({
        success: true,
        message: `Successfully joined ${target.title}! You are registered as volunteer #${target.volunteers_count}.`,
        drive: target,
      });
    }

    // Role check for creating a drive
    let orgName = 'Civic Community Organization';
    if (user) {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('full_name, display_name, submitter_org_name, role')
        .eq('id', user.id)
        .single();

      if (profile?.submitter_org_name || profile?.display_name || profile?.full_name) {
        orgName = profile.submitter_org_name || profile.display_name || profile.full_name;
      }
    }

    if (!title || !description || !ward_name || !meeting_point) {
      return NextResponse.json({ error: 'All drive details are required' }, { status: 400 });
    }

    const newDrive: CommunityDrive = {
      id: `drive-${Date.now()}`,
      title,
      description,
      drive_type,
      ward_name,
      meeting_point,
      scheduled_date: scheduled_date || 'Upcoming Weekend · 08:00 AM',
      volunteers_count: 1,
      max_volunteers,
      organizer_org: orgName,
      status: 'upcoming',
      is_joined: true,
    };

    globalDrives.unshift(newDrive);

    return NextResponse.json({
      success: true,
      message: 'Community Action Drive published successfully!',
      drive: newDrive,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error handling community drive' },
      { status: 500 }
    );
  }
}
