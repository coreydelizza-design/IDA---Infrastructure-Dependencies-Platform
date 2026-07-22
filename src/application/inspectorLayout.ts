// Inspector layout (docked / overlay / fullscreen).
//
// The approved, locked Site Inventory (docs/UI_LOCK.md) DOCKS the detail
// inspector beside the card grid, which reflows the grid to the canonical
// three-column state. "overlay" is an opt-in per-viewer preference: the grid
// keeps its full width and the inspector floats over the right edge, so opening
// a site never compresses the cards. "fullscreen" projects the selected site as
// a large, readable card centred over the whole viewport — rendered OUTSIDE the
// scaled `.app-shell` (via a portal) so its text is legible regardless of the
// device down-scale. Default is "docked" so the baseline render is unchanged.

import { useCallback, useSyncExternalStore } from "react";

export type InspectorLayout = "docked" | "overlay" | "fullscreen";

const STORAGE_KEY = "ida.inspectorLayout";
export const DEFAULT_INSPECTOR_LAYOUT: InspectorLayout = "docked";

export function readStoredInspectorLayout(): InspectorLayout {
  try {
    const v = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    return v === "overlay" || v === "fullscreen" ? v : "docked";
  } catch {
    return DEFAULT_INSPECTOR_LAYOUT;
  }
}

const listeners = new Set<() => void>();
let current: InspectorLayout = readStoredInspectorLayout();

function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot(): InspectorLayout { return current; }

export function setInspectorLayout(layout: InspectorLayout): void {
  current = layout;
  try { window.localStorage.setItem(STORAGE_KEY, layout); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

/** React hook: current inspector layout + setter. */
export function useInspectorLayout(): { layout: InspectorLayout; setLayout: (l: InspectorLayout) => void } {
  const layout = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_INSPECTOR_LAYOUT);
  const setLayout = useCallback((l: InspectorLayout) => setInspectorLayout(l), []);
  return { layout, setLayout };
}
