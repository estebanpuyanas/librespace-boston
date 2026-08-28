import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('i18n language selection', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults a first-time visitor to English regardless of no persisted choice', async () => {
    const { resolveInitialLanguage } = await import('./i18n');

    expect(resolveInitialLanguage()).toBe('en');
  });

  it('ignores an invalid or unsupported persisted value and falls back to English', async () => {
    localStorage.setItem('language', 'fr');
    const { resolveInitialLanguage } = await import('./i18n');

    expect(resolveInitialLanguage()).toBe('en');
  });

  it('starts in the persisted language after an explicit prior choice', async () => {
    localStorage.setItem('language', 'es');
    const { default: i18n } = await import('./i18n');

    expect(i18n.language).toBe('es');
  });

  it('persists an explicit language choice so it survives a reload', async () => {
    const { setAppLanguage } = await import('./i18n');

    await setAppLanguage('vi');
    expect(localStorage.getItem('language')).toBe('vi');

    vi.resetModules();
    const { default: reloadedI18n } = await import('./i18n');
    expect(reloadedI18n.language).toBe('vi');
  });
});
