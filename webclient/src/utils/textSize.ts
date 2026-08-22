export type TextSize = 'normal' | 'large';

const STORAGE_KEY = 'text-size';

export const applyTextSize = (size: TextSize): void => {
  document.documentElement.setAttribute('data-text-size', size);
  localStorage.setItem(STORAGE_KEY, size);
};

export const initTextSize = (): void => {
  const stored = localStorage.getItem(STORAGE_KEY) as TextSize | null;
  applyTextSize(stored ?? 'normal');
};

export const toggleTextSize = (): TextSize => {
  const current = document.documentElement.getAttribute('data-text-size');
  const next: TextSize = current === 'large' ? 'normal' : 'large';
  applyTextSize(next);
  return next;
};
