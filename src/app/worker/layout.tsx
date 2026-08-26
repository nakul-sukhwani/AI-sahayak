import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users_profile')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['worker', 'admin'].includes(profile.role)) {
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
