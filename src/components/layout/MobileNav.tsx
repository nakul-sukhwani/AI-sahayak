'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import type { UserRole } from '@/types/user';
import type { TranslationKey } from '@/lib/translations';

interface NavTab {
  href: string;
  key: TranslationKey;
  icon: string;
}

const ROLE_TABS: Record<UserRole, NavTab[]> = {
  citizen: [
    { href: '/dashboard',     key: 'home',   icon: 'home' },
    { href: '/dashboard/new', key: 'report', icon: 'add_circle' },
    { href: '/feed',          key: 'feed',   icon: 'public' },
  ],
  worker: [
    { href: '/worker', key: 'tasks', icon: 'construction' },
  ],
  supervisor: [
    { href: '/supervisor', key: 'assign', icon: 'assignment_ind' },
  ],
  officer: [
    { href: '/supervisor/verify', key: 'verify', icon: 'verified' },
  ],
  admin: [
    { href: '/admin',             key: 'admin',  icon: 'admin_panel_settings' },
    { href: '/supervisor',        key: 'assign', icon: 'assignment_ind' },
    { href: '/supervisor/verify', key: 'verify', icon: 'verified' },
  ],
  // SIH 26043
  community_org:    [{ href: '/dashboard',  key: 'home', icon: 'groups' }],
  pri_ulb_official: [{ href: '/dashboard',  key: 'home', icon: 'account_balance' }],
  university_admin: [{ href: '/university', key: 'home', icon: 'school' }],
  faculty_mentor:   [{ href: '/university', key: 'home', icon: 'person_celebrate' }],
  student:          [{ href: '/university', key: 'home', icon: 'backpack' }],
  industry_partner: [{ href: '/industry',   key: 'home', icon: 'business' }],
};

export function MobileNav() {
  const { role } = useAuth();
  const { t } = useLanguage();
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
              <span>{t(tab.key)}</span>
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
