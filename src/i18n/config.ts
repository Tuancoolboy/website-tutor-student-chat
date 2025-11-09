import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import viTranslations from './locales/vi.json';

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

export default i18n;

