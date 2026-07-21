# White-Label Branding

The registry is delivered white-labelled. The aesthetic is **neutral by design**;
branding is **configuration over the locked visual shell** (see `docs/UI_LOCK.md`).
It changes only the top-left brand slot — **wordmark, subtitle, and logo** — and
never introduces a customer accent colour or otherwise alters the locked
dark-navy token system. This keeps every deliverable inside the approved visual
baseline while letting each customer see their own name and logo.

## What is configurable

- **Customer name (wordmark)** — the bold brand line. Blank → the enterprise
  client's own name → a neutral default (`Assurance Registry`).
- **Product label (subtitle)** — the small line under the wordmark. Blank → the
  neutral default (`Infrastructure Dependency Assurance`).
- **Enterprise logo** — an uploaded image (stored as a `data:` URL) or a pasted
  `https://` / `data:` image URL. Blank → the neutral Shield mark.
- **Logo alt text** — accessibility text; blank → derived from the wordmark.

Deliberately **not** configurable: colours, layout, spacing, typography, card
imagery, scoring. Neutrality is the white-label requirement, so there is no
per-tenant accent theming.

## Where it lives

- **Domain** (`src/domain/branding.ts`) — `BrandingConfig`, neutral defaults,
  `resolveBranding()` (wordmark precedence: explicit → enterprise name →
  neutral), and `isSafeLogoUrl()` (only `data:image/*`, `https?://`, and
  root-relative URLs reach an `<img src>`; `javascript:`, `blob:`, and non-image
  data URLs are rejected). Data-URL logos are capped at ~1.5 MB so a large paste
  can't exhaust the `localStorage` quota.
- **Storage** — branding is an optional field on `EnterpriseClient`, persisted
  with the rest of the dataset (local mode today; the Supabase column follows the
  same shape). Editing writes through the store and is scoped to the currently
  selected enterprise, so switching tenants switches branding.
- **Resolution** — `RegistryProvider` exposes `branding` (display-ready),
  `brandingConfig` (raw), `updateBranding(patch)`, and `resetBranding()`.
- **UI** — the brand slot in `src/components/TopNavigation.tsx` reads `branding`;
  the editor is **Administration → Branding**
  (`src/features/branding/BrandingSettingsPage.tsx`) with a live header preview
  and auto-save.

## Preserving the visual lock

The brand wordmark is a **canonical locked label**. To keep the default render
pixel-identical to the approved baseline, the seeded enterprise carries explicit
branding that reproduces the approved wordmark (`ResiliLink` /
`Site Resiliency Registry` + Shield). White-label is therefore purely additive:
nothing visible changes until a customer is branded.

A `localStore` **v2 migration** backfills that same locked wordmark for installs
seeded before branding existed, so returning users never see the default wordmark
shift. User-created enterprises are left untouched and correctly show their own
name (the intended white-label default).

## Logo guidance

PNG, JPG, SVG, or WebP up to ~1.5 MB. A transparent background sits best on the
dark navy header. Logos render at a fixed height (28 px) with `object-fit:
contain` and a max width, so aspect ratio is preserved and wide marks don't
overflow the brand area.

## Tests

- `src/domain/branding.test.ts` — resolution precedence, neutral defaults,
  logo-URL safety, oversize rejection, neutrality check.
- `src/infrastructure/local/branding.migration.test.ts` — v2 backfill of the
  locked wordmark and non-overwrite of user-customised branding.

## Not in this increment

Brandable footer copyright, per-engagement (vs per-enterprise) branding, logo
blob storage in Supabase (data-URL only for now), and export/report header
branding. The **lite mode** feature tier is a separate follow-up increment.
