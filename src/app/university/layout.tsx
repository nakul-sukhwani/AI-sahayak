import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';

export default async function UniversityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLocalDev = process.env.NODE_ENV === 'development';

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !isLocalDev) redirect('/login');

    if (user) {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role;
      const allowedRoles = ['university_admin', 'faculty_mentor', 'student', 'admin'];

      if ((!role || !allowedRoles.includes(role)) && !isLocalDev) {
        redirect('/dashboard'); // Fallback if they don't have university access
      }
    }
  } catch {
    if (!isLocalDev) redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--nx-bg)' }}>
      <Navbar />
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 pb-24 md:pb-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
