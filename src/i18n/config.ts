import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import viTranslations from './locales/vi.json';

// Only initialize i18n in browser environment (not during build)
if (typeof window !== 'undefined') {
  i18n
    .use(LanguageDetector) // Detects user language
    .use(initReactI18next) // Passes i18n down to react-i18next
    .init({
      resources: {
        en: { translation: enTranslations },
        vi: { translation: viTranslations }
      },
      fallbackLng: 'vi', // Default language
      debug: false,
      interpolation: {
        escapeValue: false // React already escapes by default
      }
    });
} else {
  // For build/SSR, just initialize without LanguageDetector
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: enTranslations },
        vi: { translation: viTranslations }
      },
      fallbackLng: 'vi',
      debug: false,
      interpolation: {
        escapeValue: false
      }
    });
}

export default i18n;

