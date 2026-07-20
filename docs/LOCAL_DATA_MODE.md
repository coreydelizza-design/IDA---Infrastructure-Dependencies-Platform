# Local Data Mode (default)

The app runs with **no backend** by default: `VITE_DATA_MODE=local` (also the
fallback when unset). Data is persisted in the browser via `localStorage`.

## How it works

- `src/infrastructure/local/localStore.ts` — a versioned store
  (`ida.registry.v1`) holding one `RegistryDataset` blob.
  - `initialize(seedFactory)` seeds the canonical dataset **only on first load**.
    If data already exists it is migrated (by `SCHEMA_VERSION`) and returned
    unchanged — it **never reseeds over user-created records**.
  - `read()` / `write(mutator)` load and persist the dataset.
  - `resetDemoData()` clears storage so the seed is recreated (development
    utility; also surfaced via `RegistryProvider.resetDemoData()`).
- `src/infrastructure/local/seed.ts` — builds the canonical org, enterprise,
  engagement, members, contacts, the 8 seeded sites (original codes, order,
  imagery, and initial London selection), providers, authorizations, and
  acknowledgments.
- `src/infrastructure/local/localRepositories.ts` — implements the repository
  ports over the store.

## Persistence behavior

- Create / update / archive / restore survive page reloads.
- `archive` soft-archives (sets `archivedAt`, removes from the active list);
  `restore` clears it.
- All queries are scoped to the selected engagement.
- Schema migrations run forward by version and preserve records.

## Migrating local data

Bump `SCHEMA_VERSION` and add a transform in `migrate()` in `localStore.ts`. On
next load, existing user data is migrated in place rather than reseeded.

## Tests

`src/infrastructure/local/localRepositories.test.ts` and
`src/domain/registry.test.ts` cover first-load seed, cross-instantiation
persistence, no-reseed-over-user-data, engagement scoping, archive/restore,
search, audit, and the assurance/provenance/data-gap invariants.
