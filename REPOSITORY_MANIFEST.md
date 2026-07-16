# Complete repository manifest

This repository is packaged as one complete GitHub/Codex handoff. No application folder needs to be added separately.

## Working application

- `index.html`
- `src/App.tsx`
- `src/main.tsx`
- `src/application/`
- `src/components/`
- `src/data/`
- `src/domain/`
- `src/features/`
- `src/infrastructure/`
- `src/styles/app.css`
- `src/styles/tokens.css`

## Locked visual assets

- `docs/reference-site-inventory.png` — approved product authority
- `docs/implementation-screenshot.png` — current code-generated implementation
- `tests/e2e/site-inventory.spec.ts-snapshots/site-inventory-linux.png` — regression baseline
- `public/assets/sites/` — eight card-image assets
- `docs/UI_LOCK.md` — binding geometry, typography, palette, density, and semantic-state rules
- `scripts/verify-visual-lock.mjs` — checksum, dimension, imagery, token, and UI-lock validation

## Testing and automation

- `src/domain/scoring.test.ts`
- `tests/e2e/site-inventory.spec.ts`
- `playwright.config.ts`
- `vitest.config.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/pages.yml`
- `scripts/verify-handoff.mjs`

## Enterprise code spine

- `database/core-schema.sql`
- `contracts/openapi.yaml`
- `docs/ARCHITECTURE.md`
- `docs/DOMAIN_MODEL.md`
- `docs/SCORING_MODEL.md`
- `docs/SECURITY_AND_TENANCY.md`
- `docs/ENTERPRISE_SCALE_PLAN.md`
- `SECURITY.md`

## Codex continuation controls

- `AGENTS.md`
- `CODEX_FIRST_TASK.md`
- `CODEX_HANDOFF.md`
- `PROMPT_SEQUENCE.md`
- `prompts/00_MASTER_AGENT_CONTRACT.md`
- `prompts/01_REPOSITORY_AND_VISUAL_BASELINE.md`
- `prompts/02_SITE_INVENTORY_INTERACTIONS.md`
- `prompts/03_DOMAIN_AND_SCORING.md`
- `prompts/04_LOA_AND_CARRIER_WORKSPACE.md`
- `prompts/05_DATABASE_API_AND_TENANCY.md`
- `prompts/06_DEPENDENCIES_RISK_AND_EVIDENCE.md`
- `prompts/07_REQUIREMENT_MAPPING.md`
- `prompts/08_ENTERPRISE_HARDENING_AND_DEPLOYMENT.md`

## Setup and deployment

- `00_START_HERE.md`
- `README.md`
- `PUSH_TO_GITHUB.md`
- `docs/DEPLOYMENT.md`
- `vercel.json`
- `.github/workflows/pages.yml`
- `.nvmrc`
- `.env.example`
- `package.json`
- `package-lock.json`
