import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_INSPECTOR_LAYOUT,
  readStoredInspectorLayout,
  setInspectorLayout,
} from "./inspectorLayout";

function stubStore(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  });
  return store;
}

afterEach(() => {
  setInspectorLayout("docked"); // reset module state
  vi.unstubAllGlobals();
});

describe("inspectorLayout", () => {
  it("defaults to docked (the locked baseline)", () => {
    stubStore();
    expect(DEFAULT_INSPECTOR_LAYOUT).toBe("docked");
    expect(readStoredInspectorLayout()).toBe("docked");
  });

  it("reads a stored overlay preference", () => {
    stubStore({ "ida.inspectorLayout": "overlay" });
    expect(readStoredInspectorLayout()).toBe("overlay");
  });

  it("reads a stored fullscreen preference", () => {
    stubStore({ "ida.inspectorLayout": "fullscreen" });
    expect(readStoredInspectorLayout()).toBe("fullscreen");
  });

  it("treats any unknown value as docked", () => {
    stubStore({ "ida.inspectorLayout": "floating" });
    expect(readStoredInspectorLayout()).toBe("docked");
  });

  it("persists each layout when set", () => {
    const store = stubStore();
    setInspectorLayout("overlay");
    expect(store.get("ida.inspectorLayout")).toBe("overlay");
    setInspectorLayout("fullscreen");
    expect(store.get("ida.inspectorLayout")).toBe("fullscreen");
    setInspectorLayout("docked");
    expect(store.get("ida.inspectorLayout")).toBe("docked");
  });
});
