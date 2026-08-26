'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

type Step = 'phone' | 'otp';
type LoginMethod = 'google' | 'phone';

export function OTPForm() {
  const { sendOtp, verifyOtp, signInWithGoogle } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('google');
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Format raw 10-digit input to E.164 for Supabase
  function toE164(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    return `+91${digits}`;
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    
    setIsLoading(true);
    const err = await sendOtp(toE164(digits));
    setIsLoading(false);
    
    if (err) { setError(err); return; }
    setStep('otp');
  }

  async function handleGoogleLogin() {
    setError(null);
    setIsLoading(true);
    const err = await signInWithGoogle();
    if (err) {
      setError(err);
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP.');
      return;
    }
    
    setIsLoading(true);
    const err = await verifyOtp(toE164(phone.replace(/\D/g, '')), otp);
    setIsLoading(false);
    
    if (err) setError(err);
  }

  function handlePhoneInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(val);
  }

  function handleOtpInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-sm">
      {step === 'phone' ? (
        <>
          <h2 className="text-xl font-semibold text-[#191c1e] mb-1 text-center">
            Secure Login
          </h2>
          <p className="text-sm text-[#43474f] text-center mb-6">
            Log in to your Nagrik Seva account.
          </p>

          <div className="flex bg-[#f7f9fb] p-1 rounded-lg mb-6 border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => { setLoginMethod('google'); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === 'google' ? 'bg-white shadow-sm text-[#001e40]' : 'text-[#545f72] hover:text-[#191c1e]'}`}
            >
              Google Login
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('phone'); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === 'phone' ? 'bg-white shadow-sm text-[#001e40]' : 'text-[#545f72] hover:text-[#191c1e]'}`}
            >
              SMS OTP
            </button>
          </div>

          {loginMethod === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label htmlFor="mobile" className="block text-sm text-[#191c1e] mb-1.5 font-medium">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-base text-[#545f72] border-r border-[#E2E8F0] pr-2.5 select-none">
                    +91
                  </span>
                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={handlePhoneInput}
                    required
                    className="w-full pl-14 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-lg
                               text-base text-[#191c1e] placeholder-[#737780]
                               focus:outline-none focus:border-[#001e40] focus:ring-1 focus:ring-[#001e40]
                               transition-colors"
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-[#DC2626]">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#001e40] text-white text-xs font-semibold tracking-widest uppercase
                           rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Get SMS OTP</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 bg-white border border-[#E2E8F0] text-[#191c1e] font-medium
                           rounded-lg hover:bg-[#f7f9fb] transition-colors flex items-center justify-center gap-3
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-[#191c1e]/20 border-t-[#191c1e] rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      <path fill="none" d="M1 1h22v22H1z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
              
              {error && (
                <p role="alert" className="text-sm text-[#DC2626] text-center mt-2">{error}</p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-[#191c1e] mb-1 text-center">
            Enter OTP
          </h2>
          <p className="text-sm text-[#43474f] text-center mb-6">
            Sent to <span className="font-medium text-[#001e40]">+91 {phone}</span>
          </p>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm text-[#191c1e] mb-1.5 font-medium">
                One-Time Password
              </label>
              <input
                id="otp"
                type="tel"
                inputMode="numeric"
                placeholder="6-digit OTP"
                value={otp}
                onChange={handleOtpInput}
                required
                autoFocus
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg
                           text-base text-[#191c1e] placeholder-[#737780] tracking-[0.3em]
                           focus:outline-none focus:border-[#001e40] focus:ring-1 focus:ring-[#001e40]
                           transition-colors text-center"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-[#DC2626]">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#001e40] text-white text-xs font-semibold tracking-widest uppercase
                         rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify &amp; Sign In</span>
                  <span className="material-symbols-outlined text-base">verified_user</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setStep('phone'); setError(null); setOtp(''); }}
              className="w-full text-sm text-[#545f72] hover:text-[#001e40] transition-colors"
            >
              ← Change number
            </button>
          </form>
        </>
      )}

      {/* Language toggle + help — matches Stitch design */}
      <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex flex-col items-center gap-3">
        <div className="flex gap-4">
          <button className="text-sm font-medium text-[#001e40] hover:underline">English</button>
          <span className="text-[#E2E8F0]">|</span>
          <button className="text-sm text-[#545f72] hover:text-[#001e40] transition-colors">हिंदी</button>
        </div>
        <a href="#" className="text-sm text-[#545f72] hover:text-[#001e40] flex items-center gap-1 transition-colors">
          <span className="material-symbols-outlined text-sm">help</span>
          Need help logging in?
        </a>
      </div>
    </div>
  );
}
