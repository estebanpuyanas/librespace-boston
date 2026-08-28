import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import vi from './locales/vi.json';
import zhHans from './locales/zh-Hans.json';
import { supportedLanguageCodes, type AppLanguage } from './types';

const STORAGE_KEY = 'language';

export const resolveInitialLanguage = (): AppLanguage => {
  const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
  if (supportedLanguageCodes.includes(stored as AppLanguage)) {
    return stored as AppLanguage;
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
  lng: resolveInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export const setAppLanguage = (language: AppLanguage) => {
  localStorage.setItem(STORAGE_KEY, language);
  return i18n.changeLanguage(language);
};

export default i18n;
