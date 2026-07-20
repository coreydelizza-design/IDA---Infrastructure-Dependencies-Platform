# Phase 1 — Consultancy Engagement and Registry Foundation

This phase converts the fixture-rendered prototype into a **persistent,
consultancy-operated Infrastructure Dependency Assurance registry**. It is not a
monitoring platform.

## What this increment implements

- **Domain split into modules** (`src/domain/*`): organizations, engagements,
  contacts, providers, circuits, components, cloud, dependencies, evidence,
  provenance, dataGaps, tasks, services, sites, authorization, assurance, audit,
  plus a presentation `models.ts` and a barrel `index.ts`.
- **Repository ports** (`src/application/ports.ts`) — the 12 registry
  repositories with `Result<T>`/typed errors. Components no longer import
  fixture data.
- **Local persistence** (`src/infrastructure/local/*`): a versioned
  `localStorage` store that seeds canonical data once, migrates by schema
  version, and never reseeds over user-created records. Create / update /
  archive / restore persist across reloads.
- **Engagement context** (`src/application/registryContext.tsx`): resolves the
  data mode, seeds local data, and scopes all registry queries to the selected
  enterprise + engagement (persisted in the URL and localStorage). The
  top-navigation tenant selector is now a functional popover (its 134px button
  dimensions are unchanged).
- **Assurance/registry semantics** replace monitoring semantics in the UI (see
  “Visible semantic changes”).
- **Audit**: material changes (site create/update/archive, engagement events)
  append `AuditEvent`s.
- **Supabase scaffold** (`src/infrastructure/supabase/*`, `supabase/migrations/`)
  and `.env.example` — see `SUPABASE_SETUP.md`.

## Visible semantic changes (geometry unchanged, baseline NOT updated)

| Before (monitoring) | After (assurance) |
|---|---|
| `Resiliency Health` (card + inspector) | `Architecture Assurance` |
| `● Online / Offline` | site **registry state** (e.g. “Consultant Verified”) |
| `Last assessed` | `Assessment snapshot` |
| `Critical Services (Up)` | `Critical Service Dependencies` |
| per-service `Up` | assurance state (Confirmed / Documented / Pending / …) |
| `Critical Services Up %` | `Services Assured %` |

Seeded scores render as **Provisional** — formal control-based scoring is a
later phase. The approved dark shell, rail, three-column grid, inspector,
imagery, card order, London selection, KPI strip, and footer are unchanged. The
Playwright visual baseline is intentionally **not** updated.

## Roles

Consultancy-admin, engagement-lead, consultant, network-architect,
evidence-reviewer, compliance-analyst, enterprise-sponsor,
enterprise-contributor, enterprise-approver, carrier-respondent,
carrier-reviewer, read-only-reviewer.

## Deferred to later increments

- Full 7-step Add Site intake wizard and in-place site editing (this increment
  keeps the single-step modal, which now persists real records + data gaps and
  fabricates nothing).
- Concrete Supabase repositories + mappers (schema and client are scaffolded).
- The full 9-tab inspector expansion.
- Interaction tests for the wizard; evidence file storage.

## Boundary

This is a foundation phase. It is **not** production-authorized, and it does not
implement the full LOA/carrier portal, the production assessment engine, the
connector framework, or regulatory export.
