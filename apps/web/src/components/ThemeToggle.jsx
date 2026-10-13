import { Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from '../context/ThemeContext.jsx';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  const Icon = next === 'dark' ? Moon : Sun;
  const label = `Switch to ${next} theme`;
  return (
    <button type="button" className={`${styles.toggle} ${compact ? styles.compact : ''}`}
      onClick={() => setTheme(next)} aria-label={label} title={label}>
      <Icon size={20} aria-hidden="true" />
      {!compact && <span>{next === 'dark' ? 'Dark' : 'Light'}</span>}
    </button>
  );
}
