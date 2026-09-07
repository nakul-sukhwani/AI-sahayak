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
    <div className="flex flex-col gap-5">
      {/* Section title */}
      <div className="text-center">
        <p className="text-xs font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c4d6] pb-2 mb-1">
          {step === 'phone' ? getTranslation(lang, 'secure_login') : 'Enter OTP'}
        </p>
        <p className="text-xs text-[#718096] mt-2">
          {step === 'phone'
            ? getTranslation(lang, 'login_subtitle')
            : `OTP sent to +91 ${phone}`}
        </p>
      </div>

      {/* Method toggle */}
      {step === 'phone' && (
        <div className="flex rounded overflow-hidden border border-[#b8c4d6]">
          <button
            type="button"
            onClick={() => { setMethod('google'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              method === 'google'
                ? 'bg-[#002147] text-white'
                : 'bg-white text-[#4a5568] hover:bg-[#f4f6fa]'
            }`}
          >
            {getTranslation(lang, 'tab_google')}
          </button>
          <button
            type="button"
            onClick={() => { setMethod('phone'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold transition-colors border-l border-[#b8c4d6] ${
              method === 'phone'
                ? 'bg-[#002147] text-white'
                : 'bg-white text-[#4a5568] hover:bg-[#f4f6fa]'
            }`}
          >
            {getTranslation(lang, 'tab_otp')}
          </button>
        </div>
      )}

      {/* Google Sign In */}
      {step === 'phone' && method === 'google' && (
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-2.5 bg-white border border-[#b8c4d6] text-[#1a2332] text-sm font-medium rounded flex items-center justify-center gap-3 hover:bg-[#f4f6fa] transition-colors disabled:opacity-60"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-[#002147]/20 border-t-[#002147] rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {getTranslation(lang, 'btn_google')}
            </>
          )}
        </button>
      )}

      {/* Phone OTP */}
      {step === 'phone' && method === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">
              Mobile Number
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm text-[#4a5568] border-r border-[#b8c4d6] pr-2.5 select-none font-medium">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                className="nx-input pl-14"
                style={{ background: '#fff' }}
              />
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="nx-btn-primary">
            {isLoading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
              : <><span>Get SMS OTP</span><span className="material-symbols-outlined text-base">arrow_forward</span></>
            }
          </button>
        </form>
      )}

      {/* OTP verify */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">
              Enter 6-Digit OTP
            </label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="● ● ● ● ● ●"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoFocus
              className="nx-input tracking-[0.4em] text-center text-lg font-bold"
              style={{ background: '#fff' }}
            />
          </div>
          <button type="submit" disabled={isLoading} className="nx-btn-primary">
            {isLoading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
              : <><span>Verify &amp; Sign In</span><span className="material-symbols-outlined text-base">verified_user</span></>
            }
          </button>
          <button
            type="button"
            onClick={() => { setStep('phone'); setError(null); setOtp(''); }}
            className="w-full text-xs text-[#4a5568] hover:text-[#002147] transition-colors py-1 flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Change number
          </button>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-[#ffebee] border border-[#ffcdd2] rounded p-3">
          <span className="material-symbols-outlined text-[#b71c1c] text-base flex-shrink-0">error</span>
          <p className="text-xs text-[#b71c1c] font-medium">{error}</p>
        </div>
      )}

      {/* Language + Help */}
      <div className="pt-4 border-t border-[#b8c4d6]/60 flex flex-col items-center gap-3">
        <LanguageSelector currentLang={lang} onSelect={onLangChange} />
        <a href="#" className="text-xs text-[#718096] hover:text-[#002147] flex items-center gap-1 transition-colors">
          <span className="material-symbols-outlined text-sm">help</span>
          {getTranslation(lang, 'help_text')}
        </a>
      </div>
    </div>
  );
}
