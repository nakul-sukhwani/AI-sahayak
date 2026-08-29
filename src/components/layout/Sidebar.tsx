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
    { href: '/dashboard',     key: 'home',    icon: 'home' },
    { href: '/dashboard/new', key: 'report',  icon: 'add_circle' },
    { href: '/feed',          key: 'feed',    icon: 'public' },
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
};

export function Sidebar() {
  const { role } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();

  if (!role) return null;

  const tabs = ROLE_TABS[role];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E2E8F0] min-h-screen sticky top-0">
      <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#001e40] to-[#2563eb] flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[18px]">account_balance</span>
        </div>
        <span className="font-semibold text-[#191c1e] tracking-tight">{t('portal_title')}</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-[#f0f4ff] text-[#2563eb] font-medium' 
                  : 'text-[#545f72] hover:bg-[#f7f9fb] hover:text-[#191c1e]'
              }`}
            >
              <span 
                className="material-symbols-outlined text-[20px]" 
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {tab.icon}
              </span>
              <span className="text-sm">{t(tab.key)}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Footer / Profile section */}
      <div className="p-4 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[#E2E8F0] flex items-center justify-center flex-shrink-0">
             <span className="material-symbols-outlined text-[#545f72] text-[18px]">person</span>
          </div>
          <div className="overflow-hidden">
             <p className="text-xs font-semibold text-[#191c1e] capitalize truncate">{role}</p>
             <p className="text-[10px] text-[#545f72] uppercase tracking-wider truncate">Account</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
