import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PERSONA, capabilitiesFor, readStoredPersona, setPersona } from "./persona";

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

afterEach(() => { setPersona("consultant"); vi.unstubAllGlobals(); });

describe("persona", () => {
  it("defaults to consultant", () => {
    stubStore();
    expect(DEFAULT_PERSONA).toBe("consultant");
    expect(readStoredPersona()).toBe("consultant");
  });
  it("reads a stored customer persona", () => {
    stubStore({ "ida.persona": "customer" });
    expect(readStoredPersona()).toBe("customer");
  });
  it("treats unknown values as consultant", () => {
    stubStore({ "ida.persona": "auditor" });
    expect(readStoredPersona()).toBe("consultant");
  });
  it("persists on set", () => {
    const store = stubStore();
    setPersona("customer");
    expect(store.get("ida.persona")).toBe("customer");
  });
});

describe("capabilitiesFor", () => {
  it("gives the consultant operator tools + all-projects; denies both to the customer", () => {
    expect(capabilitiesFor("consultant")).toEqual({ canOperate: true, canSeeAllProjects: true });
    expect(capabilitiesFor("customer")).toEqual({ canOperate: false, canSeeAllProjects: false });
  });
});
