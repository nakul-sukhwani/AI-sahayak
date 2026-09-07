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
    { href: '/dashboard',     label: 'My Complaints', icon: 'home' },
    { href: '/dashboard/new', label: 'Report',         icon: 'add_circle' },
    { href: '/feed',          label: 'Feed',           icon: 'public' },
  ],
  worker: [
    { href: '/worker', label: 'Tasks', icon: 'construction' },
  ],
  supervisor: [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  ],
  officer: [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  ],
  admin: [
    { href: '/admin', label: 'Admin',      icon: 'admin_panel_settings' },
    { href: '/feed',  label: 'Public Feed', icon: 'public' },
  ],
  community_org:    [
    { href: '/ngo',           label: 'Dashboard',     icon: 'groups' },
    { href: '/dashboard/new', label: 'File Complaint', icon: 'add_circle' },
  ],
  pri_ulb_official: [{ href: '/dashboard',  label: 'Dashboard',  icon: 'account_balance' }],
  university_admin: [
    { href: '/university',       label: 'Overview', icon: 'school' },
    { href: '/university/inbox', label: 'Inbox',    icon: 'inbox' },
  ],
  faculty_mentor:   [
    { href: '/university',       label: 'Overview', icon: 'person_celebrate' },
    { href: '/university/inbox', label: 'Inbox',    icon: 'inbox' },
  ],
  student:          [{ href: '/university',  label: 'Dashboard', icon: 'backpack' }],
  industry_partner: [{ href: '/industry',    label: 'Dashboard', icon: 'business' }],
};

export function Sidebar() {
  const { role, profile, signOut } = useAuth();
  const pathname = usePathname();

  if (!role) return null;

  const tabs = ROLE_TABS[role];

  return (
    <aside className="nx-sidebar hidden md:flex flex-col sticky top-0 self-start h-screen">
      {/* Logo strip */}
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
            <span
              className="material-symbols-outlined text-white text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Nagrik Seva</p>
            <p className="text-[10px] text-white/50 leading-tight capitalize">{role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href + '/'));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`nx-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span
                className="material-symbols-outlined text-[18px] flex-shrink-0"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {tab.icon}
              </span>
              <span className="text-sm">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / sign out */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white/80 text-[16px]">person</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">
              {profile?.display_name ?? profile?.full_name ?? 'User'}
            </p>
            <p className="text-[10px] text-white/50 uppercase tracking-wider capitalize truncate">
              {role.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="nx-sidebar-link w-full text-left hover:bg-red-900/40 hover:text-red-200 hover:border-l-red-400"
        >
          <span className="material-symbols-outlined text-[18px] flex-shrink-0">logout</span>
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
