import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/user';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Role-based redirect
      const { data: profileData } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', data.user.id)
        .single();
      
      const role = (profileData?.role as UserRole) ?? 'citizen';
      
      const ROLE_REDIRECTS: Record<UserRole, string> = {
        citizen:          '/dashboard',
        worker:           '/worker',
        supervisor:       '/supervisor',
        officer:          '/supervisor/verify',
        admin:            '/admin',
        // SIH 26043
        community_org:    '/dashboard',
        pri_ulb_official: '/dashboard',
        university_admin: '/university',
        faculty_mentor:   '/university',
        student:          '/university',
        industry_partner: '/industry',
      };
      
      return NextResponse.redirect(`${origin}${ROLE_REDIRECTS[role]}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
