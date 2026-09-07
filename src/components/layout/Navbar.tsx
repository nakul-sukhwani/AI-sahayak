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
    { href: '/admin', label: 'Admin',   icon: 'admin_panel_settings' },
    { href: '/feed',  label: 'Feed',    icon: 'public' },
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
  const links = role ? ROLE_LINKS[role] : [];
  const portalLabel = role ? (ROLE_PORTAL_LABEL[role] ?? 'Portal') : '';

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Utility bar */}
      <GovUtilityBar />

      {/* Brand header */}
      <div className="gov-brand-header">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Emblem + Name */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            {/* Ashoka emblem substitute — circular navy badge */}
            <div className="w-11 h-11 rounded-full bg-[#002147] flex items-center justify-center flex-shrink-0 shadow-sm">
              <span
                className="material-symbols-outlined text-white text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-[#002147] leading-tight tracking-tight">
                Nagrik Seva
              </p>
              <p className="text-[11px] text-[#4a5568] leading-tight">
                Municipal Corporation &amp; Civic Services
              </p>
            </div>
          </Link>

          {/* Right: portal label + user + sign out */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {portalLabel && (
              <span className="hidden sm:inline text-xs font-semibold text-[#4a5568] uppercase tracking-widest bg-[#f4f6fa] border border-[#dde3ed] px-2.5 py-1 rounded">
                {portalLabel}
              </span>
            )}
            {profile && (
              <span className="hidden md:block text-sm font-medium text-[#1a2332]">
                {profile.display_name ?? profile.full_name ?? 'User'}
              </span>
            )}
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="flex items-center gap-1.5 text-xs text-[#4a5568] hover:text-[#b71c1c] transition-colors px-2.5 py-1.5 rounded hover:bg-[#ffebee] border border-transparent hover:border-[#ffcdd2]"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span className="hidden sm:block font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab nav bar — dark navy */}
      {links.length > 0 && (
        <nav className="nx-tab-nav">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-end overflow-x-auto">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href + '/'));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nx-tab-link flex items-center gap-1.5 whitespace-nowrap ${isActive ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined text-sm">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
