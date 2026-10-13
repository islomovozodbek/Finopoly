export const THEME_STORAGE_KEY = 'finopoly:theme';
export const THEME_COLORS = { light: '#F5F7FA', dark: '#131C29' };

export function validTheme(value) {
  return value === 'light' || value === 'dark' ? value : null;
}

export function readThemePreference() {
  try { return validTheme(window.localStorage.getItem(THEME_STORAGE_KEY)); }
  catch { return null; }
}

export function saveThemePreference(theme) {
  try { window.localStorage.setItem(THEME_STORAGE_KEY, theme); }
  catch { /* Keep the switch usable when storage is unavailable. */ }
}

export function resolveTheme(preference, systemDark) {
  return validTheme(preference) ?? (systemDark ? 'dark' : 'light');
}
