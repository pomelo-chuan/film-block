export type Theme = 'light' | 'dark';
export const THEME_KEY = 'film-block:theme';
export function getInitialTheme(): Theme {
  const theme=document.documentElement.dataset.theme;
  if(theme==='dark'||theme==='light')return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
}
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme=theme;
  document.documentElement.style.colorScheme=theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#171d18':'#f6f5f0');
}
export function rememberTheme(theme: Theme) {
  try {window.localStorage.setItem(THEME_KEY,theme);} catch { /* Theme still works when storage is unavailable. */ }
}
