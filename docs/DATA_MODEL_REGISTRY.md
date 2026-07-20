# Registry Data Model

The domain lives in `src/domain/*` (one module per aggregate area, re-exported
from `src/domain/index.ts`).

## Aggregates

- **ConsultancyOrganization / EnterpriseClient** (`organizations.ts`) — the
  consultancy and its enterprise clients.
- **Engagement / EngagementMember** (`engagements.ts`) — a scoped body of work
  for one enterprise; members carry engagement roles. `EnterpriseContact`
  (`contacts.ts`) captures client-side people and approval authority.
- **SiteRecord** (`sites.ts`) — the rich site aggregate (identity, geography,
  business context, registry/assessment lifecycle, counts, timestamps, version).
  `presentSite()` adapts it into the approved card/inspector view (`Site` in
  `models.ts`) so the locked layout is not rebuilt.
- **CriticalService** (`services.ts`) — a documented business/technical
  dependency with criticality, RTO/RPO/MTO, and an **assurance state** (never a
  live up/down status).
- **Provider / Circuit / InfrastructureComponent / CloudResource / Dependency**
  — connectivity and infrastructure structure. Contracted, underlying, and
  access providers are **separate fields** on `Circuit`.
- **EvidenceItem / FieldProvenance** — evidence records and per-field
  provenance. A **consultant-verified authoritative** fact is locked against
  silent overwrite by a carrier/import claim (`canOverwriteFact`).
- **DataGap** — a recorded unknown/unverified/conflicting fact, routed to
  enterprise, carrier, or consultant research. Unknowns become data gaps, never
  fabricated records.
- **EnterpriseAuthorizationSummary / CarrierAcknowledgmentSummary**
  (`authorization.ts`) — foundational, and kept **separate** states.
- **AssuranceSummary** (`assurance.ts`) — architecture assurance score/band,
  assessment coverage, evidence confidence, residual risk, publication state.
- **AuditEvent** (`audit.ts`) — append-only material-change log.

## Lifecycle states

- **RegistryState** — draft → enterprise-declared → consultant-review →
  enterprise/carrier confirmation → partially/carrier confirmed →
  consultant-verified → disputed / review-due / stale / archived. Registry state
  is **not** an operational up/down state (`isOperationalStateTerm`).
- **AssessmentStatus** — not-started → data-collection → awaiting-enterprise /
  awaiting-carrier → consultant-review → provisional → published → review-due /
  superseded.
- **FactVerificationState / DependencyState** — how a fact/relationship is
  verified.

## Persistence shape

The local store persists one versioned `RegistryDataset` blob (all collections).
Supabase mode maps each aggregate to a snake_case table (see
`supabase/migrations/0001_init.sql` and `DATA_MODEL` ↔ table names in
`SUPABASE_SETUP.md`). Every business table carries tenant/engagement scoping,
`created_at`/`updated_at`/`created_by`/`updated_by`, a `version` for optimistic
concurrency, and soft-archive fields.
