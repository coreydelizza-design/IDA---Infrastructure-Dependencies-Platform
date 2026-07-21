import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_THEME, applyTheme, initTheme, readStoredTheme, setTheme } from "./theme";

// Minimal DOM + storage stubs (tests run in the node environment).
function stubEnv(initialStore: Record<string, string> = {}) {
  const store = new Map(Object.entries(initialStore));
  const attrs = new Map<string, string>();
  const root = {
    setAttribute: (k: string, v: string) => void attrs.set(k, v),
    removeAttribute: (k: string) => void attrs.delete(k),
    getAttribute: (k: string) => attrs.get(k) ?? null,
  };
  vi.stubGlobal("document", { documentElement: root });
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  });
  return { attrs, store };
}

afterEach(() => vi.unstubAllGlobals());

describe("readStoredTheme", () => {
  it("defaults to dark when nothing stored", () => {
    stubEnv();
    expect(readStoredTheme()).toBe("dark");
    expect(DEFAULT_THEME).toBe("dark");
  });
  it("returns light when stored", () => {
    stubEnv({ "ida.theme": "light" });
    expect(readStoredTheme()).toBe("light");
  });
  it("treats any non-light value as dark", () => {
    stubEnv({ "ida.theme": "weird" });
    expect(readStoredTheme()).toBe("dark");
  });
});

describe("applyTheme", () => {
  it("sets data-theme=light for light and clears it for dark (locked default untouched)", () => {
    const { attrs } = stubEnv();
    applyTheme("light");
    expect(attrs.get("data-theme")).toBe("light");
    applyTheme("dark");
    expect(attrs.has("data-theme")).toBe(false);
  });
});

describe("setTheme", () => {
  it("applies and persists the theme", () => {
    const { attrs, store } = stubEnv();
    setTheme("light");
    expect(attrs.get("data-theme")).toBe("light");
    expect(store.get("ida.theme")).toBe("light");
    setTheme("dark");
    expect(attrs.has("data-theme")).toBe(false);
    expect(store.get("ida.theme")).toBe("dark");
  });
});

describe("initTheme", () => {
  it("applies the persisted theme at startup", () => {
    const { attrs } = stubEnv({ "ida.theme": "light" });
    initTheme();
    expect(attrs.get("data-theme")).toBe("light");
  });
});
