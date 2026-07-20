# Connector Framework

Connectors perform **point-in-time imports only** — never continuous
monitoring, polling, or live status. Every connector transforms an external
payload into **proposed claims** that are **staged for consultant
reconciliation**; nothing becomes canonical automatically, and a
consultant-verified fact is never silently overwritten.

## Domain (`src/domain/connectors.ts`)

- `ConnectorKind` — snapshot-import, document-evidence, cmdb-inventory,
  cloud-asset-inventory, carrier-inventory, carrier-response, signature-provider.
- `Connector` — `{ descriptor, parse(input) → ProposedClaim[] }`; every
  descriptor is `continuous: false`.
- `ProposedClaim` — a staged fact with `reconciliationStatus`
  (`staged | conflict | accepted | rejected | superseded | held`).
- `ImportBatch` — a point-in-time import run.

### Concrete connectors (payload parsers)
- **CMDB Inventory** — `siteId,componentType,manufacturer,model` → component claims.
- **Cloud Asset Inventory** — `siteId,resourceType,region` → cloud-resource claims.
- **Carrier Response** — `circuitId,field,value` → circuit claims (can conflict
  with consultant-verified facts).

### Reconciliation (pure)
- `classifyClaim(claim, existingProvenance)` — flags a claim that would overwrite
  a consultant-verified canonical fact as a **conflict** (via
  `canOverwriteFact`); otherwise stages it.
- `reconcileClaim(claim, action, user, at)` — apply a consultant decision:
  - `accept` → provider-claimed `FieldProvenance` (only for non-conflicts);
  - `reject` / `hold` → status change, no provenance;
  - `supersede` → the only way to override a conflict, producing
    **consultant-verified, authoritative** provenance.

A plain `accept` of a conflict is a no-op — a consultant must `supersede`.

## Persistence

`ConnectorRepository` (port + local implementation) stores `importBatches`,
`proposedClaims`, and `fieldProvenance`. The Supabase stub declares the port;
concrete Supabase wiring is deferred. Staging never mutates canonical entities.

## UI

Route: **Documents → Connectors & Imports** (`src/features/connectors/ConnectorsPage.tsx`),
a secondary workspace that inherits the approved tokens (the locked Site
Inventory hero is untouched). Pick a connector, stage a point-in-time payload,
then reconcile each claim (Accept / Hold / Reject, or Supersede for conflicts).
Imports and reconciliation decisions write audit events.

## Tests

`src/domain/connectors.test.ts` (parse → staged claims, point-in-time, conflict
classification, supersede, decisions) and
`src/infrastructure/local/connector.persistence.test.ts` (staging creates no
canonical records; accept persists provenance; a later carrier claim over a
consultant-verified fact is a conflict).

## Boundary

No SNMP/syslog/NetFlow/packet-capture/polling/live-status. Connectors are
point-in-time; anything imported enters staging and reconciliation before
becoming canonical. The concrete Supabase repositories and additional
connectors (snapshot-import, signature-provider, carrier-inventory,
document-evidence file handling) are follow-ups.
