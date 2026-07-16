# Security policy and prototype boundary

This repository is a working prototype and enterprise architecture spine. It is not authorized for real enterprise, carrier, contract, LOA, or regulated production data until authentication, tenant resolution, row-level security, encrypted object storage, retention, audit, monitoring, and deployment controls are implemented and reviewed.

## Security invariants

- Every tenant-owned production record must be isolated by `tenant_id`.
- API authorization and PostgreSQL row-level security are both required.
- Carrier responders receive scoped grants only; they are not ordinary tenant members.
- A carrier request requires an active, unexpired, unrevoked LOA covering the carrier account, site or service, and requested action.
- Ordering, changing, disconnecting, porting, or committing spend is never inferred from inventory-validation authority.
- Evidence is append-only, content-hashed, source-attributed, and versioned.
- Technical health, evidence confidence, accepted risk, and requirement mapping remain separate concepts.
- Service credentials, database URLs, signing secrets, and object-storage credentials never enter browser bundles.
- Logs must not contain document bodies, credentials, complete carrier account numbers, or unnecessary personal data.

## High-impact review areas

- tenant and scoped-grant filters;
- LOA authorization evaluation;
- evidence upload, retrieval, and retention;
- carrier portal object authorization;
- audit-event completeness;
- bulk-import validation;
- exports containing confidential information;
- webhook validation and idempotency;
- SSRF and unsafe URL fetching in future integrations.
