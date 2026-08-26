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
  { prefix: '/dashboard', roles: ['citizen'] },
  { prefix: '/worker', roles: ['worker'] },
  { prefix: '/supervisor', roles: ['supervisor', 'officer', 'admin'] },
  { prefix: '/admin', roles: ['admin'] },
];

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Refresh session — do NOT remove this block
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect authenticated users away from /login
  if (user && pathname === '/login') {
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    const role: UserRole = (profile?.role as UserRole) ?? 'citizen';
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = ROLE_REDIRECTS[role];
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect unauthenticated users away from protected routes
  if (!user) {
    const isProtected = PROTECTED_PREFIXES.some(({ prefix }) =>
      pathname.startsWith(prefix)
    );
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Role-based access control for protected prefixes
  if (user) {
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single();

    const role: UserRole = (profile?.role as UserRole) ?? 'citizen';

    for (const { prefix, roles } of PROTECTED_PREFIXES) {
      if (pathname.startsWith(prefix) && !roles.includes(role)) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = ROLE_REDIRECTS[role];
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return supabaseResponse;
}
