# Production Assessment Engine

Assesses a site against its versioned archetype profile using **stored control
results** and produces a point-in-time architecture-assurance snapshot. This
replaces the Phase 1 placeholder: seeded scores are now assessment-backed
(non-provisional) rather than provisional fixtures.

## Engine (`src/domain/assessment.ts`)

`assessSite(profile, controlResults, context) → AssessmentResult` computes:

- **architecture assurance score + band** — `earned_weight / applicable_weight × 100`, then `min(score, any triggered critical cap)` (see `docs/SCORING_MODEL.md`).
- **design conformance** — conformant / exception-approved / non-conformant.
- **assessment coverage %** — assessed control weight ÷ total profile weight (unassessed controls lower coverage).
- **evidence confidence %** — evidence-backed earned weight ÷ earned weight (evidence-backed = evidence-linked + verification in {provider-confirmed, document-verified, consultant-verified}).
- **residual risk count** — failed / partial / accepted controls.
- **publication state** — `insufficient-assessment` (<40% coverage) → `provisional` (<80%) → `publishable`.

### Rules enforced
- **Single-site exception** — an approved single-site connectivity-diversity control is *not-applicable* (excluded from applicable weight); it is never penalized.
- **Critical caps** — a failed required diversity control caps the final score (e.g., 69 for diversity-required archetypes).
- **Risk acceptance never improves the technical score** — an accepted control earns zero and remains a residual gap (tested: accepting a risk scores no higher than the underlying failure).

## Profiles (`src/domain/assessmentProfiles.ts`)

Versioned per-archetype profiles (`getAssessmentProfile(archetype)`), control weights summing to 100. Diversity-required archetypes carry a critical cap on the connectivity-diversity control; single-site-acceptable archetypes rely on the engine's exception.

## Persistence

- `ControlResult[]` (per site) and `AssuranceSnapshot[]` are stored via the
  `AssessmentRepository` port (local implementation; Supabase `assurance_snapshots`
  table exists in the migration).
- The seed attaches 8 control results per site and a **published** snapshot whose
  score is the last published value, so seeded scores load as assessment-backed
  and unchanged (the locked reference numbers are preserved).

## Running an assessment

The inspector ⋮ menu adds **Run Assessment**: it loads the site's control
results, runs the engine, persists a new `AssuranceSnapshot`, updates the score
(now non-provisional) + publication state + coverage/confidence, and writes an
`assessment-status-changed` audit event. Because it recomputes from the current
control-result working set, a re-assessment can differ from the last published
snapshot — which is the point of running it.

The inspector Scoring Basis card surfaces the publication state + coverage; the
score label shows **"(Provisional)"** only when a site has no assessment (e.g., a
newly registered site before control results are captured).

## Tests

`src/domain/assessment.test.ts` (engine: scoring, critical cap, single-site
exception, risk-acceptance-no-improvement, coverage, evidence confidence,
publication state) and
`src/infrastructure/local/assessment.persistence.test.ts` (seed artifacts,
non-provisional seeded scores, snapshot persistence on re-run).

## Not in this phase

Control-result capture in the intake wizard, per-role assessment workflows,
regulatory export, and the concrete Supabase assessment repository (the port and
schema exist).
