import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { readThemePreference, resolveTheme, saveThemePreference, THEME_STORAGE_KEY } from './theme.js';

afterEach(() => vi.unstubAllGlobals());

describe('theme preference', () => {
  it('follows the device until a valid preference is chosen', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme('invalid', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('persists a choice and ignores invalid stored values', () => {
    const storage = new Map();
    vi.stubGlobal('window', { localStorage: {
      getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value),
    } });
    saveThemePreference('dark');
    expect(readThemePreference()).toBe('dark');
    storage.set(THEME_STORAGE_KEY, 'not-a-theme');
    expect(readThemePreference()).toBe(null);
  });

  it('works when the browser blocks storage access', () => {
    vi.stubGlobal('window', { get localStorage() { throw new Error('Storage blocked'); } });
    expect(readThemePreference()).toBe(null);
    expect(() => saveThemePreference('dark')).not.toThrow();
  });
});

describe('theme before first paint', () => {
  const bootstrap = readFileSync(new URL('../../public/theme-init.js', import.meta.url), 'utf8');
  it.each([
    ['dark', false, 'dark'], ['light', true, 'light'], [null, true, 'dark'], ['invalid', false, 'light'],
  ])('applies stored %s / system dark %s before React loads', (stored, systemDark, expected) => {
    const meta = {};
    const document = { documentElement: { dataset: {} }, querySelector: () => meta };
    vm.runInNewContext(bootstrap, {
      localStorage: { getItem: () => stored }, window: { matchMedia: () => ({ matches: systemDark }) }, document,
    });
    expect(document.documentElement.dataset.theme).toBe(expected);
    expect(meta.content).toBe(expected === 'dark' ? '#131C29' : '#F5F7FA');
  });
});

describe('light and dark palette contrast', () => {
  const css = readFileSync(new URL('../tokens.css', import.meta.url), 'utf8');
  const tokens = block => Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/gi)].map(([, key, value]) => [key, value]));
  const light = tokens(css.match(/:root\s*{([^}]+)/)[1]);
  const dark = { ...light, ...tokens(css.match(/:root\[data-theme='dark'\]\s*{([^}]+)/)[1]) };
  const luminance = hex => {
    const [r, g, b] = hex.slice(1).match(/../g).map(c => parseInt(c, 16) / 255)
      .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
    return r * .2126 + g * .7152 + b * .0722;
  };
  const contrast = (a, b) => {
    const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (values[0] + .05) / (values[1] + .05);
  };

  it.each([['light', light], ['dark', dark]])('%s meets text and control contrast requirements', (_, palette) => {
    const surfaces = ['bg', 'surface', 'surface-2', 'accent-soft', 'info-soft', ...Object.keys(palette).filter(key => key.startsWith('group-') && key.endsWith('-soft'))];
    for (const surface of surfaces) {
      for (const text of ['text', 'text-2', 'text-3']) {
        expect(contrast(palette[text], palette[surface]), `${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    for (const fill of ['accent', 'accent-strong', 'loss']) {
      expect(contrast(palette['on-accent'], palette[fill]), `action ink on ${fill}`).toBeGreaterThanOrEqual(4.5);
    }
    for (const text of ['gain', 'loss', 'accent', 'info']) {
      for (const surface of ['surface', 'surface-2']) {
        expect(contrast(palette[text], palette[surface]), `${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(contrast(palette['disabled-text'], palette['disabled-bg'])).toBeGreaterThanOrEqual(4.5);
    for (const surface of ['bg', 'surface', 'surface-2']) {
      expect(contrast(palette['border-hi'], palette[surface]), `control border on ${surface}`).toBeGreaterThanOrEqual(3);
      expect(contrast(palette.info, palette[surface]), `focus ring on ${surface}`).toBeGreaterThanOrEqual(3);
    }
  });
});
