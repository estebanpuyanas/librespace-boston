export const supportedLanguageCodes = ['en', 'es', 'vi', 'zh-Hans'] as const;

export type SupportedLanguage = (typeof supportedLanguageCodes)[number];

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const languageOptions: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
  { code: 'zh-Hans', label: 'Simplified Chinese', nativeLabel: '中文（简体）' },
];
