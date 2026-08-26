import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="border-b border-[#E2E8F0] bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#001e40] flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">public</span>
            </div>
            <span className="text-xl font-bold text-[#191c1e] tracking-tight">Nagrik Seva</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-[#001e40] hover:text-[#2563EB] transition-colors">
              Log in
            </Link>
            <Link href="/login" className="hidden sm:inline-flex items-center justify-center px-4 py-2 bg-[#001e40] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity">
              Report Issue
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#f7f9fb] pt-16 md:pt-24 pb-20 md:pb-32 px-4">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#dbeafe] rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#fef3c7] rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/3" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
            <span className="text-xs font-semibold text-[#43474f] uppercase tracking-wide">AI-Powered Civic Platform</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-[#191c1e] tracking-tight leading-tight mb-6">
            Smarter Cities, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#001e40] to-[#2563EB]">
              Powered by AI & Citizens
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[#545f72] mb-10 max-w-2xl mx-auto leading-relaxed">
            Report civic issues instantly. Our AI automatically classifies complaints, assigns the right department, and verifies the proof of work submitted by municipal workers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-[#001e40] text-white text-base font-semibold rounded-xl hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              Report an Issue Now
            </Link>
            <Link href="#how-it-works" className="w-full sm:w-auto px-8 py-4 bg-white text-[#001e40] border border-[#E2E8F0] text-base font-semibold rounded-xl hover:bg-[#f7f9fb] transition-colors">
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* Features / How it works */}
      <section id="how-it-works" className="py-20 md:py-32 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#191c1e] tracking-tight mb-4">A Closed-Loop System</h2>
          <p className="text-[#545f72] max-w-2xl mx-auto">From reporting to resolution, Nagrik Seva brings accountability and speed through AI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: 'photo_camera',
              title: '1. Citizen Reports',
              desc: 'Take a photo of the issue. Our AI instantly classifies the problem (e.g. Pothole) and determines the severity.',
              color: 'text-[#2563EB]',
              bg: 'bg-[#dbeafe]',
            },
            {
              icon: 'smart_toy',
              title: '2. AI Smart Routing',
              desc: 'The complaint is automatically routed to the correct municipal department based on image analysis and location.',
              color: 'text-[#7C3AED]',
              bg: 'bg-[#ede9fe]',
            },
            {
              icon: 'verified',
              title: '3. Proof & Verification',
              desc: 'Worker submits an "after" photo upon completion. AI verifies the fix by comparing before/after photos.',
              color: 'text-[#059669]',
              bg: 'bg-[#d1fae5]',
            },
          ].map((feature, i) => (
            <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
              <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-6`}>
                <span className={`material-symbols-outlined text-2xl ${feature.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {feature.icon}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#191c1e] mb-3">{feature.title}</h3>
              <p className="text-[#545f72] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section className="bg-[#001e40] text-white py-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Designed for Every Stakeholder</h2>
            <p className="text-[#c3c6d1] text-lg mb-8 leading-relaxed">
              Nagrik Seva provides tailored dashboards for citizens, field workers, supervisors, and verification officers.
            </p>
            <ul className="space-y-4">
              {[
                { label: 'Citizens', desc: 'Track complaints and download PDF receipts' },
                { label: 'Field Workers', desc: 'Receive tasks and submit completion proofs' },
                { label: 'Supervisors', desc: 'Review AI suggestions and manage workforce' },
                { label: 'Officers', desc: 'Final review of AI-verified resolution proofs' },
              ].map((role, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#3b82f6] mt-0.5">check_circle</span>
                  <div>
                    <strong className="block text-white">{role.label}</strong>
                    <span className="text-sm text-[#c3c6d1]">{role.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#f7f9fb] p-8 rounded-2xl text-[#191c1e] shadow-2xl transform md:rotate-2">
            {/* Mock Dashboard Preview */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 mb-4">
              <span className="font-bold text-lg">My Complaints</span>
              <span className="px-3 py-1 bg-[#d1fae5] text-[#059669] text-xs font-bold rounded-full">Resolved</span>
            </div>
            <div className="flex gap-4">
              <div className="w-1/2 aspect-square bg-[#e2e8f0] rounded-lg relative overflow-hidden flex items-center justify-center group">
                <span className="text-xs font-bold text-white uppercase bg-black/50 px-2 py-1 rounded absolute top-2 left-2 z-10">Before</span>
                <span className="material-symbols-outlined text-4xl text-black/20">broken_image</span>
              </div>
              <div className="w-1/2 aspect-square bg-[#e2e8f0] rounded-lg relative overflow-hidden flex items-center justify-center">
                 <span className="text-xs font-bold text-white uppercase bg-[#059669]/90 px-2 py-1 rounded absolute top-2 left-2 z-10">After</span>
                 <span className="material-symbols-outlined text-4xl text-black/20">image</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-[#ede9fe] border border-[#7C3AED]/30 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[#7C3AED]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="text-sm font-semibold text-[#7C3AED]">AI Confirmed Resolution (98%)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-12 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-[#001e40] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-sm">public</span>
          </div>
          <span className="text-lg font-bold text-[#191c1e]">Nagrik Seva</span>
        </div>
        <p className="text-sm text-[#545f72] max-w-md mx-auto">
          An AI-powered platform for smarter, cleaner, and better cities. <br/>
          (Prototype for demonstration purposes)
        </p>
      </footer>
    </div>
  );
}
