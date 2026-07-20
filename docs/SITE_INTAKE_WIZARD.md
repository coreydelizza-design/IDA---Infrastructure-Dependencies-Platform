# Site Intake Wizard & Site Editing

A compact, multi-step consultant intake replaces the single-step Add Site modal,
and the detail-pane action menu makes site editing/actions functional. Both
persist through the Phase 1 repository ports and inherit the approved tokens,
typography, and modal aesthetic.

## Wizard (`src/components/intake/SiteIntakeModal.tsx`)

Seven steps: **Identity → Business Context → Connectivity → Components & Cloud →
Dependencies → Evidence & Data Gaps → Review**. Navigation: Back, Next, Save
Draft (persists from any step), Cancel, and Create Site / Save Changes.

- **Sliders** — labeled 5-stop controlled sliders for business criticality,
  operational dependency, safety impact (Business step) and dependency
  criticality, substitutability, failure impact (Dependencies step). Each shows
  the selected label + definition; factual inventory uses dropdowns/numeric+unit
  inputs, never sliders.
- **Repeatable records** — add/remove cards for circuits, components, and
  dependencies. Circuits use **Known / Unknown / Not applicable** states and
  separate contracted / underlying / access provider selects.
- **No fabrication** — an unknown circuit (or a known circuit without a
  contracted provider) produces a **carrier DataGap** instead of a fabricated
  circuit. Missing identity facts produce enterprise gaps. See
  `src/application/intake.ts` (`buildIntakeRecords`).
- **Evidence & data gaps** — evidence metadata is captured (attachment storage
  deferred); each auto-generated gap is classified as enterprise follow-up,
  carrier confirmation, consultant research, accepted unknown, or not required.
- **Review** — shows completeness, provisional assurance, evidence confidence,
  open data gaps, enterprise/carrier confirmations, unresolved dependencies, and
  the records to be created. Assurance is provisional (control-based scoring is a
  later phase).

On submit the site + circuits + components + dependencies + evidence + data gaps
are persisted via the repositories and audit events are written.

## Editing & actions (`DetailPane` action menu)

The inspector's ⋮ menu provides **Edit Site**, **Duplicate as Draft**, **Mark
Review Complete**, **View Audit History**, and **Archive Site**. Editing reuses
the same intake components (pre-filled from the site via `formFromSite`) and
bumps the record `version`. Duplicate creates a new draft copy; Mark Review
Complete sets the registry state to consultant-verified and writes a
registry-state-changed audit event; Archive soft-archives.

## Grid vs list

The locked three-column grid shows the canonical featured set (card order
preserved). Newly created/duplicated sites persist and are reachable via the
**list view** and by selection (the detail pane opens the new site). Edits to a
grid site update its card in place.

## Tests

`src/application/intake.test.ts` covers the record builder: unknown circuit →
carrier gap (no record), known circuit needs a contracted provider, provider
separation, controlled slider values, gap dispositions, evidence records,
missing-address gap, and edit merge (id/createdAt preserved, version bumped).
