import { describe, expect, it } from "vitest";
import {
  EMPTY_BRANDING,
  MAX_LOGO_DATA_URL_LENGTH,
  NEUTRAL_BRAND_NAME,
  NEUTRAL_PRODUCT_LABEL,
  isNeutralBranding,
  isSafeLogoUrl,
  resolveBranding,
} from "./branding";

describe("resolveBranding", () => {
  it("falls back to neutral defaults when nothing is configured", () => {
    const r = resolveBranding({});
    expect(r.brandName).toBe(NEUTRAL_BRAND_NAME);
    expect(r.productLabel).toBe(NEUTRAL_PRODUCT_LABEL);
    expect(r.logoUrl).toBeNull();
  });

  it("uses the enterprise (customer) name as the wordmark when unbranded", () => {
    const r = resolveBranding({ enterpriseName: "Acme Bank" });
    expect(r.brandName).toBe("Acme Bank");
    expect(r.productLabel).toBe(NEUTRAL_PRODUCT_LABEL);
    expect(r.logoAlt).toBe("Acme Bank logo");
  });

  it("prefers an explicit brand name over the enterprise name", () => {
    const r = resolveBranding({ branding: { ...EMPTY_BRANDING, brandName: "Custom Co" }, enterpriseName: "Acme Bank" });
    expect(r.brandName).toBe("Custom Co");
  });

  it("keeps a safe logo and derives alt text from the brand name", () => {
    const logo = "https://cdn.example.com/logo.png";
    const r = resolveBranding({ branding: { ...EMPTY_BRANDING, logoUrl: logo }, enterpriseName: "Acme" });
    expect(r.logoUrl).toBe(logo);
    expect(r.logoAlt).toBe("Acme logo");
  });

  it("drops an unsafe logo url", () => {
    const r = resolveBranding({ branding: { ...EMPTY_BRANDING, logoUrl: "javascript:alert(1)" } });
    expect(r.logoUrl).toBeNull();
  });

  it("drops an oversized data-url logo", () => {
    const big = "data:image/png;base64," + "A".repeat(MAX_LOGO_DATA_URL_LENGTH);
    const r = resolveBranding({ branding: { ...EMPTY_BRANDING, logoUrl: big } });
    expect(r.logoUrl).toBeNull();
  });
});

describe("isSafeLogoUrl", () => {
  it("accepts data image, https, and root-relative urls", () => {
    expect(isSafeLogoUrl("data:image/png;base64,AAAA")).toBe(true);
    expect(isSafeLogoUrl("data:image/svg+xml;utf8,<svg/>")).toBe(true);
    expect(isSafeLogoUrl("https://x.example/l.png")).toBe(true);
    expect(isSafeLogoUrl("/assets/logo.svg")).toBe(true);
  });

  it("rejects script, blob, and non-image data urls", () => {
    expect(isSafeLogoUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeLogoUrl("blob:https://x/abc")).toBe(false);
    expect(isSafeLogoUrl("data:text/html;base64,AAAA")).toBe(false);
  });
});

describe("isNeutralBranding", () => {
  it("treats null/empty as neutral and any override as non-neutral", () => {
    expect(isNeutralBranding(null)).toBe(true);
    expect(isNeutralBranding(EMPTY_BRANDING)).toBe(true);
    expect(isNeutralBranding({ ...EMPTY_BRANDING, brandName: "Acme" })).toBe(false);
  });
});
