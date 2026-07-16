# Codex Handoff — ResiliLink Enterprise Prototype

## Purpose

This repository is a working prototype and enterprise code spine for a consultancy-operated **Site Resiliency Registry**. The consultancy acts under enterprise Letters of Authorization to collect carrier evidence, model L1–L3 and cloud dependencies, score site resilience, maintain a traceable risk registry, and map neutral controls to DORA/ICT-oriented requirements.

The approved interface is already implemented. Codex must **continue from the existing code** rather than reconstructing the application from scratch.

## Canonical authority

- Product/reference image: `docs/reference-site-inventory.png`
- Locked visual rules: `docs/UI_LOCK.md`
- Current Linux regression snapshot: `tests/e2e/site-inventory.spec.ts-snapshots/site-inventory-linux.png`
- Standing product and domain rules: `AGENTS.md` and `prompts/00_MASTER_AGENT_CONTRACT.md`

The product image is authoritative. The regression snapshot protects the current implementation but may contain small known visual differences. Do not redefine the product target to match the implementation.

## Current implementation status

### Implemented

- React, TypeScript, and Vite application.
- Locked desktop Site Inventory composition.
- Eight canonical site cards and Add Site tile.
- Site selection, search, filters, grid/list mode, detail tabs, favorites, role mode, URL state, and Add Site flow.
- LOA Workspace and requirements views as prototype UI flows.
- Typed site, circuit, carrier, evidence, risk, compliance, LOA, and carrier-request objects.
- Pure scoring module with approved single-site behavior.
- PostgreSQL/PostGIS schema starter and OpenAPI contract starter.
- Unit test, Playwright interaction tests, and a committed visual baseline.
- GitHub Actions quality and visual/E2E jobs.

### Partial—not production-complete

- The scoring suite currently proves the two central diversity cases but does not yet cover every acceptance case in Prompt 03.
- LOA and carrier workflows are UI/domain prototypes; server-enforced authority, identity, tenancy, and field-level sharing are not implemented.
- The database and OpenAPI files are contracts/starters; there is no authenticated production API connected to the UI.
- Dependency graph traversal, shared-fate analysis, evidence storage, immutable audit services, regulatory pack execution, large-estate performance, and production observability remain future phases.

### Not a production claim

The repository is ready for continued engineering in Codex. It is not ready to hold customer production data or to make legal claims of DORA/ICT compliance.

## Baseline verification

Use Node 22.12 or newer:

```bash
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
```

Expected local development endpoint:

```text
http://localhost:4173/?site=site-dc1-london&tab=overview&view=grid&mode=loa
```

## First Codex task

Do not start by rebuilding the UI. Start with a baseline audit:

1. Read `AGENTS.md`, `docs/UI_LOCK.md`, the reference image, and the master contract.
2. Run the verification commands.
3. Compare the product reference against the current Playwright snapshot at 1672 × 941.
4. Produce a concise gap report categorized as:
   - visual fidelity;
   - interaction/accessibility;
   - domain/scoring;
   - LOA/carrier authorization;
   - data/API/tenancy;
   - security/production readiness.
5. Make no visible change until the product owner approves the first focused implementation task.

## Recommended continuation order

1. Close Prompt 03 scoring-test and reproducibility gaps without changing the UI.
2. Complete Prompt 04 LOA authorization behavior and tests behind repository/service interfaces.
3. Implement Prompt 05 authenticated API and tenant boundary.
4. Implement Prompt 06 dependency, evidence, risk, and shared-fate services.
5. Implement Prompt 07 versioned requirement packs and exports.
6. Implement Prompt 08 enterprise hardening, scale tests, deployment, and runbooks.

The older phase prompts remain useful specifications. Treat completed portions as acceptance checks, not instructions to delete and rebuild working code.
