# Contracts & Authorizations Repository

Increment 3 of the operating-model restructure. Gives the consultant a real
contract/document repository and fixes the mislabeled "Documents" navigation.

## The fix

Before, the **"Documents"** navigation opened the **connector/import** tool — a
mislabel. Now:

- **Documents** (`documents` route) → **Contracts & Authorizations** repository.
- The connector/import tool moves to a new **Data imports** (`imports`) route,
  reached from a header link on the repository page. No locked-navigation change
  (the sidebar/top-nav labels are part of the locked Site Inventory view, so the
  route is re-pointed rather than relabeled; the import tool is reachable via the
  page link).

## What it holds

`src/features/contracts/ContractsPage.tsx`:

- **Contracts** — MSAs and related instruments (`src/domain/contracts.ts`:
  `Contract`, types `msa` / `sow` / `nda` / `dpa` / `amendment`, statuses
  `draft` → `terminated`). A searchable table: type, title + counterparty +
  document, reference, status, effective/expiration.
- **Letters of Authorization** — the scoped carrier permissions for the current
  engagement (from the authorization records), with a link to the full LOA
  Workspace.
- **KPIs** — active MSAs, expiring, drafts/in-review, active LOAs
  (`summarizeContracts`).
- **Data imports** header link → the connector tool; **New contract** is
  consultant-only (`canOperate`).

## Data

- `Contract` collection added to `RegistryDataset`; `registryContext` exposes
  `contracts` scoped to the current enterprise.
- Seed carries a demo set (MSA/SOW/DPA for Enterprise Co.; MSAs for the demo
  enterprises, one `expiring`; an NDA). A `localStore` **v4 migration** adds the
  `contracts` collection and injects the demo contracts into existing installs
  (by id, no duplicates).
- `imports` is added to `FULL_ONLY_PAGES` (hidden in lite mode, like the former
  `documents`→connectors route).

## Tests

- `src/domain/contracts.test.ts` — summary counts + status tone mapping.
- `src/infrastructure/local/contracts.migration.test.ts` — v4 collection add +
  demo injection + no-duplicate.

## Not in this increment

Document blob storage (document names only), contract create/edit UI (the "New
contract" button is a placeholder), and renewal reminders.
