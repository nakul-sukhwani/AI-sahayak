import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLocalDev = process.env.NODE_ENV === 'development';
  let user = null;
  let role = 'worker';

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user) {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile?.role) role = profile.role;
    }
  } catch {
    user = null;
  }

  if (!user && !isLocalDev) {
    redirect('/login');
  }

  if (user && !['worker', 'admin'].includes(role) && !isLocalDev) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
