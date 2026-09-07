import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function NGOLayout({
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

      if (profile && profile.role !== 'community_org' && profile.role !== 'admin') {
        redirect('/dashboard');
      }
    }
  } catch {
    if (!isLocalDev) redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'var(--nx-bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
        <Navbar />
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 pb-24 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
