# Domain Model

## Primary aggregates

### Tenant

Owns users, sites, policies, profiles, requirements, LOAs, requests, evidence, and audit events.

### Site

Represents a physical, cloud, virtual, mobile, third-party, or unmanned location. A site has one primary archetype and may have multiple business and network roles.

### Business Service

Represents a critical or supporting service and links the service to sites, cloud resources, providers, circuits, applications, and recovery dependencies.

### Provider and Carrier

Separate:

- contracted provider;
- underlying carrier/access provider;
- cloud provider;
- colocation/interconnection provider;
- managed service provider.

Two contracted carrier names do not prove physical independence.

### Circuit / Connectivity Service

Stores service type, circuit ID, bandwidth, demarcation, entrances, access provider, route claims, verification state, and evidence.

### Component

Represents L1–L3 hardware and cloud components: chassis, port, transceiver, switch, router, firewall, VLAN, VRF, route table, VPC/VNet, gateway, interconnect, and related objects.

### Dependency and Shared-Fate Group

A dependency is a directed relationship. A shared-fate group is a set of objects exposed to the same failure domain, such as a conduit, meet-me room, router, cloud region, transit hub, power feed, or carrier backbone.

### Assessment and Score Snapshot

An assessment captures control results. A score snapshot freezes the versioned calculation.

### Risk, Exception, and Remediation

A risk records a technical or operational gap. Acceptance requires an approver, rationale, compensating control, and expiry. Remediation links work, owner, milestones, and evidence back to the risk.

### Letter of Authorization

Stores version, enterprise, carrier, scope, authorized actions, sites/circuits, signature state, effective date, expiration, revocation, and document evidence.

### Carrier Request and Response

A request is permitted only by active LOA scope. Requests and responses are versioned, evidence-backed, and auditable.

### Requirement and Control Mapping

The core control library remains framework-neutral. Mappings connect neutral controls to DORA, ICT, NIS2, ISO, contract, or customer-specific obligations.

## Evidence states

- verified;
- provider-claimed;
- inferred;
- unknown.

Every evidence item carries source, owner, acquired date, effective date, expiration/freshness, hash, object reference, and verification state.
