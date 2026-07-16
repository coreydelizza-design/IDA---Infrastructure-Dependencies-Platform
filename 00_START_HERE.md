# Start here — complete IDA GitHub repository

This folder is the complete working repository for **IDA — Infrastructure Dependency Assurance**. The current in-product working name remains **ResiliLink** so that the approved interface is not accidentally altered during repository setup.

## The visual design is locked

The approved visual authority is:

- `docs/reference-site-inventory.png`
- exact reference size: `1672 × 941`
- binding rules: `docs/UI_LOCK.md`
- current code-generated regression image: `tests/e2e/site-inventory.spec.ts-snapshots/site-inventory-linux.png`

The application is implemented as React components. The reference screenshot is not used as a page background.

## Simplest publication method

This package is initialized as a local Git repository with one baseline commit and no remote.

1. Extract the ZIP.
2. Open GitHub Desktop.
3. Choose **File → Add Local Repository** and select this extracted folder.
4. Click **Publish repository**.
5. Name the new repository `IDA-Infrastructure-Dependency-Assurance` and keep it private.

Do not create a second nested project folder. The repository root is the folder containing `package.json`, `src`, `public`, `docs`, and `AGENTS.md`.

## Run the prototype locally

Use Node 22.12 or newer:

```bash
npm ci
npm run check
npm run dev
```

Open:

```text
http://localhost:4173/?site=site-dc1-london&tab=overview&view=grid&mode=loa
```

## Connect Codex

After publishing the repository, grant Codex access to it and use the prompt in `CODEX_FIRST_TASK.md`. Codex must read `AGENTS.md`, `CODEX_HANDOFF.md`, `docs/UI_LOCK.md`, and the approved reference before editing.
