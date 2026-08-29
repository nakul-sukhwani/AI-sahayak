'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getTranslation, type SupportedLocale } from '@/lib/translations';
import { LanguageSelector } from './LanguageSelector';

interface OTPFormProps {
  lang: SupportedLocale;
  onLangChange: (lang: SupportedLocale) => void;
}

export function OTPForm({ lang, onLangChange }: OTPFormProps) {
  const { sendOtp, verifyOtp, signInWithGoogle } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [method, setMethod] = useState<'google' | 'phone'>('google');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toE164 = (raw: string) => `+91${raw.replace(/\D/g, '').slice(0, 10)}`;

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    setIsLoading(true);
    const err = await sendOtp(toE164(digits));
    setIsLoading(false);
    if (err) setError(err); else setStep('otp');
  }

  async function handleGoogleLogin() {
    setError(null);
    setIsLoading(true);
    const err = await signInWithGoogle();
    if (err) { setError(err); setIsLoading(false); }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
    setIsLoading(true);
    const err = await verifyOtp(toE164(phone.replace(/\D/g, '')), otp);
    setIsLoading(false);
    if (err) setError(err);
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-[#191c1e]">{step === 'phone' ? getTranslation(lang, 'secure_login') : 'Enter OTP'}</h2>
        <p className="text-sm text-[#43474f] mt-1">{step === 'phone' ? getTranslation(lang, 'login_subtitle') : `Sent to +91 ${phone}`}</p>
      </div>

      {step === 'phone' && (
        <div className="flex bg-[#f7f9fb] p-1 rounded-lg border border-[#E2E8F0]">
          <button type="button" onClick={() => { setMethod('google'); setError(null); }} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${method === 'google' ? 'bg-white shadow-sm text-[#001e40]' : 'text-[#545f72]'}`}>{getTranslation(lang, 'tab_google')}</button>
          <button type="button" onClick={() => { setMethod('phone'); setError(null); }} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${method === 'phone' ? 'bg-white shadow-sm text-[#001e40]' : 'text-[#545f72]'}`}>{getTranslation(lang, 'tab_otp')}</button>
        </div>
      )}

      {step === 'phone' && method === 'google' && (
        <div className="flex flex-col gap-3 py-1">
          <button type="button" onClick={handleGoogleLogin} disabled={isLoading} className="w-full py-3 bg-white border border-[#E2E8F0] text-[#191c1e] font-medium rounded-lg hover:bg-[#f7f9fb] transition-colors flex items-center justify-center gap-3 disabled:opacity-60">
            {isLoading ? <span className="w-5 h-5 border-2 border-[#191c1e]/20 border-t-[#191c1e] rounded-full animate-spin" /> : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {getTranslation(lang, 'btn_google')}
              </>
            )}
          </button>
        </div>
      )}

      {step === 'phone' && method === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-base text-[#545f72] border-r border-[#E2E8F0] pr-2.5 select-none">+91</span>
            <input type="tel" inputMode="numeric" placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} required className="w-full pl-14 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-lg text-base text-[#191c1e] placeholder-[#737780] focus:outline-none focus:border-[#001e40]" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#001e40] text-white text-xs font-semibold tracking-widest uppercase rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
            {isLoading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><span>Get SMS OTP</span><span className="material-symbols-outlined text-base">arrow_forward</span></>}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <input type="tel" inputMode="numeric" placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required autoFocus className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg text-base text-[#191c1e] tracking-[0.3em] text-center focus:outline-none focus:border-[#001e40]" />
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#001e40] text-white text-xs font-semibold tracking-widest uppercase rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
            {isLoading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><span>Verify &amp; Sign In</span><span className="material-symbols-outlined text-base">verified_user</span></>}
          </button>
          <button type="button" onClick={() => { setStep('phone'); setError(null); setOtp(''); }} className="w-full text-sm text-[#545f72] hover:text-[#001e40]">← Change number</button>
        </form>
      )}

      {error && <p role="alert" className="text-sm text-[#DC2626] text-center">{error}</p>}

      <div className="pt-4 border-t border-[#E2E8F0] flex flex-col items-center gap-3">
        <LanguageSelector currentLang={lang} onSelect={onLangChange} />
        <a href="#" className="text-xs text-[#545f72] hover:text-[#001e40] flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">help</span>{getTranslation(lang, 'help_text')}
        </a>
      </div>
    </div>
  );
}
