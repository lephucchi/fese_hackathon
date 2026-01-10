'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import vi from '@/locales/vi.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      vi: {
        translation: vi,
      },
    },
    lng: 'vi', // Always start with fallback language to avoid hydration mismatch
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for client-side rendering
    },
  });

export default i18n;
