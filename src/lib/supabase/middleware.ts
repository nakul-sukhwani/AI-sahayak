import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@/types/user';

const ROLE_REDIRECTS: Record<UserRole, string> = {
  citizen: '/dashboard',
  worker: '/worker',
  supervisor: '/supervisor',
  officer: '/supervisor/verify',
  admin: '/admin',
};

const PROTECTED_PREFIXES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/dashboard', roles: ['citizen', 'supervisor', 'officer', 'admin'] },
  { prefix: '/worker', roles: ['worker'] },
  { prefix: '/supervisor/verify', roles: ['officer', 'admin'] },
  { prefix: '/supervisor', roles: ['supervisor', 'admin'] },
  { prefix: '/admin', roles: ['admin'] },
];

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  // Enable demo / local mode on localhost or development environment
  const isLocalDev =
    process.env.NODE_ENV === 'development' ||
    request.nextUrl.hostname === 'localhost' ||
    request.nextUrl.hostname === '127.0.0.1';

  let user = null;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    user = null;
  }

  const pathname = request.nextUrl.pathname;

  // In local dev mode, allow navigating to any route without forcing login redirect
  if (isLocalDev && !user) {
    return supabaseResponse;
  }

  // Redirect authenticated users away from /login
  if (user && pathname === '/login') {
    const { data: profile } = await (await import('@/lib/supabase/server')).createClient().then(s => 
      s.from('users_profile').select('role').eq('id', user.id).single()
    ).catch(() => ({ data: null }));

    const role: UserRole = (profile?.role as UserRole) ?? 'citizen';
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = ROLE_REDIRECTS[role];
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect unauthenticated users away from protected routes in production
  if (!user && !isLocalDev) {
    const isProtected = PROTECTED_PREFIXES.some(({ prefix }) =>
      pathname.startsWith(prefix)
    );
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Role-based access control for protected prefixes in production
  if (user && !isLocalDev) {
    const { data: profile } = await (await import('@/lib/supabase/server')).createClient().then(s => 
      s.from('users_profile').select('role').eq('id', user.id).single()
    ).catch(() => ({ data: null }));

    const role: UserRole = (profile?.role as UserRole) ?? 'citizen';

    const matchedPrefixes = PROTECTED_PREFIXES.filter(({ prefix }) =>
      pathname.startsWith(prefix)
    );

    if (matchedPrefixes.length > 0) {
      const matched = matchedPrefixes.sort((a, b) => b.prefix.length - a.prefix.length)[0];
      
      if (!matched.roles.includes(role)) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = ROLE_REDIRECTS[role];
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return supabaseResponse;
}
