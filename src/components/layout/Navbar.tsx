'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/translations';
import type { UserRole } from '@/types/user';

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

const ROLE_LINKS: Record<UserRole, NavLink[]> = {
  citizen: [
    { href: '/dashboard', label: 'My Complaints', icon: 'assignment' },
    { href: '/dashboard/new', label: 'Report Issue', icon: 'add_circle' },
    { href: '/feed', label: 'Public Feed', icon: 'public' },
  ],
  worker: [
    { href: '/worker', label: 'My Tasks', icon: 'construction' },
  ],
  supervisor: [
    { href: '/supervisor', label: 'Assignment Queue', icon: 'assignment_ind' },
    { href: '/supervisor/verify', label: 'Verify Proof', icon: 'verified' },
  ],
  officer: [
    { href: '/supervisor/verify', label: 'Verify Proof', icon: 'verified' },
    { href: '/supervisor', label: 'All Complaints', icon: 'list_alt' },
  ],
  admin: [
    { href: '/admin', label: 'Admin', icon: 'admin_panel_settings' },
    { href: '/supervisor', label: 'All Complaints', icon: 'list_alt' },
    { href: '/supervisor/verify', label: 'Verify Proof', icon: 'verified' },
  ],
};

export function Navbar() {
  const { profile, role, signOut } = useAuth();
  const { lang, changeLanguage } = useLanguage();
  const pathname = usePathname();

  const links = role ? ROLE_LINKS[role] : [];

  return (
    <nav className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40 w-full">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span
            className="material-symbols-outlined text-[#001e40] text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_balance
          </span>
          <span className="text-base font-semibold text-[#001e40] tracking-tight hidden sm:block">
            Nagrik Seva
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#f7f9fb] text-[#001e40]'
                    : 'text-[#545f72] hover:text-[#001e40] hover:bg-[#f7f9fb]',
                ].join(' ')}
              >
                <span className="material-symbols-outlined text-base">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Global Language Selector */}
          <div className="flex items-center bg-[#f7f9fb] border border-[#E2E8F0] rounded-lg px-2 py-1 text-xs text-[#001e40] font-medium hover:border-[#001e40] transition-colors">
            <span className="material-symbols-outlined text-sm mr-1 text-[#545f72]">translate</span>
            <select
              id="nav-lang-select"
              aria-label="Select Language"
              value={lang}
              onChange={(e) => changeLanguage(e.target.value as SupportedLocale)}
              className="bg-transparent text-xs font-semibold text-[#001e40] focus:outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LOCALES.map((locale) => (
                <option key={locale.code} value={locale.code}>
                  {locale.label} ({locale.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {profile && (
            <span className="hidden sm:block text-sm text-[#545f72]">
              {profile.display_name ?? profile.full_name ?? 'User'}
            </span>
          )}

          <button
            onClick={signOut}
            aria-label="Sign out"
            className="flex items-center gap-1.5 text-sm text-[#545f72] hover:text-[#DC2626] transition-colors px-2 py-1.5 rounded-lg hover:bg-[#fee2e2]"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span className="hidden sm:block">Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
