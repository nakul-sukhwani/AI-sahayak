import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function AdminLayout({
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

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
        <Navbar />
        <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 md:p-8">
          {children}
        </main>
      </div>
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
