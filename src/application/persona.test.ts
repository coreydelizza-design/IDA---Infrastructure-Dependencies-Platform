import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CUSTOMER_ROLE, DEFAULT_PERSONA, capabilitiesFor, readStoredCustomerRole, setCustomerRole, readStoredPersona, setPersona } from "./persona";

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

afterEach(() => { setPersona("consultant"); setCustomerRole(DEFAULT_CUSTOMER_ROLE); vi.unstubAllGlobals(); });

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

describe("customer role", () => {
  it("defaults to sponsor", () => {
    stubStore();
    expect(DEFAULT_CUSTOMER_ROLE).toBe("enterprise-sponsor");
    expect(readStoredCustomerRole()).toBe("enterprise-sponsor");
  });
  it("reads a stored role", () => {
    stubStore({ "ida.customerRole": "read-only-reviewer" });
    expect(readStoredCustomerRole()).toBe("read-only-reviewer");
  });
  it("treats unknown roles as the default", () => {
    stubStore({ "ida.customerRole": "root" });
    expect(readStoredCustomerRole()).toBe(DEFAULT_CUSTOMER_ROLE);
  });
  it("persists on set", () => {
    const store = stubStore();
    setCustomerRole("enterprise-contributor");
    expect(store.get("ida.customerRole")).toBe("enterprise-contributor");
  });
});

describe("capabilitiesFor", () => {
  it("gives the consultant operator tools + all projects; never governed approvals", () => {
    expect(capabilitiesFor("consultant")).toEqual({ canOperate: true, canSeeAllProjects: true, canApprove: false, canContribute: false });
  });
  it("denies operator tools to every customer role", () => {
    for (const role of ["enterprise-sponsor", "enterprise-approver", "enterprise-contributor", "read-only-reviewer"] as const) {
      const caps = capabilitiesFor("customer", role);
      expect(caps.canOperate).toBe(false);
      expect(caps.canSeeAllProjects).toBe(false);
    }
  });
  it("lets sponsors and approvers approve; contributors and reviewers cannot", () => {
    expect(capabilitiesFor("customer", "enterprise-sponsor").canApprove).toBe(true);
    expect(capabilitiesFor("customer", "enterprise-approver").canApprove).toBe(true);
    expect(capabilitiesFor("customer", "enterprise-contributor").canApprove).toBe(false);
    expect(capabilitiesFor("customer", "read-only-reviewer").canApprove).toBe(false);
  });
  it("lets everyone but the read-only reviewer contribute", () => {
    expect(capabilitiesFor("customer", "enterprise-sponsor").canContribute).toBe(true);
    expect(capabilitiesFor("customer", "enterprise-contributor").canContribute).toBe(true);
    expect(capabilitiesFor("customer", "read-only-reviewer").canContribute).toBe(false);
  });
});
