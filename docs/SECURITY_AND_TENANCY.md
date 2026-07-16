# Security and Tenancy

## Tenant isolation

Production persistence must enforce tenant isolation in the database, API, object storage, queue payloads, analytics, and logs. UI filtering is not an authorization control.

Required controls:

- tenant ID on every tenant-owned record;
- row-level security or equivalent database enforcement;
- server-derived tenant context;
- no client-supplied unrestricted tenant IDs;
- automated cross-tenant read, count-inference, and mutation tests;
- tenant-scoped object-storage paths and time-limited signed URLs.

## Identity

Enterprise deployment should support:

- OIDC and SAML SSO;
- SCIM provisioning;
- MFA enforcement inherited from the identity provider;
- role and attribute-based authorization;
- short-lived carrier guest access;
- separation of enterprise, consultancy, carrier, auditor, and platform-administrator duties.

## Carrier least privilege

Carrier users receive access only to the sites, circuits, requests, fields, and documents explicitly shared under an active LOA. They cannot enumerate the tenant registry or infer unshared record counts.

Expired or revoked authority blocks new requests. Existing historical records remain auditable.

## Evidence security

- malware scan uploads;
- encrypt at rest and in transit;
- store cryptographic hash and MIME/type metadata;
- use immutable retention where required;
- isolate sensitive diagrams, carrier records, and contract documents;
- prohibit public object URLs;
- audit view, download, upload, verification, and deletion/retention events.

## Audit

Material actions create append-only events containing actor, tenant, action, object, before/after references, request ID, correlation ID, IP/device context where permitted, and timestamp.

Ordinary application roles must not update or delete audit records.
