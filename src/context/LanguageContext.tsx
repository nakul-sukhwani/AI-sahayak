'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTranslation, type SupportedLocale, type TranslationKey } from '@/lib/translations';

interface LanguageContextType {
  lang: SupportedLocale;
  setLanguage: (lang: SupportedLocale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SupportedLocale>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('app_lang') as SupportedLocale | null;
      if (saved && ['en', 'hi', 'bn', 'mr', 'ta', 'ml'].includes(saved)) {
        setLangState(saved);
      }
    } catch {
      // Ignore storage read error
    }
  }, []);

  const setLanguage = useCallback((newLang: SupportedLocale) => {
    setLangState(newLang);
    try {
      localStorage.setItem('app_lang', newLang);
    } catch {
      // Ignore storage write error
    }
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return getTranslation(lang, key);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside of LanguageProvider
    return {
      lang: 'en',
      setLanguage: () => {},
      t: (key: TranslationKey) => getTranslation('en', key),
    };
  }
  return context;
}
