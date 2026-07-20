import type {
  CanonicalFact,
  ConfirmationResponse,
  ConnectorDescriptor,
  DataGap,
  EnterpriseAuthorization,
  ProposedClaim,
  RegistryState,
} from "./models";

// ---------------------------------------------------------------------------
// Assurance domain logic
//
// Pure helpers that enforce the consultancy-operated assurance model:
//   - carrier responses stage as proposed claims and never overwrite a
//     consultant-verified canonical fact without reconciliation;
//   - authorization scope limits which sites and fields a carrier can see;
//   - expired or revoked authorization blocks new carrier requests;
//   - carrier acknowledgment is independent of enterprise authorization;
//   - registry state is never an operational up/down state;
//   - scoring is point-in-time and independent of any live status.
// ---------------------------------------------------------------------------

/** A consultant-verified canonical fact is protected from direct overwrite. */
export function isCanonicalFactLocked(fact: CanonicalFact): boolean {
  return fact.provenance.locked || fact.provenance.verificationState === "consultant-verified";
}

export interface CarrierResponseOutcome {
  /** True when the response was staged for reconciliation instead of applied. */
  staged: boolean;
  /** The fact after processing — unchanged when the canonical fact is locked. */
  fact: CanonicalFact;
  /** A staged proposed claim when the response could not be applied directly. */
  proposedClaim?: ProposedClaim;
  reason: string;
}

/**
 * Apply a carrier confirmation response to a canonical fact. A carrier can
 * never directly overwrite a consultant-verified canonical fact; such a
 * response is staged as a proposed claim awaiting consultant reconciliation.
 */
export function applyCarrierResponse(
  fact: CanonicalFact,
  response: ConfirmationResponse,
  proposed: { field: string; value: string },
): CarrierResponseOutcome {
  if (isCanonicalFactLocked(fact)) {
    return {
      staged: true,
      fact,
      proposedClaim: {
        id: `claim-${response.id}-${proposed.field}`,
        connectorKind: "carrier-response",
        siteId: fact.siteId,
        field: proposed.field,
        proposedValue: proposed.value,
        source: "carrier",
        receivedAt: response.submittedAt,
        reconciliationStatus: "staged",
      },
      reason: "Canonical fact is consultant-verified; carrier input staged for reconciliation.",
    };
  }

  return {
    staged: false,
    fact: {
      ...fact,
      value: proposed.value,
      provenance: {
        ...fact.provenance,
        source: "carrier",
        verificationState: "provider-claimed",
        updatedAt: response.submittedAt,
      },
    },
    reason: "Fact was not consultant-verified; carrier value applied as provider-claimed.",
  };
}

/** Connector output is always staged as a proposed claim requiring reconciliation. */
export function stageConnectorClaim(
  descriptor: ConnectorDescriptor,
  input: { siteId?: string; field: string; value: string; receivedAt: string },
): ProposedClaim {
  return {
    id: `claim-${descriptor.kind}-${input.field}-${input.receivedAt}`,
    connectorKind: descriptor.kind,
    siteId: input.siteId,
    field: input.field,
    proposedValue: input.value,
    source: "connector",
    receivedAt: input.receivedAt,
    reconciliationStatus: "staged",
  };
}

// --- Authorization scope & lifecycle ---------------------------------------

/** An authorization is effective only when active, signed, unexpired, and unrevoked. */
export function isAuthorizationEffective(
  auth: EnterpriseAuthorization,
  asOf: string | Date = new Date(0),
): boolean {
  if (auth.status !== "active") return false;
  if (auth.signatureStatus !== "signed") return false;
  if (auth.revokedAt) return false;
  const now = typeof asOf === "string" ? new Date(asOf) : asOf;
  const effective = new Date(auth.effectiveDate);
  const expires = new Date(auth.expirationDate);
  return now >= effective && now <= expires;
}

/** New carrier requests are blocked unless the authorization is effective. */
export function canIssueCarrierRequest(
  auth: EnterpriseAuthorization,
  asOf: string | Date = new Date(0),
): boolean {
  return isAuthorizationEffective(auth, asOf);
}

