# Lite Mode (Delivery Tier)

A per-enterprise **delivery tier** for white-label deployments. `lite` presents
the **core registry** over the **same locked visual shell** (see
`docs/UI_LOCK.md`) and hides advanced workspaces. It is a **route/nav gate, not
a domain fork**: scoring, the assessment model, provenance, and the locked Site
Inventory hero are identical in every tier.

Tier defaults to `full`, and the seeded enterprise is `full`, so the approved
baseline render is unchanged. No schema migration is needed — an absent tier
resolves to `full`.

## Tiers

- **Full** — all workspaces: assessments, carrier collaboration / LOA,
  connectors, compliance-framework mapping, regulatory export, planning, audit.
- **Lite** — core registry only: Site Inventory (locked), dashboard, critical
  services, dependencies, risk register, requirements, plus settings and the
  Administration surface that toggles the tier.

## What lite hides

`FULL_ONLY_PAGES` (`src/domain/tier.ts`): `assessments`, `compliance`, `dora`,
`ict`, `scenarios`, `tests`, `remediation`, `loa`, `carrier-engagements`,
`documents`, `reports`, `audit`. Everything else — including `sites` and
`administration` — is available in every tier. The Administration route is never
gated, so a lite deployment can always switch back to full.

## Where it lives

- **Domain** (`src/domain/tier.ts`) — `DeliveryTier`, `DEFAULT_TIER`,
  `FULL_ONLY_PAGES`, `resolveTier()`, `isPageAvailable(page, tier)`,
  `isPageGated(page, tier)`. Page keys are plain strings so the domain stays
  decoupled from the app router.
- **Storage/resolution** — optional `tier` on `EnterpriseClient`, persisted with
  the dataset. `RegistryProvider` exposes `tier`, `setTier()`, and
  `isPageAvailable(page)`; `useRegistryState` re-exports `tier` and
  `isPageAvailable`.
- **UI gating**:
  - `TopNavigation` filters primary-nav items and hides the LOA/Carrier role
    toggle in lite (carrier collaboration is full-only).
  - `Sidebar` filters items and drops any section left empty.
  - `App` renders `LiteGatePage` if the active route is gated for the current
    tier — a defense-in-depth net, since gated routes have no nav entry in lite.
  - The toggle is **Administration → Delivery mode** (Full / Lite), auto-saved
    per enterprise.

## Preserving the visual lock

Nav filtering only applies when an enterprise is explicitly on `lite`. The
default (full) top navigation, sidebar, and locked hero are untouched, so the
approved baseline is preserved. Switching a tenant's tier changes only which
secondary workspaces are reachable — never the locked Site Inventory, its
scores, imagery, or tokens.

## Tests

`src/domain/tier.test.ts` — default resolution, full-tier allows everything,
lite hides full-only pages while keeping the core registry and Administration,
and the locked `sites` / `administration` routes are never gated.

## Not in this increment

Role/permission-based gating (tier is commercial, not a security boundary),
per-engagement tiers, and a lite-specific onboarding. Enforcement is
presentation-level (hidden nav + route gate); server-side authorization for a
hosted multi-tenant deployment is a later concern.
