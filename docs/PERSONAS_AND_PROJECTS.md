# Personas & Project Inventory

Increment 1 of the operating-model restructure. It introduces the two audiences
the platform serves and gives the consultant a home.

## Personas

`src/application/persona.ts` — `Persona = "consultant" | "customer"`.

- **Consultant** (operator): runs engagements, uploads sites, issues/maintains
  LOAs and contracts, reconciles connector data, authors assessments, publishes.
  Home = the **Project Inventory** (all projects).
- **Customer** (enterprise): a **read-and-report** experience scoped to their
  engagement. Never operates the registry. Governed actions (approvals, LOA
  signing, risk acceptance, data-gap responses) are role-gated and flow through
  consultant reconciliation — they never edit canonical facts directly. Those
  land in a later increment; for now the customer is read + report.

There is no auth yet, so persona is a per-viewer setting (`localStorage`,
`ida.persona`, default `consultant`) with a **"View as"** switch at
**Administration → View as**. When sign-in is wired, persona derives from the
signed-in user's engagement role instead.

`capabilitiesFor(persona)` derives:
- `canOperate` — operator tools (upload/edit sites, issue LOAs, connectors,
  assessments, publish). Consultant only. Already gates the "Add Site"
  affordances in the Site Inventory.
- `canSeeAllProjects` — the multi-project inventory. Consultant only.

## Project Inventory

`src/features/projects/ProjectInventoryPage.tsx` + `src/components/ProjectCard.tsx`.

The consultant's home: a portfolio of **projects (engagements)** across all
enterprise clients, **laid out like the Site Inventory** — a searchable card grid.
Each card shows the client, project name/code, lifecycle status, per-project
metrics (sites · countries · publishable · open risks), a lifecycle progress bar,
and the scope statement. Clicking a project selects its enterprise + engagement
(`registry.selectProject`) and enters the operator workspace (Site Inventory).

- `src/domain/projects.ts` — `ProjectSummary` + `buildProjectSummaries` (joins
  engagements with their enterprise and computes per-project counts from the
  registry) + an engagement-lifecycle `progress` metric.
- `registryContext` exposes `projects` and `selectProject`.

**Demo portfolio has populated sites.** Every demo engagement carries its own
representative sites (`demoSiteSpecs` / `DEMO_SITES` in `seed.ts`; injected into
existing installs by the schema **v6** migration) so a consultant clicking between
projects always lands on a populated Site Inventory — varied scores, risks, and
carrier evidence. The canonical `ENG-2026-001` estate (the eight locked cards) is
unchanged; demo sites live only on the other engagements, so the default render
stays byte-identical to the visual baseline.

## Navigation & landing

- Consultants **land on the Project Inventory**; customers land in the registry
  (`useRegistryState` picks the default page from the stored persona).
- The **brand (logo) is the home button** — consultant → Projects, customer →
  Sites. A transient **"All projects"** link also appears in the tenant popover
  for consultants.
- **"Projects" is deliberately NOT a top-nav item.** The top navigation mirrors
  the locked reference exactly; adding an item would alter the locked Site
  Inventory header. Return-to-projects is on the brand + tenant popover instead.

## Demo portfolio

The seed carries a realistic portfolio so the inventory isn't a single card: the
canonical **Enterprise Co. / Global Infrastructure Assurance 2026** (with the
seeded sites and locked branding) plus four more engagements across three more
enterprise clients at varied lifecycle stages (scoping → published). A
`localStore` **v3 migration** injects the demo portfolio into pre-existing installs
(by id, no duplicates), so the inventory is populated everywhere.

## Lock compliance

- The consultant **Site Inventory renders unchanged** — verified against the
  locked baseline (only the cross-build AA-noise floor differs). No new controls
  were added to the locked hero; the persona switch lives in Administration and
  the project return-path is on the brand / tenant popover.
- The Project Inventory is a **new** screen that reuses the card aesthetic and
  tokens; it doesn't touch the locked Site Inventory.

## Tests

- `src/application/persona.test.ts` — resolution, persistence, capabilities.
- `src/domain/projects.test.ts` — summary joins/counts, archived exclusion,
  lifecycle progress.
- `src/infrastructure/local/projects.migration.test.ts` — v3 demo-portfolio
  injection + no-duplicate.

## Next increments

2. Customer read-only **Dashboard** (the Dashboard placeholder → leadership view).
3. **Contract repositories** (LOA + MSA); fix the "Documents" nav (currently
   opens the connector page).
4. **Navigation cleanup** + full read-only enforcement (detail-pane operator
   actions, governed customer approvals/inputs by engagement role).
