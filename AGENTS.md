# ResiliLink Repository Instructions for Codex

These instructions apply to the entire repository. They are binding unless the product owner explicitly overrides them in the current task.

## Canonical product operating model

IDA is a consultancy-operated Infrastructure Dependency Assurance
registry. It is not a network monitoring, observability, NOC, incident,
alerting, performance-management, or live-health platform.

The primary operator is an authorized consultant working on behalf of an
enterprise.

The platform exists to:

1. establish consultancy engagements;
2. collect and structure enterprise site, carrier, circuit, hardware,
   cloud, service, and dependency information;
3. identify missing, contradictory, or unverified facts;
4. obtain enterprise authorization for provider engagement;
5. issue scoped requests to carriers and service providers;
6. receive carrier confirmation, correction, dispute, and evidence;
7. allow consultants to reconcile and verify claims;
8. maintain an evidence-backed dependency registry;
9. produce point-in-time assurance assessments and score snapshots;
10. maintain risks, exceptions, remediation, and requirement mappings;
11. support periodic revalidation and evidence freshness.

Do not introduce:

- live device polling;
- SNMP or syslog collection;
- NetFlow or packet capture;
- real-time uptime or latency;
- alarm dashboards;
- incident correlation;
- NOC workflows;
- continuous interface status;
- current up/down service indicators.

External systems may contribute point-in-time inventory, exports, or
evidence. Connector data must enter staging and reconciliation before it
becomes canonical.

The role model is:

- consultancy users operate the registry and publish findings;
- enterprise users provide data, approve scope, sign authorization,
  review findings, and accept risk;
- carrier users see only authorized requests and may confirm, correct,
  dispute, or support specified facts;
- carrier responses never directly alter published assessments without
  consultant reconciliation.

An enterprise-issued authorization permits the consultancy to work with
specified carriers. Carrier acknowledgment is a separate state.

The approved site-card and inspector aesthetic is binding. Preserve the
visual design while changing monitoring-oriented semantics to
assurance-oriented semantics.

The primary measurements are:

- architecture assurance;
- assessment coverage;
- evidence confidence;
- residual risk.

A score represents the documented and evidenced architecture at a point
in time. It never represents live operational network condition.

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
- The product is white-labelled with a **neutral** aesthetic (see `docs/WHITE_LABEL_BRANDING.md`). Branding is configuration limited to the brand slot (wordmark, subtitle, logo) — never a customer accent colour, theme, or layout change. The seeded enterprise reproduces the locked wordmark so the default render stays identical to the baseline.
- **Lite mode** (see `docs/LITE_MODE.md`) is a per-enterprise delivery tier that hides advanced workspaces over the same locked shell. It is a route/nav gate only — never a domain fork, scoring change, or edit to the locked hero. Tier defaults to `full`, so the baseline render is unchanged; the Administration route is never gated.
- **Colors are token-driven** (see `docs/THEME_TOKENS.md`). `app.css` contains no hardcoded color literals — always add or reuse a `--token` in `tokens.css`, never a raw hex/rgba. The **dark token values are the locked baseline**; changing a dark value is a baseline change requiring product-owner approval.
- **Light theme** is an opt-in `:root[data-theme="light"]` override layer (Administration → Appearance; persisted per viewer). Dark is the default and stays byte-identical. Photographic site cards remain a dark media tile in light mode by design. Light values may be tuned for contrast/aesthetics without approval; keep status text legible (≥ 3:1) on the light surface.
- **Site Inventory interactions** (see `docs/SITE_INVENTORY_INTERACTIONS.md`): a hover/focus **risk peek** (transient portal popover on the open-risks chip) and an opt-in **overlay inspector layout** (Administration → Site inventory layout; default `docked`). Both are additive — the default docked, no-hover render is pixel-identical to the locked baseline. Do not add new controls to the locked hero; keep such toggles in Administration.
- **Personas & Project Inventory** (see `docs/PERSONAS_AND_PROJECTS.md`): the portal serves a **consultant** (operator) and a **customer** (read + report) persona (`src/application/persona.ts`; "View as" in Administration). Consultants land on the **Project Inventory** (engagement cards, like the Site Inventory) and click into a project; customers land on their **Customer Dashboard** (`docs/CUSTOMER_DASHBOARD.md`), read-only. Never add a "Projects" (or other) item to the locked top navigation — return-to-projects is on the brand + tenant popover. Customer governed actions (approvals, LOA signing, risk acceptance) are role-gated and flow through consultant reconciliation; customers never edit canonical facts.
- **Customer Dashboard** (the `dashboard` route, `docs/CUSTOMER_DASHBOARD.md`): a read-only, point-in-time, branded leadership summary computed from the assessed registry (`src/domain/dashboard.ts`). Never a live/operational reading; never a legal-compliance claim.
- **Contracts repository** (the `documents` route, `docs/CONTRACTS_REPOSITORY.md`): MSAs/SOWs/NDAs/DPAs (`src/domain/contracts.ts`) plus the carrier LOAs. The connector/import tool lives at the separate `imports` route (linked from the repository) — do NOT relabel the locked sidebar/top-nav to expose it; re-point routes instead.

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
