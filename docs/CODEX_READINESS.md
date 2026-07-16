# Codex Readiness Record

## Handoff status

This repository is suitable for a Codex continuation workflow after it is committed to GitHub and connected to a Codex environment.

## Verified package gates

- Clean `npm ci` installation.
- TypeScript typecheck.
- Vitest unit tests.
- Vite production build.
- Committed Playwright E2E and visual tests.
- Committed 1672 × 941 product reference and Linux regression snapshot.
- Root `AGENTS.md` with immutable visual, domain, security, and validation rules.
- Codex handoff document that prevents a greenfield rewrite.

## Environment-dependent gate

Playwright requires a Chromium installation. A Codex/GitHub environment should run:

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

A task may not report E2E or visual success unless those commands actually pass in that environment.

## Push boundary

The package contains no `.git` history. Initialize or copy it into the intended GitHub repository, create a baseline commit, push it, then connect that repository to Codex Cloud. Do not upload `node_modules`, `dist`, Playwright reports, test results, or local environment files.
