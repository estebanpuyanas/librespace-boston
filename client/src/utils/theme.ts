import { UserTheme } from 'shared/types/user';

export const applyTheme = (theme: UserTheme): void => {
  const root = document.documentElement;
  if (theme === 'SYSTEM') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme === 'DARK' ? 'dark' : 'light');
  }
};

export const toggleTheme = (): UserTheme => {
  const current = document.documentElement.getAttribute('data-theme');
  const next: UserTheme = current === 'dark' ? 'LIGHT' : 'DARK';
  applyTheme(next);
  return next;
};

// Returns cleanup fn — pass to useEffect return
export const watchSystemTheme = (callback: (theme: 'dark' | 'light') => void): (() => void) => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => callback(e.matches ? 'dark' : 'light');
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
};
