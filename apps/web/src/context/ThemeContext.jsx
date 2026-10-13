import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { readThemePreference, resolveTheme, saveThemePreference, THEME_COLORS, THEME_STORAGE_KEY, validTheme } from '../lib/theme.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readThemePreference);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const theme = resolveTheme(preference, systemDark);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = (event) => setSystemDark(event.matches);
    const onStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) setPreference(readThemePreference());
    };
    media.addEventListener('change', onSystemChange);
    window.addEventListener('storage', onStorage);
    return () => {
      media.removeEventListener('change', onSystemChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    // Text and backgrounds must change together, including animated controls.
    root.dataset.themeSwitching = '';
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
    let secondFrame;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => delete root.dataset.themeSwitching);
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
      delete root.dataset.themeSwitching;
    };
  }, [theme]);

  const setTheme = useCallback((value) => {
    const next = validTheme(value);
    if (!next) return;
    setPreference(next);
    saveThemePreference(next);
  }, []);
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
