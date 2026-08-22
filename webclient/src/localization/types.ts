export const supportedLanguageCodes = ['en', 'es', 'vi', 'zh-Hans'] as const;

export type AppLanguage = (typeof supportedLanguageCodes)[number];

export const languageOptions: ReadonlyArray<{ code: AppLanguage; nativeLabel: string }> = [
  { code: 'en', nativeLabel: 'English' },
  { code: 'es', nativeLabel: 'Español' },
  { code: 'vi', nativeLabel: 'Tiếng Việt' },
  { code: 'zh-Hans', nativeLabel: '简体中文' },
];
