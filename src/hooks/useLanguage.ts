'use client';

import { useState, useEffect } from 'react';
import type { SupportedLocale } from '@/lib/translations';

const LANGUAGE_EVENT = 'app_lang_change';

export function useLanguage() {
  const [lang, setLang] = useState<SupportedLocale>('en');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem('app_lang') : null) as SupportedLocale | null;
    if (saved && ['en', 'hi', 'bn', 'mr', 'ta', 'ml'].includes(saved)) {
      setLang(saved);
    }

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<SupportedLocale>;
      if (customEvent.detail) {
        setLang(customEvent.detail);
      } else {
        const current = localStorage.getItem('app_lang') as SupportedLocale | null;
        if (current) setLang(current);
      }
    };

    window.addEventListener(LANGUAGE_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(LANGUAGE_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const changeLanguage = (newLang: SupportedLocale) => {
    setLang(newLang);
    try {
      localStorage.setItem('app_lang', newLang);
      window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: newLang }));
    } catch {
      // Ignore storage error
    }
  };

  return { lang, changeLanguage };
}
