# Site Workloads

Capture the **workloads** a location carries — the categories of business /
network traffic (AI, critical apps, store/POS, voice, payment, SCADA, backup,
etc.). A workload is a dependency fact: what would be impacted if the site
degraded. It complements `criticalServices` and feeds criticality/impact.

## Model

`src/domain/workloads.ts` is the single source of truth:

- **`WORKLOADS`** — the catalog: `{ id, label, category }`, ~26 workloads across
  seven ordered **`WORKLOAD_CATEGORIES`** (Business apps · Transactional ·
  Real-time comms · OT/industrial · Infrastructure · User & access · Management).
  Ids are stable; labels/grouping are presentation.
- **`WorkloadId`** — the union derived from the catalog (typo-safe presets).
- **`ARCHETYPE_WORKLOAD_PRESETS`** / **`defaultWorkloadsForArchetype(archetype)`** —
  the typical workloads per site archetype, used to pre-tick the checklist.
- **`groupWorkloadsByCategory`**, **`workloadLabel`**, **`isWorkloadId`** helpers.

The field lives on the site aggregate as **`workloads: string[]`** (WorkloadIds) —
`SiteRecord` (`src/domain/sites.ts`) and the presented `Site` (`models.ts`).

## Capture — efficient, archetype-driven

Captured in the intake wizard's **Business Context** step
(`src/components/intake/SiteIntakeModal.tsx` → `WorkloadPicker`):

- **Grouped checkbox chips** (multi-select) — click to toggle; fast, no typing.
- **Archetype presets** are the efficiency lever. Picking the archetype in the
  Identity step pre-ticks the typical workloads, so the consultant *confirms and
  adjusts* rather than starting blank. Changing the archetype re-seeds the preset
  **only when the selection is untouched** (empty, or still the previous
  archetype's preset), so manual edits are never clobbered. An **"Apply
  {archetype} preset"** button re-applies on demand.
- `buildIntakeRecords` writes `workloads` onto the site, filtering to known ids.

## Display

- **Detail inspector** (`DetailPane` Overview) — a **Workloads** section of chips,
  rendered **only when the site has workloads**. Canonical sites are seeded with
  no workloads, so the locked DC1 – London inspector is unchanged and **no
  reference re-baseline is required**.
- **Fullscreen card** (`FullscreenSiteCard`) — the same chips, conditional.

## Seed & migration

- Demo-portfolio sites are seeded with representative workloads by archetype
  (`DEMO_WORKLOADS` in `seed.ts`); canonical Enterprise Co. sites are left empty
  to preserve the locked baseline.
- Schema **v7** migration backfills `workloads: []` on existing sites, and
  restores the demo portfolio's workloads for demo sites injected by an earlier v6
  migration (before workloads existed).

## Boundaries

- Workloads are documented facts, not live traffic measurement — no NetFlow, no
  live utilisation, consistent with the assurance (not monitoring) model.
- Capturing a workload does not change the score; it informs criticality/impact.
