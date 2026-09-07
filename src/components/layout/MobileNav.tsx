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
    { href: '/admin', label: 'Admin', icon: 'admin_panel_settings' },
    { href: '/feed',  label: 'Feed',  icon: 'public' },
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

  if (!role) return null;

  const tabs = ROLE_TABS[role];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#002147] border-t border-white/10 safe-area-pb">
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href + '/'));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] relative',
                'text-xs font-medium transition-colors',
                isActive ? 'text-white' : 'text-white/55 hover:text-white/80',
              ].join(' ')}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-white rounded-full" />
              )}
              <span
                className="material-symbols-outlined text-xl leading-none"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
