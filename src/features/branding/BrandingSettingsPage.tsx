import { Palette, RotateCcw, Shield, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { useRegistry } from "../../application/registryContext";
import {
  MAX_LOGO_DATA_URL_LENGTH,
  NEUTRAL_BRAND_NAME,
  NEUTRAL_PRODUCT_LABEL,
  TIER_DESCRIPTIONS,
  TIER_LABELS,
  isSafeLogoUrl,
  type DeliveryTier,
} from "../../domain";

const TIERS: DeliveryTier[] = ["full", "lite"];

const MAX_KB = Math.round(MAX_LOGO_DATA_URL_LENGTH / 1024);

export function BrandingSettingsPage() {
  const registry = useRegistry();
  const { branding, brandingConfig, currentEnterprise, updateBranding, resetBranding, tier, setTier } = registry;
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoInput, setLogoInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const enterpriseName = currentEnterprise?.name ?? "the customer";
  const disabled = !currentEnterprise;

  const onFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, SVG, or WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      if (url.length > MAX_LOGO_DATA_URL_LENGTH) {
        setError(`That logo is too large (limit ~${MAX_KB} KB). Use a smaller or optimised file.`);
        return;
      }
      if (!isSafeLogoUrl(url)) {
        setError("That file could not be read as a safe image.");
        return;
      }
      updateBranding({ logoUrl: url, logoAlt: brandingConfig.logoAlt || `${branding.brandName} logo` });
    };
    reader.onerror = () => setError("Could not read that file.");
    reader.readAsDataURL(file);
  };

  const applyUrl = () => {
    setError(null);
    const trimmed = logoInput.trim();
    if (!trimmed) return;
    if (!isSafeLogoUrl(trimmed)) {
      setError("Enter an https:// image URL or a data: image URL.");
      return;
    }
    updateBranding({ logoUrl: trimmed });
    setLogoInput("");
  };

  const clearLogo = () => {
    setError(null);
    updateBranding({ logoUrl: null });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <main className="secondary-workspace-page branding-page">
      <div className="secondary-page-heading">
        <div>
          <span className="eyebrow">White-label</span>
          <h1>Branding</h1>
          <p>Present this registry under {enterpriseName}'s name and logo. The aesthetic stays neutral by design — colours, layout, and scoring are fixed; only the wordmark, subtitle, and logo change.</p>
        </div>
        <button type="button" className="secondary-button" onClick={resetBranding} disabled={disabled}>
          <RotateCcw size={13} /> Reset to neutral
        </button>
      </div>

      <section className="tier-panel">
        <div className="tier-panel-head">
          <span className="eyebrow">Delivery mode</span>
          <p>{TIER_DESCRIPTIONS[tier]}</p>
        </div>
        <div className="tier-toggle" role="radiogroup" aria-label="Delivery mode">
          {TIERS.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tier === t}
              className={tier === t ? "active" : ""}
              disabled={disabled}
              onClick={() => setTier(t)}
            >
              <strong>{TIER_LABELS[t]}</strong>
              <small>{t === "full" ? "All workspaces" : "Core registry only"}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="branding-grid">
        <section className="branding-fields">
          <label className="branding-field">
            <span>Customer name (wordmark)</span>
            <input
              type="text"
              value={brandingConfig.brandName}
              placeholder={enterpriseName === "the customer" ? NEUTRAL_BRAND_NAME : enterpriseName}
              disabled={disabled}
              onChange={(e) => updateBranding({ brandName: e.target.value })}
            />
            <small>Leave blank to use the enterprise name ({enterpriseName}).</small>
          </label>

          <label className="branding-field">
            <span>Product label (subtitle)</span>
            <input
              type="text"
              value={brandingConfig.productLabel}
              placeholder={NEUTRAL_PRODUCT_LABEL}
              disabled={disabled}
              onChange={(e) => updateBranding({ productLabel: e.target.value })}
            />
            <small>Leave blank for the neutral label.</small>
          </label>

          <div className="branding-field">
            <span>Enterprise logo</span>
            <div className="branding-logo-actions">
              <button type="button" className="secondary-button" disabled={disabled} onClick={() => fileRef.current?.click()}>
                <Upload size={13} /> Upload image
              </button>
              {branding.logoUrl ? (
                <button type="button" className="secondary-button" onClick={clearLogo}>
                  <X size={13} /> Remove logo
                </button>
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif,image/avif"
                hidden
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </div>
            <div className="branding-url-row">
              <input
                type="text"
                value={logoInput}
                placeholder="…or paste an https:// image URL"
                disabled={disabled}
                onChange={(e) => setLogoInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applyUrl(); }}
              />
              <button type="button" className="secondary-button" disabled={disabled || !logoInput.trim()} onClick={applyUrl}>Use URL</button>
            </div>
            <small>PNG, JPG, SVG, or WebP up to ~{MAX_KB} KB. A transparent background sits best on the dark navy header.</small>
          </div>

          <label className="branding-field">
            <span>Logo alt text</span>
            <input
              type="text"
              value={brandingConfig.logoAlt}
              placeholder={`${branding.brandName} logo`}
              disabled={disabled}
              onChange={(e) => updateBranding({ logoAlt: e.target.value })}
            />
          </label>

          {error ? <p className="branding-error">{error}</p> : null}
          <p className="branding-note">
            By design there is no customer accent colour. A neutral, consistent aesthetic is the white-label
            requirement, and it keeps every deliverable inside the approved visual system.
          </p>
        </section>

        <section className="branding-preview">
          <span className="branding-preview-label">Header preview</span>
          <div className="branding-preview-header">
            <span className={`brand${branding.logoUrl ? " has-logo" : ""}`}>
              <span className="brand-mark">
                {branding.logoUrl ? (
                  <img className="brand-logo" src={branding.logoUrl} alt={branding.logoAlt} />
                ) : (
                  <Shield size={27} strokeWidth={2.25} />
                )}
              </span>
              <span className="brand-copy">
                <strong>{branding.brandName}</strong>
                <small>{branding.productLabel}</small>
              </span>
            </span>
          </div>
          <div className="branding-preview-meta">
            <Palette size={13} />
            <span>Live preview of the top-left brand slot. Changes save automatically for this enterprise.</span>
          </div>
        </section>
      </div>
    </main>
  );
}
