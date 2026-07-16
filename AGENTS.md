# ResiliLink Repository Instructions for Codex

These instructions apply to the entire repository. They are binding unless the product owner explicitly overrides them in the current task.

## Read before editing

1. `CODEX_HANDOFF.md`
2. `docs/UI_LOCK.md`
3. `docs/reference-site-inventory.png`
4. `prompts/00_MASTER_AGENT_CONTRACT.md`
5. The phase prompt relevant to the requested task

## Visual contract

- The canonical Site Inventory route is a locked operational console, not general design inspiration.
- Do not redesign, modernize, simplify, restyle, re-theme, or reduce its information density.
- Do not use the reference image or any screenshot as a page background, rasterized card, or flattened interaction layer.
- Preserve real React/DOM components, accessible names, keyboard behavior, and typed data.
- Preserve the dark navy shell, 51 px top bar, 204 px rail, three-column card grid, 480 px inspector, KPI strip, footer, compact radii, card imagery, status semantics, and initial London selection.
- Do not introduce Material UI, Ant Design, Bootstrap, generic admin templates, visible default shadcn styling, glassmorphism, a light theme, oversized radii, or marketing-style whitespace.
- `docs/reference-site-inventory.png` is the product authority. The Playwright snapshot is a regression baseline, not permission to preserve known drift from the authority.
- Never update the reference image or Playwright snapshot automatically. A baseline change requires explicit product-owner approval and a written visual-gap rationale.

## Domain rules

- Keep technical health, design conformance, evidence confidence, risk state, and requirement mapping as separate concepts.
- An approved single-site design is not penalized merely for having one carrier or path when its approved archetype permits that design.
- A risk acceptance does not improve the technical score and does not erase the underlying gap.
- Contracted carrier, underlying carrier, access provider, and managed provider are distinct fields.
- Carrier collaboration must be scoped by an active, unexpired, unrevoked Letter of Authorization.
- DORA, ICT, NIS2, ISO, customer, and contractual mappings adapt the neutral control model; never infer legal compliance from a site score.

## Engineering rules

- Use Node `22.12.0` or newer, as declared in `.nvmrc` and `package.json`.
- Install with `npm ci`; do not replace npm or regenerate the lockfile without a stated reason.
- Keep domain logic out of visual components.
- Preserve repository boundaries under `src/domain`, `src/application`, `src/infrastructure`, `src/features`, `src/components`, and `src/styles`.
- Do not add a production dependency without explaining why the existing stack cannot satisfy the requirement.
- Do not commit secrets, carrier credentials, signed URLs, access tokens, or enterprise data.
- Treat schema, authorization, evidence, and audit changes as security-sensitive.

## Required validation

For every code change, run the smallest relevant tests and, before declaring the task complete, run:

```bash
npm run check
npm run test:e2e
```

For any visible change, inspect the result at exactly `1672 × 941`, compare it with `docs/reference-site-inventory.png`, and run the Playwright visual test. Do not weaken assertions or increase visual thresholds to make a failure disappear.

If Playwright cannot run because of the execution environment, report that exact limitation. Do not claim that E2E or visual tests passed.

## Change reporting

Before editing, state the files to be changed and why. After editing, report:

- implementation completed;
- tests actually run and their results;
- visual impact against the canonical reference;
- migrations or contract changes;
- unresolved risks and explicit production gaps.

Do not perform a broad rewrite when a focused patch will satisfy the task.
