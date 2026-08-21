export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

export const applyTheme = (theme: Theme): void => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
};

export const initTheme = (): void => {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored) {
    applyTheme(stored);
    return;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
};

export const toggleTheme = (): Theme => {
  const current = document.documentElement.getAttribute('data-theme');
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
};

// Returns cleanup fn. pass to useEffect return
export const watchSystemTheme = (callback: (theme: 'dark' | 'light') => void): (() => void) => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => callback(e.matches ? 'dark' : 'light');
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
};
