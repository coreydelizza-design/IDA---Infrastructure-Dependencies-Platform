// Theme (dark / light screen mode).
//
// Dark is the canonical default and the locked visual baseline (see
// docs/UI_LOCK.md). Light is an opt-in alternate applied by setting
// `data-theme="light"` on the document root, which activates the
// :root[data-theme="light"] token overrides in tokens.css. The preference is a
// per-user setting persisted in localStorage (not a white-label config).

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "ida.theme";
export const DEFAULT_THEME: Theme = "dark";

export function readStoredTheme(): Theme {
  try {
    const v = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    return v === "light" ? "light" : "dark";
  } catch {
    return DEFAULT_THEME;
  }
}

/** Apply the theme to the document root. Dark leaves the attribute unset so the
 *  default :root tokens (the locked baseline) render untouched. */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
}

/** Run once at startup (before React renders) to avoid a flash of the wrong theme. */
export function initTheme(): void {
  applyTheme(readStoredTheme());
}

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot(): Theme {
  if (typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "light") return "light";
  return "dark";
}

export function setTheme(theme: Theme): void {
  applyTheme(theme);
  try { window.localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  emit();
}

/** React hook: current theme + setter, backed by the document attribute. */
export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void } {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_THEME);
  const set = useCallback((t: Theme) => setTheme(t), []);
  const toggle = useCallback(() => setTheme(getSnapshot() === "light" ? "dark" : "light"), []);
  return { theme, setTheme: set, toggle };
}
