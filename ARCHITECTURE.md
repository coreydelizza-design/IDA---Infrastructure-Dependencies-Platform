# Architecture

## Decision

Build the first production version as a **modular monolith with explicit domain ports**. This produces enterprise rigor without premature microservices. Modules may be extracted later when traffic, team ownership, or regulatory isolation requires it.

## Runtime boundaries

```text
Browser
  └─ React/Vite web application
       ├─ Site Registry feature
       ├─ Resilience Assessment feature
       ├─ Risk and Remediation feature
       ├─ LOA and Carrier Engagement feature
       ├─ Requirement Mapping feature
       └─ Reporting feature

API/BFF
  ├─ Authentication and tenant context
  ├─ Registry application services
  ├─ Scoring service
  ├─ Evidence and document service
  ├─ Carrier workflow service
  ├─ Requirement export adapters
  └─ Audit event writer

Data plane
  ├─ PostgreSQL + PostGIS
  ├─ Object storage for evidence
  ├─ Queue for imports, scoring, exports, and carrier jobs
  ├─ Cache/read models for portfolio metrics
  └─ Observability and security telemetry
```

## Frontend boundaries

- `domain/`: pure entities and scoring functions; no React and no network calls.
- `application/`: use cases and state transitions.
- `infrastructure/`: repository and API adapters.
- `features/`: workflow-level modules.
- `components/`: visual primitives governed by `UI_LOCK.md`.

The current in-memory repository is intentionally replaceable. Production code implements the same port against an authenticated API.

## Production API

Recommended characteristics:

- TypeScript Node runtime using Fastify, NestJS, or an equivalent framework
- OpenAPI-first contracts
- cursor pagination for all registries
- idempotency keys for mutations and carrier requests
- optimistic concurrency/version columns
- structured validation errors
- background jobs for bulk imports, evidence processing, score runs, and exports
- append-only audit events for material actions

## Read model strategy

Do not calculate 10,000-site portfolio metrics by loading every site into the browser. Maintain server-side read models for:

- score-band counts;
- country and archetype distributions;
- open-risk counts;
- carrier and underlying-provider concentration;
- shared-fate group exposure;
- evidence freshness;
- requirement coverage;
- LOA expiration and carrier-response queues.

Use event-triggered or scheduled refreshes, with a visible `as_of` timestamp.

## Extraction path

Keep these modules separable from day one:

1. scoring and score-snapshot service;
2. evidence/document service;
3. carrier adapter/workflow service;
4. bulk import and reconciliation worker;
5. compliance/export adapters;
6. analytics/read-model pipeline.

Extraction is justified by operational need—not by an arbitrary microservice target.
