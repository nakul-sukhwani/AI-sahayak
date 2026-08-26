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
    { href: '/dashboard',     label: 'Home',    icon: 'home' },
    { href: '/dashboard/new', label: 'Report',  icon: 'add_circle' },
    { href: '/feed',          label: 'Feed',    icon: 'public' },
  ],
  worker: [
    { href: '/worker', label: 'Tasks', icon: 'construction' },
  ],
  supervisor: [
    { href: '/supervisor', label: 'Assign', icon: 'assignment_ind' },
  ],
  officer: [
    { href: '/supervisor/verify', label: 'Verify', icon: 'verified' },
  ],
  admin: [
    { href: '/admin',             label: 'Admin',  icon: 'admin_panel_settings' },
    { href: '/supervisor',        label: 'Assign', icon: 'assignment_ind' },
    { href: '/supervisor/verify', label: 'Verify', icon: 'verified' },
  ],
};

export function MobileNav() {
  const { role } = useAuth();
  const pathname = usePathname();

  if (!role) return null;

  const tabs = ROLE_TABS[role];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] safe-area-pb">
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px]',
                'text-xs font-medium transition-colors',
                isActive ? 'text-[#001e40]' : 'text-[#737780]',
              ].join(' ')}
            >
              <span
                className="material-symbols-outlined text-xl leading-none"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#001e40] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
