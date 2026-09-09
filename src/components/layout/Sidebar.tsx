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
    { href: '/admin',            label: 'Overview',          icon: 'dashboard' },
    { href: '/admin/complaints', label: 'Recent Grievances', icon: 'assignment' },
    { href: '/feed',             label: 'Public Feed',       icon: 'public' },
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

  // Derive effective role from session or active route path
  const effectiveRole: UserRole = role || (
    pathname.startsWith('/admin') ? 'admin' :
    pathname.startsWith('/worker') ? 'worker' :
    pathname.startsWith('/ngo') ? 'community_org' :
    pathname.startsWith('/university') ? 'university_admin' :
    pathname.startsWith('/industry') ? 'industry_partner' :
    'citizen'
  );

  const tabs = ROLE_TABS[effectiveRole] ?? ROLE_TABS.citizen;

  // Active accent color per portal
  const roleAccent: Record<string, { bg: string; text: string; lightBg: string }> = {
    citizen: { bg: '#1b5e20', text: '#ffffff', lightBg: 'rgba(27,94,32,0.15)' },
    worker: { bg: '#b45309', text: '#ffffff', lightBg: 'rgba(180,83,9,0.15)' },
    admin: { bg: '#1565c0', text: '#ffffff', lightBg: 'rgba(21,101,192,0.15)' },
    officer: { bg: '#1565c0', text: '#ffffff', lightBg: 'rgba(21,101,192,0.15)' },
    community_org: { bg: '#00695c', text: '#ffffff', lightBg: 'rgba(0,105,92,0.15)' },
    university_admin: { bg: '#4a148c', text: '#ffffff', lightBg: 'rgba(74,20,140,0.15)' },
    faculty_mentor: { bg: '#4a148c', text: '#ffffff', lightBg: 'rgba(74,20,140,0.15)' },
    student: { bg: '#4a148c', text: '#ffffff', lightBg: 'rgba(74,20,140,0.15)' },
  };
  const accent = roleAccent[effectiveRole] || roleAccent.admin;

  return (
    <aside className="nx-sidebar hidden md:flex flex-col sticky top-0 self-start h-screen z-30 transition-all">
      {/* Logo strip */}
      <div className="px-4 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors">
            <span
              className="material-symbols-outlined text-white text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance
            </span>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
              <span>Nagrik Seva</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </p>
            <p className="text-[10px] text-white/60 leading-tight capitalize truncate">
              {effectiveRole.replace('_', ' ')} Portal
            </p>
          </div>
        </Link>
      </div>

      {/* Nav links with Quixotic pill-dock style */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href + '/'));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'text-white shadow-sm font-bold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              style={isActive ? { background: accent.bg } : {}}
            >
              <span
                className="material-symbols-outlined text-[19px] flex-shrink-0"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {tab.icon}
              </span>
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile & Portals */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5">
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
            {(profile?.display_name || profile?.full_name || effectiveRole)?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {profile?.display_name ?? profile?.full_name ?? 'Active User'}
            </p>
            <p className="text-[10px] text-white/50 uppercase tracking-wider capitalize truncate">
              {effectiveRole.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 pt-1">
          <Link
            href="/"
            title="Switch Portal"
            className="flex-1 py-1.5 px-2 rounded-lg text-center text-[11px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">swap_horiz</span>
            <span>Portals</span>
          </Link>
          <button
            onClick={signOut}
            title="Sign Out"
            className="py-1.5 px-2.5 rounded-lg text-[11px] font-medium text-red-300 hover:text-red-100 hover:bg-red-900/30 transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
