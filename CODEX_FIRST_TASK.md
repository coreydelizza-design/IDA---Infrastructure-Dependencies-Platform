# First Codex task — verify before editing

Use this exact task after connecting Codex to the new repository:

```text
Read AGENTS.md, CODEX_HANDOFF.md, docs/UI_LOCK.md, and prompts/00_MASTER_AGENT_CONTRACT.md completely.

Treat docs/reference-site-inventory.png at 1672×941 as the binding product and visual authority. The existing React application must be continued, not rebuilt.

Do not modify code yet.

Run:

npm ci
npm run verify:handoff
npm run verify:visual-lock
npm run check
npx playwright install --with-deps chromium
npm run test:e2e

Confirm that:

1. the approved interface is implemented as React/DOM components, not a screenshot background;
2. the dark navy shell, 51px top bar, 204px navigation rail, three-column site-card grid, 480px inspector, KPI strip, card imagery, status colors, and initial London state remain intact;
3. all eight site-image assets are present;
4. the approved reference checksum and image dimensions pass the visual-lock verification;
5. approved single-site configurations are not penalized merely for using one carrier or path;
6. accepted risk remains separate from technical health;
7. LOA scope is treated as a server-enforced production requirement;
8. no production-readiness or regulatory-compliance claim is made.

Return a baseline audit categorized as:
- visual fidelity;
- interactions and accessibility;
- domain and scoring;
- LOA and carrier authorization;
- data, API, and tenancy;
- security and production readiness.

Do not update the reference image, visual snapshot, CSS geometry, seeded site order, or palette. Do not redesign, modernize, simplify, re-theme, or substitute a component-library dashboard.
```
