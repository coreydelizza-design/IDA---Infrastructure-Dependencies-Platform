// White-label branding.
//
// The product is delivered white-labelled: a NEUTRAL aesthetic by default, with
// the ability to present a customer name and their enterprise logo. Branding is
// pure configuration over the locked visual shell (see docs/UI_LOCK.md) — it
// changes the wordmark, subtitle, and logo in the top-left brand slot only. It
// never introduces a customer accent colour or otherwise alters the locked
// dark-navy token system, so the approved visual baseline is preserved.

/** Neutral, vendor-agnostic defaults used when nothing is configured. */
export const NEUTRAL_BRAND_NAME = "Assurance Registry";
export const NEUTRAL_PRODUCT_LABEL = "Infrastructure Dependency Assurance";

/** Persisted branding for one enterprise client. Empty strings mean "use the
 *  neutral/enterprise default" — resolveBranding() fills them in. */
export interface BrandingConfig {
  /** Wordmark shown in the brand slot. Empty → customer (enterprise) name → neutral. */
  brandName: string;
  /** Subtitle under the wordmark. Empty → neutral product label. */
  productLabel: string;
  /** Customer logo as a data: URL or http(s)/root-relative URL. Null → neutral mark. */
  logoUrl: string | null;
  /** Accessible alt text for the logo. Empty → derived from the brand name. */
  logoAlt: string;
}

/** A fully resolved branding value — every field is display-ready. */
export type ResolvedBranding = BrandingConfig & { logoUrl: string | null };

export const EMPTY_BRANDING: BrandingConfig = {
  brandName: "",
  productLabel: "",
  logoUrl: null,
  logoAlt: "",
};

// Only these schemes may reach an <img src>. Blocks javascript:, blob:, and other
// vectors; permits inline data-image URLs and ordinary web/relative URLs.
const SAFE_LOGO = /^(data:image\/(png|jpeg|jpg|svg\+xml|webp|gif|avif);|https?:\/\/|\/)/i;

/** Upper bound for a data-URL logo (~1.5 MB) so a large paste can't blow the
 *  localStorage quota. Enforced by the editor before persisting. */
export const MAX_LOGO_DATA_URL_LENGTH = 1_500_000;

export function isSafeLogoUrl(url: string): boolean {
  return SAFE_LOGO.test(url.trim());
}

function normalizeLogo(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_LOGO_DATA_URL_LENGTH) return null;
  return isSafeLogoUrl(trimmed) ? trimmed : null;
}

export interface ResolveBrandingInput {
  branding?: BrandingConfig | null;
  /** The enterprise client's name — the default wordmark for white-label delivery. */
  enterpriseName?: string | null;
}

/**
 * Resolve raw, optionally-empty branding into display-ready values.
 *
 * Wordmark precedence: explicit brandName → customer (enterprise) name → neutral.
 * This means a freshly onboarded customer already shows their own name with no
 * configuration, satisfying the white-label requirement out of the box.
 */
export function resolveBranding(input: ResolveBrandingInput): ResolvedBranding {
  const b = input.branding ?? null;
  const enterpriseName = (input.enterpriseName ?? "").trim();
  const brandName = (b?.brandName ?? "").trim() || enterpriseName || NEUTRAL_BRAND_NAME;
  const productLabel = (b?.productLabel ?? "").trim() || NEUTRAL_PRODUCT_LABEL;
  const logoUrl = normalizeLogo(b?.logoUrl ?? null);
  const logoAlt = (b?.logoAlt ?? "").trim() || `${brandName} logo`;
  return { brandName, productLabel, logoUrl, logoAlt };
}

/** True when the config carries no customer-specific overrides (pure neutral). */
export function isNeutralBranding(branding: BrandingConfig | null | undefined): boolean {
  if (!branding) return true;
  return (
    !branding.brandName.trim() &&
    !branding.productLabel.trim() &&
    !normalizeLogo(branding.logoUrl) &&
    !branding.logoAlt.trim()
  );
}