/** A site is carrier-visible only if it is inside the authorization scope. */
export function isSiteVisibleToCarrier(auth: EnterpriseAuthorization, siteId: string): boolean {
  return auth.scopeSites.includes(siteId);
}

/** Restrict an object to only the fields the authorization permits a carrier to see. */
export function visibleFieldsForCarrier<T extends Record<string, unknown>>(
  auth: EnterpriseAuthorization,
  record: T,
): Partial<T> {
  const out: Partial<T> = {};
  for (const field of auth.scopeFields) {
    if (field in record) out[field as keyof T] = record[field as keyof T];
  }
  return out;
}

// --- Registry state guards --------------------------------------------------

const OPERATIONAL_TERMS = ["up", "down", "online", "offline", "degraded", "alarm", "outage"];

/** Guard proving a registry state is not an operational up/down/health state. */
export function isOperationalState(value: string): boolean {
  return OPERATIONAL_TERMS.includes(value.toLowerCase());
}

export function isRegistryStateOperational(state: RegistryState): boolean {
  return isOperationalState(state);
}

// --- Data-gap derivation (Add Site workflow) --------------------------------

export interface SiteRegistrationInput {
  siteId: string;
  code: string;
  /** Carrier count the consultant knows about; carrier identity may be unknown. */
  knownCarrierCount: number;
  /** Fields the consultant could genuinely provide at registration time. */
  providedFields: Partial<Record<RegistrationField, boolean>>;
  requireEnterpriseFollowUp: boolean;
  requireCarrierConfirmation: boolean;
  createdAt: string;
}

export type RegistrationField =
  | "carrierIdentity"
  | "circuitInventory"
  | "routeDiversity"
  | "address"
  | "owner"
  | "timezone";

const REGISTRATION_FIELDS: Array<{ field: RegistrationField; description: string; requiredFor: string; followUpDefault: DataGap["followUp"] }> = [
  { field: "carrierIdentity", description: "Contracted and underlying carrier identity", requiredFor: "dependency-mapping", followUpDefault: "carrier" },
  { field: "circuitInventory", description: "Circuit identifiers and service records", requiredFor: "dependency-mapping", followUpDefault: "carrier" },
  { field: "routeDiversity", description: "Physical route and entrance diversity evidence", requiredFor: "assessment", followUpDefault: "carrier" },
  { field: "address", description: "Verified site address", requiredFor: "registry", followUpDefault: "enterprise" },
  { field: "owner", description: "Accountable site owner", requiredFor: "registry", followUpDefault: "enterprise" },
  { field: "timezone", description: "Site time zone", requiredFor: "registry", followUpDefault: "enterprise" },
];

/**
 * Derive DataGap records for genuinely unknown fields at site registration.
 * Missing carrier/circuit facts create data gaps — never fictional carrier or
 * circuit records.
 */
export function deriveRegistrationDataGaps(input: SiteRegistrationInput): DataGap[] {
  const gaps: DataGap[] = [];
  for (const spec of REGISTRATION_FIELDS) {
    if (input.providedFields[spec.field]) continue;
    let followUp = spec.followUpDefault;
    if (followUp === "carrier" && !input.requireCarrierConfirmation) {
      followUp = input.requireEnterpriseFollowUp ? "enterprise" : "internal";
    }
    if (followUp === "enterprise" && !input.requireEnterpriseFollowUp) {
      followUp = "internal";
    }
    gaps.push({
      id: `gap-${input.siteId}-${spec.field}`,
      siteId: input.siteId,
      field: spec.field,
      description: spec.description,
      requiredFor: spec.requiredFor,
      state: "open",
      followUp,
      createdAt: input.createdAt,
    });
  }
  return gaps;
}

/** Unknown carrier data must NOT produce fabricated carrier connections. */
export function shouldFabricateCarrierConnections(input: SiteRegistrationInput): boolean {
  return input.providedFields.carrierIdentity === true && input.providedFields.circuitInventory === true;
}
