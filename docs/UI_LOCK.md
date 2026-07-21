# UI Lock — Site Resiliency Registry

## Authority

The binding reference is `docs/reference-site-inventory.png` at:

- 1672 px width
- 941 px height
- Device pixel ratio 1
- Dark navy theme only

The implementation screenshot is stored at `tests/e2e/site-inventory.spec.ts-snapshots/site-inventory-linux.png`.

## Non-negotiable rule

Do not redesign, modernize, simplify, reinterpret, or replace this screen with a component-library dashboard. Rebuild and maintain it as real DOM components while preserving the approved composition.

Do not:

- use the reference screenshot as the application background;
- remove the left rail, top navigation, card imagery, detail pane, summary strip, footer, or evidence chips;
- substitute Material UI, Bootstrap, Ant Design, or default shadcn styling;
- introduce a light theme, oversized radii, glassmorphism, large shadows, or decorative gradients;
- enlarge spacing to make the screen feel more like a consumer product;
- replace outline icons with emoji;
- change the canonical seeded labels, values, card order, or selected state.

## Canonical shell

```css
--topbar-height: 51px;
--sidebar-width: 204px;
--footer-height: 40px;
--detail-column-width: 500px;
--detail-pane-width: 480px;
```

```text
┌────────────────────────────────────────────────────────────────────┐
│ 51 px top navigation                                               │
├───────────────┬──────────────────────────────┬─────────────────────┤
│ 204 px rail   │ Site Inventory               │ 480 px detail pane  │
│               │ three-column card registry   │ inset by 8/12 px    │
├───────────────┴──────────────────────────────┴─────────────────────┤
│ 40 px footer                                                       │
└────────────────────────────────────────────────────────────────────┘
```

At the canonical viewport:

- workspace height: 850 px;
- toolbar: 34 px;
- site grid: 858 × 593 px;
- grid rows: 205 px, 202 px, 166 px;
- grid gap: 10 px;
- summary strip: 858 × 82 px;
- detail pane top: 91 px absolute page coordinate;
- detail pane height: 785 px;
- no body-level scrollbar.

## Typography

Use Inter with system fallbacks.

- Page title: 18–20 px, weight 600
- Site title: 15.8–16 px, weight 600
- Detail title: 20–23 px, weight 600
- Primary nav: 11–12 px
- Metadata: 7.5–10 px
- Score: 17 px in cards; 21 px in detail pane
- Tight line heights and dense information hierarchy

## Locked palette

The implementation tokens live in `src/styles/tokens.css`. Principal semantics:

- canvas: deep navy;
- active/selected: electric blue;
- excellent, verified, up: green;
- good and warning: amber;
- at-risk and critical: red;
- carrier review: purple;
- provider-claimed: cyan/blue;
- accepted single-site design: blue information state;
- accepted risk: neutral gray, not green.

## Canonical cards

1. DC1 – London — 95 — Excellent — Evidence verified — selected
2. DC2 – Frankfurt — 92 — Excellent — Provider-claimed diverse
3. BR-1001 – Paris — 78 — Good — 2 open risks — favorite
4. TRD – New York — 90 — Excellent — Under carrier review
5. RO – Singapore — 72 — Good — Single-site acceptable — 1 open risk
6. EDGE-25 – Madrid — 54 — At Risk — Risk accepted — 4 open risks
7. AWS – eu-west-1 — 96 — Excellent — Evidence verified
8. HUB – Amsterdam — 88 — Excellent — Provider-claimed diverse
9. Add New Site

## Visual regression

Any visible change must run the Playwright baseline at 1672 × 941. Structural drift is a failed build, not an aesthetic preference. A deliberate visual change requires:

1. product-owner approval;
2. updated reference image;
3. updated UI lock;
4. updated screenshot baseline;
5. written rationale in the pull request.

## Approved baseline amendments

Deliberate, product-owner-approved changes to the locked composition are recorded
here with their rationale. The reference image and Playwright snapshot must be
re-baselined by the product owner before these are considered the new lock.

### A1 — Top-bar view switch (`Workspace / {client}`)

The top-right pill pair, previously the stubbed **`LOA View / Carrier View`** role
mode (which only toggled a cosmetic inspector chip), is repurposed into the
primary **Workspace ↔ Customer view** switch:

- **Workspace** — the consultant's operating view (registry, Site/Project
  Inventory, LOA, carrier, reconciliation). LOA and carrier work remain inside the
  consultant view (sidebar workspaces), unchanged.
- **`{client}`** — the second pill is labelled with the currently selected
  enterprise client (e.g. *Enterprise Co.*, *Northwind Trading*) and previews the
  read-only Customer Dashboard exactly as that client sees it.

Rationale: the most-used context switch in the product (operate vs. see-what-the-
client-sees) was buried in Administration, while the prominent top-bar pills did
nothing functional. This surfaces the switch and gives the pills a real job.
Backed by the existing `persona` model; the pill is the visible front-end of
`setPersona`. The toggle sizes to the client name (the fixed 171 px halves would
truncate most names). Everything else in the locked shell is unchanged.
