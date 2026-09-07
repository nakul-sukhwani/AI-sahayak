'use client';

import React, { useEffect, useRef } from 'react';

export type DashboardPortalVariant =
  | 'citizen'
  | 'worker'
  | 'admin'
  | 'ngo'
  | 'university'
  | 'navy';

interface PortalThemeConfig {
  orb1: string; // Top-left drifting aurora
  orb2: string; // Top-right / center aurora
  orb3: string; // Bottom-right aurora
  spotlight: string; // Cursor/touch interactive soft beam
  accent: string;
  badgeCode: string;
}

const THEMES: Record<DashboardPortalVariant, PortalThemeConfig> = {
  citizen: {
    orb1: 'rgba(27, 94, 32, 0.13)',      // Forest green
    orb2: 'rgba(16, 185, 129, 0.10)',    // Emerald
    orb3: 'rgba(14, 165, 233, 0.07)',    // Clear sky
    spotlight: 'rgba(16, 185, 129, 0.11)',
    accent: '#1b5e20',
    badgeCode: 'JH-CITIZEN // 23.3441° N, 85.3096° E',
  },
  worker: {
    orb1: 'rgba(180, 83, 9, 0.14)',      // Warm amber
    orb2: 'rgba(245, 158, 11, 0.10)',    // Golden ochre
    orb3: 'rgba(234, 88, 12, 0.08)',     // Terracotta
    spotlight: 'rgba(217, 119, 6, 0.12)',
    accent: '#b45309',
    badgeCode: 'JH-FIELD-OPS // 23.3441° N, 85.3096° E',
  },
  admin: {
    orb1: 'rgba(21, 101, 192, 0.14)',    // Gov Royal Blue
    orb2: 'rgba(67, 56, 202, 0.10)',     // Indigo
    orb3: 'rgba(6, 182, 212, 0.08)',     // Cyan azure
    spotlight: 'rgba(21, 101, 192, 0.12)',
    accent: '#1565c0',
    badgeCode: 'JH-ADMIN-SEC // 23.3441° N, 85.3096° E',
  },
  ngo: {
    orb1: 'rgba(0, 105, 92, 0.14)',      // Deep teal
    orb2: 'rgba(13, 148, 136, 0.10)',    // Marine cyan
    orb3: 'rgba(16, 185, 129, 0.08)',    // Mint
    spotlight: 'rgba(0, 105, 92, 0.12)',
    accent: '#00695c',
    badgeCode: 'JH-CIVIC-AUDIT // 23.3441° N, 85.3096° E',
  },
  university: {
    orb1: 'rgba(74, 20, 140, 0.13)',     // Royal purple
    orb2: 'rgba(124, 58, 237, 0.10)',    // Deep violet
    orb3: 'rgba(67, 56, 202, 0.08)',     // Indigo
    spotlight: 'rgba(124, 58, 237, 0.11)',
    accent: '#4a148c',
    badgeCode: 'JH-ACADEMIC // 23.3441° N, 85.3096° E',
  },
  navy: {
    orb1: 'rgba(0, 33, 71, 0.13)',
    orb2: 'rgba(30, 58, 138, 0.10)',
    orb3: 'rgba(14, 165, 233, 0.07)',
    spotlight: 'rgba(0, 33, 71, 0.10)',
    accent: '#002147',
    badgeCode: 'JH-STATE-PORTAL // 23.3441° N, 85.3096° E',
  },
};

