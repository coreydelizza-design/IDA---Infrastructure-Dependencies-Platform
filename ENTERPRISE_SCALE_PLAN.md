# Enterprise Scale Plan

## Prototype to production sequence

### Phase 1 — Pixel and workflow lock

Keep the current fixture-backed UI. Complete visual acceptance before introducing backend-induced state complexity.

### Phase 2 — Authenticated API and tenant model

Implement tenant, user, role, site, service, provider, carrier, circuit, dependency, score, risk, LOA, request, evidence, requirement, and audit endpoints against PostgreSQL.

### Phase 3 — Evidence and carrier collaboration

Add object storage, signed upload/download, evidence verification, LOA signature lifecycle, scoped carrier portal, request/response versioning, and notification events.

### Phase 4 — Bulk estate onboarding

Add asynchronous CSV/XLSX import, schema mapping, row validation, duplicate resolution, enrichment queues, retryability, and downloadable error reports. Never silently discard a row.

### Phase 5 — Dependency graph and shared fate

Build physical/logical dependency traversal, carrier/underlying-carrier concentration, common-facility analysis, route-claim comparison, cloud fault-domain representation, and business-service blast radius.

### Phase 6 — Requirement adapters and exports

Map the neutral control model to requirement-specific exports. Keep legal interpretation outside the score engine. Version every mapping pack.

### Phase 7 — Scale hardening

- cursor pagination;
- materialized/read-model summaries;
- Redis or managed cache where justified;
- queue workers with retries, dead-letter handling, and idempotency;
- partition large audit/evidence-event tables;
- full-text search and optional OpenSearch at larger scale;
- regional deployment and data-residency controls;
- SLOs, tracing, metrics, alerting, backup, and disaster-recovery exercises.

## Target load fixture

Minimum pre-production test fixture:

- 10,000 sites;
- 30,000 circuits;
- 100,000 components;
- 250,000 dependency edges;
- 50,000 evidence objects;
- 100,000 risk/remediation records;
- 1 million audit events.

The browser never loads this entire dataset. Views use server pagination and summary read models.

## Performance targets

Initial targets, subject to enterprise SLO approval:

- first authenticated shell under 2.5 seconds on corporate broadband;
- registry query p95 under 500 ms for common filters;
- site detail p95 under 400 ms after authentication;
- score run under 2 seconds for one site and asynchronous for bulk estates;
- carrier request creation idempotent and acknowledged under 1 second;
- bulk imports asynchronous with progress and resumability.
