# Implementation Status

## Delivered in this prototype

### Locked visual system

- Canonical 1672 × 941 viewport and visual regression baseline
- 51 px top navigation, 204 px navigation rail, 480 px detail pane, and 40 px footer
- Three-column site-card registry with the approved seeded content, card order, imagery, score rings, evidence states, and selected state
- Dense dark-navy visual tokens, electric-blue selection, green/amber/red health semantics, and compact enterprise typography
- Grid and list modes, detail tabs, filters, URL-restorable state, and a validated Add Site workflow

### Domain behavior

- Site, carrier, connection, dependency, evidence, risk, service, compliance, LOA, and carrier-request types
- Pure, versioned resilience scoring functions
- Approved single-site exception behavior: an accepted single-site archetype is not penalized solely for lacking a second access path
- Risk acceptance remains separate from technical condition and does not falsely turn a failing control green
- Contracted carrier, underlying carrier, and access provider remain separate concepts

### Enterprise spine

- Modular-monolith frontend boundaries with repository ports
- PostgreSQL/PostGIS neutral core schema
- OpenAPI 3.1 contract starter
- Tenant, membership, evidence provenance, audit, idempotency, background-job, and row-level-security starter structures
- LOA-gated carrier collaboration workflow
- Requirement mapping separated from the neutral scoring core
- CI workflow for type checking, unit tests, production build, Playwright E2E, and visual regression

## Verification status

The required local gates are:

```bash
npm ci
npm audit
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The visual regression viewport is fixed at 1672 × 941 with device scale factor 1. Deliberate UI changes require an approved reference update, UI-lock update, and screenshot-baseline update in the same pull request.

## Remaining production work

The prototype intentionally stops before production identity and data services. Productionization requires:

1. SSO/SCIM and server-enforced tenant/role authorization.
2. Authenticated API implementation against PostgreSQL/PostGIS.
3. Object storage, malware scanning, cryptographic evidence hashes, retention, and signed access.
4. Electronic signature or approved signature-provider integration for LOAs.
5. Carrier portal or secure response links with scoped, expiring access.
6. Bulk estate onboarding, reconciliation, queues, retries, and exception reports.
7. Dependency-graph traversal and shared-fate analysis at portfolio scale.
8. Versioned regulatory mapping packs reviewed by legal/compliance specialists.
9. Observability, backup/restore, disaster recovery, penetration testing, and enterprise release controls.

## Visual fidelity boundary

The page is implemented as real, accessible DOM components rather than a flattened screenshot. The approved composition and visual language are locked. Minor raster differences can occur across operating systems because the source was an AI-generated render without original design assets or font files; the project baseline controls those differences in CI.
