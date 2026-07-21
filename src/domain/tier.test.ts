import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIER,
  FULL_ONLY_PAGES,
  isPageAvailable,
  isPageGated,
  resolveTier,
} from "./tier";

describe("resolveTier", () => {
  it("defaults to full for null/undefined/unknown", () => {
    expect(resolveTier(undefined)).toBe("full");
    expect(resolveTier(null)).toBe("full");
    expect(DEFAULT_TIER).toBe("full");
  });
  it("honours an explicit lite tier", () => {
    expect(resolveTier("lite")).toBe("lite");
  });
});

describe("isPageAvailable", () => {
  it("allows every page in the full tier", () => {
    for (const page of FULL_ONLY_PAGES) expect(isPageAvailable(page, "full")).toBe(true);
    expect(isPageAvailable("sites", "full")).toBe(true);
  });

  it("hides full-only pages in the lite tier but keeps core + administration", () => {
    expect(isPageAvailable("reports", "lite")).toBe(false);
    expect(isPageAvailable("documents", "lite")).toBe(false);
    expect(isPageAvailable("loa", "lite")).toBe(false);
    // Core registry + the surface that toggles the tier must stay reachable.
    expect(isPageAvailable("sites", "lite")).toBe(true);
    expect(isPageAvailable("risk-register", "lite")).toBe(true);
    expect(isPageAvailable("requirements", "lite")).toBe(true);
    expect(isPageAvailable("administration", "lite")).toBe(true);
  });

  it("never gates the locked Site Inventory or the Administration route", () => {
    expect(FULL_ONLY_PAGES.has("sites")).toBe(false);
    expect(FULL_ONLY_PAGES.has("administration")).toBe(false);
  });
});

describe("isPageGated", () => {
  it("is true only for a full-only page under lite", () => {
    expect(isPageGated("reports", "lite")).toBe(true);
    expect(isPageGated("reports", "full")).toBe(false);
    expect(isPageGated("sites", "lite")).toBe(false);
  });
});
