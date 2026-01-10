'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export type Language = 'vi' | 'en';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationValue = string | string[] | any;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: object) => TranslationValue;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { t: i18nT } = useTranslation();
  const [language, setLanguageState] = useState<Language>('vi');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated first to prevent hydration mismatch
    setIsHydrated(true);
    
    // Then load saved language preference
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'vi' || saved === 'en')) {
      setLanguageState(saved);
      i18n.changeLanguage(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    i18n.changeLanguage(lang);
  };

  // Wrapper function that returns the translation value
  // Supports nested keys and arrays like the previous implementation
  const t = (key: string, options?: object): TranslationValue => {
    const result = i18nT(key, { returnObjects: true, ...options });
    return result ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
