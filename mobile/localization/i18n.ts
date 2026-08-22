import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import vi from './locales/vi.json';
import zhHans from './locales/zh-Hans.json';
import type { SupportedLanguage } from './types';

const resolveDeviceLanguage = (): SupportedLanguage => {
  const languageCode = getLocales()[0]?.languageCode;
  if (languageCode === 'es' || languageCode === 'vi') return languageCode;
  if (languageCode === 'zh') return 'zh-Hans';
  return 'en';
};

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  lng: resolveDeviceLanguage(),
  resources: {
    en: { translation: en },
    es: { translation: es },
    vi: { translation: vi },
    'zh-Hans': { translation: zhHans },
  },
  react: { useSuspense: false },
});

export const setAppLanguage = (language: SupportedLanguage) => i18n.changeLanguage(language);

export default i18n;
