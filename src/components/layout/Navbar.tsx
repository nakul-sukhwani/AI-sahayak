'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { GovUtilityBar } from './GovUtilityBar';
import type { UserRole } from '@/types/user';
import type { TranslationKey } from '@/lib/translations';

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

const ROLE_LINKS: Record<UserRole, NavLink[]> = {
  citizen: [
    { href: '/dashboard',     label: 'My Complaints',  icon: 'assignment' },
    { href: '/dashboard/new', label: 'Report Issue',   icon: 'add_circle' },
    { href: '/feed',          label: 'Public Feed',    icon: 'public' },
  ],
  worker: [
    { href: '/worker', label: 'My Tasks', icon: 'construction' },
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
    { href: '/feed',             label: 'Feed',              icon: 'public' },
  ],
  community_org: [
    { href: '/ngo',           label: 'NGO Dashboard', icon: 'groups' },
    { href: '/dashboard/new', label: 'File Complaint', icon: 'add_circle' },
  ],
  pri_ulb_official: [
    { href: '/dashboard',     label: 'Dashboard',    icon: 'account_balance' },
    { href: '/dashboard/new', label: 'Report Issue', icon: 'add_circle' },
  ],
  university_admin: [
    { href: '/university',       label: 'Overview', icon: 'school' },
    { href: '/university/inbox', label: 'Inbox',    icon: 'inbox' },
  ],
  faculty_mentor: [
    { href: '/university',       label: 'Overview', icon: 'person_celebrate' },
    { href: '/university/inbox', label: 'Inbox',    icon: 'inbox' },
  ],
  student: [
    { href: '/university', label: 'Dashboard', icon: 'backpack' },
  ],
  industry_partner: [
    { href: '/industry', label: 'Dashboard', icon: 'business' },
  ],
};

const ROLE_PORTAL_LABEL: Partial<Record<UserRole, string>> = {
  citizen:          'Citizen Portal',
  worker:           'Field Worker Portal',
  admin:            'Admin Portal',
  community_org:    'NGO Portal',
  university_admin: 'University Portal',
  faculty_mentor:   'University Portal',
  student:          'University Portal',
  officer:          'Officer Portal',
  supervisor:       'Supervisor Portal',
};

export function Navbar() {
  const { profile, role, signOut } = useAuth();
  const pathname = usePathname();

  const effectiveRole: UserRole = role || (
    pathname.startsWith('/admin') ? 'admin' :
    pathname.startsWith('/worker') ? 'worker' :
    pathname.startsWith('/ngo') ? 'community_org' :
    pathname.startsWith('/university') ? 'university_admin' :
    pathname.startsWith('/industry') ? 'industry_partner' :
    'citizen'
  );

  const links = ROLE_LINKS[effectiveRole] ?? [];
  const portalLabel = ROLE_PORTAL_LABEL[effectiveRole] ?? 'Portal';

  const roleStyles: Record<string, { bg: string; color: string; border: string }> = {
    citizen: { bg: '#e8f5e9', color: '#1b5e20', border: '#a5d6a7' },
    worker: { bg: '#fef3e2', color: '#b45309', border: '#f6c17a' },
    admin: { bg: '#e3f0fd', color: '#1565c0', border: '#b8c4d6' },
    officer: { bg: '#e3f0fd', color: '#1565c0', border: '#b8c4d6' },
    community_org: { bg: '#e0f2f1', color: '#00695c', border: '#80cbc4' },
    university_admin: { bg: '#f3e5f5', color: '#4a148c', border: '#ce93d8' },
    faculty_mentor: { bg: '#f3e5f5', color: '#4a148c', border: '#ce93d8' },
    student: { bg: '#f3e5f5', color: '#4a148c', border: '#ce93d8' },
  };
  const activeStyle = roleStyles[effectiveRole] || roleStyles.admin;

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Utility bar */}
      <GovUtilityBar />

      {/* Brand header */}
      <div className="gov-brand-header">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Emblem + Name */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
            {/* Ashoka emblem substitute — circular navy badge */}
            <div className="w-11 h-11 rounded-full bg-[#002147] flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
              <span
                className="material-symbols-outlined text-white text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-[#002147] leading-tight tracking-tight flex items-center gap-2">
                <span>Nagrik Seva</span>
              </p>
              <p className="text-[11px] text-[#4a5568] leading-tight">
                Municipal Corporation &amp; Civic Services
              </p>
            </div>
          </Link>

          {/* Right: portal label + user + sign out */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border flex items-center gap-1.5 shadow-sm"
              style={{ background: activeStyle.bg, color: activeStyle.color, borderColor: activeStyle.border }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: activeStyle.color }}></span>
              {portalLabel}
            </span>

            {profile && (
              <span className="hidden md:block text-xs font-semibold text-[#1a2332] bg-[#f4f6fa] px-2.5 py-1 rounded-lg border border-[#dde3ed]">
                {profile.display_name ?? profile.full_name ?? 'User'}
              </span>
            )}
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="flex items-center gap-1.5 text-xs text-[#4a5568] hover:text-[#b71c1c] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[#ffebee] border border-transparent hover:border-[#ffcdd2]"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span className="hidden sm:block font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab nav bar — Modern Bento Pill Navigation */}
      {links.length > 0 && (
        <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)]">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href + '/'));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                    isActive
                      ? 'shadow-sm ring-1 ring-black/5'
                      : 'border-transparent text-[#545f72] hover:text-[#191c1e] hover:bg-slate-100/80'
                  }`}
                  style={
                    isActive
                      ? {
                          background: activeStyle.bg,
                          color: activeStyle.color,
                          borderColor: activeStyle.border,
                        }
                      : undefined
                  }
                >
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {link.icon}
                  </span>
                  {link.label}
                  {isActive && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: activeStyle.color }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
