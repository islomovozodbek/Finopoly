import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const KEY = 'finopoly:theme';
type Theme = 'light' | 'dark';
function stored(): Theme | null {
  try { const value = localStorage.getItem(KEY); return value === 'light' || value === 'dark' ? value : null; } catch { return null; }
}
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = (value: Theme) => {
      document.documentElement.dataset.theme = value;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', value === 'dark' ? '#131C29' : '#F5F7FA');
      setTheme(value);
    };
    const sync = () => apply(stored() ?? (media.matches ? 'dark' : 'light'));
    sync();
    media.addEventListener('change', sync);
    window.addEventListener('storage', sync);
    return () => { media.removeEventListener('change', sync); window.removeEventListener('storage', sync); };
  }, []);
  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(KEY, next); } catch { /* Still switch if storage is blocked. */ }
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#131C29' : '#F5F7FA');
    setTheme(next);
  }
  const Icon = theme === 'light' ? Moon : Sun;
  return <button className="theme-toggle" onClick={toggle} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}><Icon size={20} aria-hidden="true" /><span>{theme === 'light' ? 'Dark' : 'Light'}</span></button>;
}