export function DynamicDashboardBackground({
  variant = 'citizen',
  className = '',
}: {
  variant: DashboardPortalVariant;
  className?: string;
}) {
  const theme = THEMES[variant] || THEMES.citizen;
  const spotlightRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({
    x: -2000,
    y: -2000,
    targetX: -2000,
    targetY: -2000,
    active: false,
  });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      posRef.current.targetX = e.clientX;
      posRef.current.targetY = e.clientY;
      if (!posRef.current.active) {
        posRef.current.active = true;
        if (spotlightRef.current) {
          spotlightRef.current.style.opacity = '1';
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        posRef.current.targetX = e.touches[0].clientX;
        posRef.current.targetY = e.touches[0].clientY;
        if (!posRef.current.active) {
          posRef.current.active = true;
          if (spotlightRef.current) {
            spotlightRef.current.style.opacity = '1';
          }
        }
      }
    };

    const onPointerLeave = () => {
      posRef.current.active = false;
      if (spotlightRef.current) {
        spotlightRef.current.style.opacity = '0';
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave, { passive: true });

    let isRunning = true;
    const tick = () => {
      if (!isRunning) return;
      const pos = posRef.current;
      pos.x += (pos.targetX - pos.x) * 0.12;
      pos.y += (pos.targetY - pos.y) * 0.12;

      if (spotlightRef.current && pos.x > -1000) {
        spotlightRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }

      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (rafId.current) cancelAnimationFrame(rafId.current);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <div
      className={`nx-dynamic-bg ${className}`}
      aria-hidden="true"
      style={{
        pointerEvents: 'none', // Guarantees zero obstruction to buttons/inputs/links
      }}
    >
      {/* ── Layer 1: Precision Micro-Grid Vignette ────────────────────── */}
      <div className="absolute inset-0 nx-grid-vignette opacity-70" />

      {/* ── Layer 2: Dynamic Ambient Aurora Orbs (Hardware Accelerated) ─ */}
      {/* Orb 1: Upper left drifting bloom */}
      <div
        className="nx-mesh-orb-1 absolute -top-32 -left-20 w-[520px] h-[520px] rounded-full blur-[90px] md:blur-[120px] pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${theme.orb1} 0%, transparent 70%)`,
        }}
      />

      {/* Orb 2: Top right / center drifting bloom */}
      <div
        className="nx-mesh-orb-2 absolute top-12 right-[-10%] w-[580px] h-[580px] rounded-full blur-[100px] md:blur-[140px] pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${theme.orb2} 0%, transparent 70%)`,
        }}
      />

      {/* Orb 3: Mid-page floating subtle ambient counter-balance */}
      <div
        className="nx-mesh-orb-3 absolute top-[380px] left-[20%] w-[460px] h-[460px] rounded-full blur-[90px] md:blur-[130px] pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${theme.orb3} 0%, transparent 75%)`,
        }}
      />

      {/* ── Layer 3: Interactive Cursor/Touch Spotlight ───────────────── */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[80px] md:blur-[100px] pointer-events-none transition-opacity duration-500 ease-out"
        style={{
          background: `radial-gradient(circle, ${theme.spotlight} 0%, transparent 70%)`,
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      />

      {/* ── Layer 4: Ambient Diagonal Light Sweep Beam ────────────────── */}
      <div className="absolute inset-x-0 -top-32 h-[380px] overflow-hidden pointer-events-none opacity-40">
        <div
          className="nx-light-sweep-beam w-full h-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)`,
          }}
        />
      </div>

      {/* ── Layer 5: Technical Micro-Accents (Minimal & Editorial) ────── */}
      <div className="absolute top-6 left-6 flex items-center gap-1.5 opacity-30 select-none">
        <span className="text-[9px] font-mono tracking-widest uppercase text-[#002147]">
          +
        </span>
        <span className="text-[8px] font-mono tracking-widest text-[#718096] hidden sm:inline">
          {theme.badgeCode}
        </span>
      </div>

      <div className="absolute top-6 right-8 flex items-center gap-2 opacity-30 select-none">
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: theme.accent }}
        />
        <span className="text-[8px] font-mono uppercase tracking-widest text-[#718096] hidden sm:inline">
          SYS // ACTIVE
        </span>
        <span className="text-[9px] font-mono tracking-widest uppercase text-[#002147]">
          +
        </span>
      </div>
    </div>
  );
}
