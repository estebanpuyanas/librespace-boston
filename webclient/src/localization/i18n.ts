import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import vi from './locales/vi.json';
import zhHans from './locales/zh-Hans.json';
import type { AppLanguage } from './types';

const resolveBrowserLanguage = (): AppLanguage => {
  const browserLanguages = typeof navigator === 'undefined' ? [] : navigator.languages;

  for (const language of browserLanguages) {
    const normalized = language.toLowerCase();
    if (normalized.startsWith('es')) return 'es';
    if (normalized.startsWith('vi')) return 'vi';
    if (normalized.startsWith('zh')) return 'zh-Hans';
  }

  return 'en';
};

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    vi: { translation: vi },
    'zh-Hans': { translation: zhHans },
  },
  lng: resolveBrowserLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export const setAppLanguage = (language: AppLanguage) => i18n.changeLanguage(language);

export default i18n;
