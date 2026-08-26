import type { Metadata } from 'next';
import { OTPForm } from '@/components/auth/OTPForm';

export const metadata: Metadata = {
  title: 'Login — Nagrik Seva',
  description: 'Secure OTP login to the Nagrik Seva civic complaint platform.',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header — matches nagrik_seva_login_minimal */}
        <div className="text-center mb-8">
          <span
            className="material-symbols-outlined text-[#001e40] text-5xl mb-3 block"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_balance
          </span>
          <h1 className="text-2xl font-semibold text-[#001e40] tracking-tight">
            Nagrik Seva
          </h1>
          <p className="text-sm text-[#545f72] mt-1">Official Access Portal</p>
        </div>

        <OTPForm />

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-sm text-[#545f72]">
            © 2024 Nagrik Seva. Institutional Trust Division.
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="/privacy" className="text-sm text-[#545f72] hover:text-[#001e40] transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-[#545f72] hover:text-[#001e40] transition-colors">
              Terms
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
