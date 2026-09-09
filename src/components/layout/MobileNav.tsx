'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/user';

interface NavTab {
  href: string;
  label: string;
  icon: string;
}

const ROLE_TABS: Record<UserRole, NavTab[]> = {
  citizen: [
    { href: '/dashboard',     label: 'Home',   icon: 'home' },
    { href: '/dashboard/new', label: 'Report', icon: 'add_circle' },
    { href: '/feed',          label: 'Feed',   icon: 'public' },
  ],
  worker: [
    { href: '/worker', label: 'Tasks', icon: 'construction' },
  ],
  supervisor:   [{ href: '/dashboard', label: 'Home',      icon: 'home' }],
  officer:      [{ href: '/dashboard', label: 'Home',      icon: 'home' }],
  admin:        [
    { href: '/admin',            label: 'Overview',   icon: 'dashboard' },
    { href: '/admin/complaints', label: 'Grievances', icon: 'assignment' },
    { href: '/feed',             label: 'Feed',       icon: 'public' },
  ],
  community_org:    [
    { href: '/ngo',           label: 'NGO',    icon: 'groups' },
    { href: '/dashboard/new', label: 'Report', icon: 'add_circle' },
  ],
  pri_ulb_official: [{ href: '/dashboard',  label: 'Home',      icon: 'account_balance' }],
  university_admin: [
    { href: '/university',       label: 'Overview', icon: 'school' },
    { href: '/university/inbox', label: 'Inbox',    icon: 'inbox' },
  ],
  faculty_mentor:   [
    { href: '/university',       label: 'Overview', icon: 'person_celebrate' },
    { href: '/university/inbox', label: 'Inbox',    icon: 'inbox' },
  ],
  student:          [{ href: '/university', label: 'Portal',  icon: 'backpack' }],
  industry_partner: [{ href: '/industry',   label: 'Portal',  icon: 'business' }],
};

export function MobileNav() {
  const { role } = useAuth();
  const pathname = usePathname();

  const effectiveRole: UserRole = role || (
    pathname.startsWith('/admin') ? 'admin' :
    pathname.startsWith('/worker') ? 'worker' :
    pathname.startsWith('/ngo') ? 'community_org' :
    pathname.startsWith('/university') ? 'university_admin' :
    pathname.startsWith('/industry') ? 'industry_partner' :
    'citizen'
  );

  const tabs = ROLE_TABS[effectiveRole] ?? [];
  if (tabs.length === 0) return null;

  const roleAccents: Record<string, string> = {
    citizen: '#1b5e20',
    worker: '#b45309',
    admin: '#1565c0',
    officer: '#1565c0',
    community_org: '#00695c',
    university_admin: '#4a148c',
  };
  const activeColor = roleAccents[effectiveRole] || '#002147';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href + '/'));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all duration-200 ${
                isActive
                  ? 'text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`w-9 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive ? 'shadow-sm' : ''
                }`}
                style={
                  isActive
                    ? { background: `${activeColor}18`, color: activeColor }
                    : undefined
                }
              >
                <span
                  className="material-symbols-outlined text-xl leading-none"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {tab.icon}
                </span>
              </div>
              <span className="mt-0.5 tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
