import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--nx-bg)' }}>

      {/* ── Utility bar ─────────────────────────────────────────── */}
      <div className="gov-utility-bar">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-9 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🇮🇳</span>
            <span className="text-xs font-medium tracking-wide text-white/85 hidden sm:inline">
              Government of India
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60 hidden sm:inline">Skip to main content</span>
            <Link href="/login" className="text-xs text-white/85 hover:text-white font-medium transition-colors">
              Portal Login →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Brand header ─────────────────────────────────────────── */}
      <div className="gov-brand-header">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#002147] flex items-center justify-center shadow-md flex-shrink-0">
              <span
                className="material-symbols-outlined text-white text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#002147] leading-tight tracking-tight">
                Nagrik Seva
              </h1>
              <p className="text-[12px] text-[#4a5568] leading-tight">
                Municipal Corporation &amp; Urban Development
              </p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: 'Home', href: '/', icon: 'home' },
              { label: 'About Us', href: '#about', icon: '' },
              { label: 'Contact Us', href: '#contact', icon: 'phone' },
              { label: 'Helpdesk', href: '#', icon: 'help' },
            ].map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#4a5568] hover:text-[#002147] rounded transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Tab nav ────────────────────────────────────────────────── */}
      <nav className="nx-tab-nav border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-end">
          <Link href="/" className="nx-tab-link active flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">home</span>
            Home
          </Link>
          <Link href="#about" className="nx-tab-link flex items-center gap-1.5">About Us</Link>
          <Link href="#contact" className="nx-tab-link flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">phone</span>
            Contact Us
          </Link>
          <Link href="#" className="nx-tab-link flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">mail</span>
            Helpdesk
          </Link>
        </div>
      </nav>

      {/* ── Hero banner ─────────────────────────────────────────────── */}
      <main id="main-content" className="flex-1">
        {/* Banner image strip */}
        <div
          className="relative h-52 md:h-64 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #002147 0%, #003166 50%, #1565c0 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-16 w-40 h-40 rounded-full border-4 border-white" />
            <div className="absolute -bottom-8 right-32 w-28 h-28 rounded-full border-2 border-white" />
            <div className="absolute top-8 left-1/3 w-20 h-20 rounded-full border-2 border-white" />
          </div>

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
            {/* Ashoka emblem */}
            <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center mb-3">
              <span
                className="material-symbols-outlined text-white text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance
              </span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
              Nagrik Seva
            </h2>
            <p className="text-white/80 text-sm md:text-base mt-1">
              Municipal Corporation &amp; Urban Development
            </p>
          </div>
        </div>

        {/* ── Welcome + Portal Cards ─────────────────────────────── */}
        <div className="bg-[#f8fafc] border-b border-[#dde3ed] py-12 px-4">
          <div className="max-w-5xl mx-auto text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e8eef6] text-[#002147] mb-3">
              <span className="w-2 h-2 rounded-full bg-[#1565c0] animate-pulse"></span>
              Unified Municipal Portal Network
            </span>
            <h2 className="text-3xl font-bold text-[#002147] tracking-tight mb-2">Select Your Workspace</h2>
            <p className="text-[#4a5568] max-w-xl mx-auto text-sm">
              Role-specific workspaces for citizens, on-field personnel, municipal officers, and civic oversight.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Citizen */}
            <div className="group bg-white rounded-2xl border border-[#dde3ed] p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e8f5e9] text-[#1b5e20] flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#e8f5e9] text-[#1b5e20]">
                    Public
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1a2332] mb-1">Citizen Portal</h3>
                <p className="text-xs text-[#4a5568] leading-relaxed mb-6">
                  Report issues with AI image analysis, track grievance status, and verify resolutions.
                </p>
              </div>
              <div className="space-y-2">
                <Link
                  href="/dashboard"
                  className="w-full py-2.5 px-4 bg-[#1b5e20] hover:bg-[#144718] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <span>Open Citizen Portal</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <Link
                  href="/login?portal=citizen"
                  className="w-full py-1.5 text-center block text-[11px] font-medium text-[#4a5568] hover:text-[#1b5e20] transition-colors"
                >
                  Secure OTP Login →
                </Link>
              </div>
            </div>

            {/* Field Worker */}
            <div className="group bg-white rounded-2xl border border-[#dde3ed] p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#fef3e2] text-[#b45309] flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#fef3e2] text-[#b45309]">
                    Field Ops
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1a2332] mb-1">Field Worker Portal</h3>
                <p className="text-xs text-[#4a5568] leading-relaxed mb-6">
                  Receive assigned ward tasks, access GPS locations, and submit completion photo proofs.
                </p>
              </div>
              <div className="space-y-2">
                <Link
                  href="/worker"
                  className="w-full py-2.5 px-4 bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <span>Open Worker Portal</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <Link
                  href="/login?portal=worker"
                  className="w-full py-1.5 text-center block text-[11px] font-medium text-[#4a5568] hover:text-[#b45309] transition-colors"
                >
                  Worker Login →
                </Link>
              </div>
            </div>

            {/* Officer / Admin */}
            <div className="group bg-white rounded-2xl border border-[#dde3ed] p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e3f0fd] text-[#1565c0] flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#e3f0fd] text-[#1565c0]">
                    Official
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1a2332] mb-1">Officer Portal</h3>
                <p className="text-xs text-[#4a5568] leading-relaxed mb-6">
                  Municipal analytics, ward dispatch, AI verification review, and SLA escalation control.
                </p>
              </div>
              <div className="space-y-2">
                <Link
                  href="/admin"
                  className="w-full py-2.5 px-4 bg-[#002147] hover:bg-[#003166] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <span>Open Officer Portal</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <Link
                  href="/login?portal=officer"
                  className="w-full py-1.5 text-center block text-[11px] font-medium text-[#4a5568] hover:text-[#002147] transition-colors"
                >
                  Officer Login →
                </Link>
              </div>
            </div>

            {/* NGO */}
            <div className="group bg-white rounded-2xl border border-[#dde3ed] p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e0f2f1] text-[#00695c] flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#e0f2f1] text-[#00695c]">
                    Oversight
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1a2332] mb-1">NGO Portal</h3>
                <p className="text-xs text-[#4a5568] leading-relaxed mb-6">
                  Track civic accountability, identify overdue ward complaints, and file formal demand notices.
                </p>
              </div>
              <div className="space-y-2">
                <Link
                  href="/ngo"
                  className="w-full py-2.5 px-4 bg-[#00695c] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <span>Open NGO Portal</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <Link
                  href="/login?portal=ngo"
                  className="w-full py-1.5 text-center block text-[11px] font-medium text-[#4a5568] hover:text-[#00695c] transition-colors"
                >
                  NGO Login →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── How it works ──────────────────────────────────────────── */}
        <section id="about" className="py-16 px-4 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#002147] tracking-tight mb-2">A Closed-Loop System</h2>
            <p className="text-[#4a5568] max-w-xl mx-auto text-sm">
              From reporting to resolution — AI brings speed and accountability.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: 'photo_camera',
                title: 'Citizen Reports',
                desc: 'Take a photo of the issue. AI instantly classifies the problem and determines severity.',
                accent: '#1565c0',
                bg: '#e3f0fd',
              },
              {
                step: '02',
                icon: 'smart_toy',
                title: 'AI Smart Routing',
                desc: 'The complaint is automatically routed to the correct department based on image analysis.',
                accent: '#5c35a8',
                bg: '#f0ebfc',
              },
              {
                step: '03',
                icon: 'verified',
                title: 'Proof & Verification',
                desc: 'Worker submits an "after" photo upon completion. AI verifies the fix by comparing photos.',
                accent: '#1b5e20',
                bg: '#e8f5e9',
              },
            ].map((f) => (
              <div key={f.step} className="nx-card p-6 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-[#4a5568] bg-[#f4f6fa] border border-[#dde3ed] px-2 py-0.5 rounded font-mono flex-shrink-0">
                    STEP {f.step}
                  </span>
                </div>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ background: f.bg }}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ color: f.accent, fontVariationSettings: "'FILL' 1" }}
                  >
                    {f.icon}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1a2332] mb-1">{f.title}</h3>
                  <p className="text-sm text-[#4a5568] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="nx-footer">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Government of India</p>
              <p className="text-xs text-white/60">Nagrik Seva — Municipal Grievance Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {['Terms & Conditions', 'Privacy Policy', 'Helpdesk'].map((l) => (
              <a key={l} href="#" className="text-xs text-white/65 hover:text-white transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
