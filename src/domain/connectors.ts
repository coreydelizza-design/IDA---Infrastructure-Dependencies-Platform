// Connector framework.
//
// Connectors perform POINT-IN-TIME imports only — never continuous monitoring,
// polling, or live status. Every connector transforms an external payload into
// ProposedClaims that are STAGED for consultant reconciliation; they never
// become canonical automatically, and they can never silently overwrite a
// consultant-verified canonical fact.

import { canOverwriteFact, type FieldProvenance, type ProvenanceSourceType } from "./provenance";

export type ConnectorKind =
  | "snapshot-import"
  | "document-evidence"
  | "cmdb-inventory"
  | "cloud-asset-inventory"
  | "carrier-inventory"
  | "carrier-response"
  | "signature-provider";

export interface ConnectorDescriptor {
  kind: ConnectorKind;
  label: string;
  description: string;
  produces: "proposed-claims" | "evidence" | "signature";
  targetEntityType: string;
  sourceType: ProvenanceSourceType;
  /** Connectors are point-in-time imports; continuous monitoring is not supported. */
  continuous: false;
  /** Example payload shown in the UI. */
  samplePayload: string;
}

export type ClaimReconciliationStatus =
  | "staged"
  | "conflict"
  | "accepted"
  | "rejected"
  | "superseded"
  | "held";

export interface ProposedClaim {
  id: string;
  batchId: string;
  engagementId: string;
  connectorKind: ConnectorKind;
  entityType: string;
  /** Target existing entity id, or null when the claim proposes a new record. */
  entityId: string | null;
  fieldPath: string;
  proposedValue: string;
  sourceName: string;
  sourceType: ProvenanceSourceType;
  receivedAt: string;
  reconciliationStatus: ClaimReconciliationStatus;
  conflictReason?: string;
}

export interface ImportBatch {
  id: string;
  engagementId: string;
  connectorKind: ConnectorKind;
  sourceName: string;
  receivedAt: string;
  claimCount: number;
  status: "staged" | "partial" | "reconciled";
}

export interface ConnectorInput {
  batchId: string;
  engagementId: string;
  sourceName: string;
  receivedAt: string;
  payload: string;
}

export interface Connector {
  descriptor: ConnectorDescriptor;
  /** Parse a payload into staged proposed claims. Pure and point-in-time. */
  parse(input: ConnectorInput): ProposedClaim[];
}

// --- Parsing helpers --------------------------------------------------------

function rows(payload: string): string[][] {
  return payload
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

function claim(
  input: ConnectorInput,
  descriptor: ConnectorDescriptor,
  index: number,
  entityType: string,
  entityId: string | null,
  fieldPath: string,
  proposedValue: string,
): ProposedClaim {
  return {
    id: `${input.batchId}-claim-${index}`,
    batchId: input.batchId,
    engagementId: input.engagementId,
    connectorKind: descriptor.kind,
    entityType,
    entityId,
    fieldPath,
    proposedValue,
    sourceName: input.sourceName,
    sourceType: descriptor.sourceType,
    receivedAt: input.receivedAt,
    reconciliationStatus: "staged",
  };
}

// --- Concrete connectors ----------------------------------------------------

/** CMDB export: `siteId,componentType,manufacturer,model` → component claims. */
export const cmdbInventoryConnector: Connector = {
  descriptor: {
    kind: "cmdb-inventory",
    label: "CMDB Inventory",
    description: "Point-in-time CMDB component export.",
    produces: "proposed-claims",
    targetEntityType: "component",
    sourceType: "CMDB-import",
    continuous: false,
    samplePayload: "site-dc1-london,router,Cisco,ASR-9000\nsite-dc1-london,firewall,Palo Alto,PA-5450",
  },
  parse(input) {
    return rows(input.payload).flatMap((cols, i) => {
      const [siteId, componentType, manufacturer, model] = cols;
      if (!siteId || !componentType) return [];
      return [claim(input, this.descriptor, i, "component", null, `${siteId}.${componentType}`, `${manufacturer ?? "?"} ${model ?? "?"}`.trim())];
    });
  },
};

/** Cloud asset export: `siteId,resourceType,region` → cloud-resource claims. */
export const cloudAssetConnector: Connector = {
  descriptor: {
    kind: "cloud-asset-inventory",
    label: "Cloud Asset Inventory",
    description: "Point-in-time cloud resource inventory export.",
    produces: "proposed-claims",
    targetEntityType: "cloud-resource",
    sourceType: "cloud-inventory",
    continuous: false,
    samplePayload: "site-aws-eu-west-1,VPC,eu-west-1\nsite-aws-eu-west-1,transit-gateway,eu-west-1",
  },
  parse(input) {
    return rows(input.payload).flatMap((cols, i) => {
      const [siteId, resourceType, region] = cols;
      if (!siteId || !resourceType) return [];
      return [claim(input, this.descriptor, i, "cloud-resource", null, `${siteId}.${resourceType}`, region ?? "?")];
    });
  },
};

/** Carrier response: `circuitId,field,value` → claims targeting existing circuits. */
export const carrierResponseConnector: Connector = {
  descriptor: {
    kind: "carrier-response",
    label: "Carrier Response",
    description: "Carrier confirmation/correction of specified circuit facts.",
    produces: "proposed-claims",
    targetEntityType: "circuit",
    sourceType: "carrier-response",
    continuous: false,
    samplePayload: "circuit-dc1-bt,routeVerification,verified\ncircuit-dc1-bt,circuitId,BT-DC1-999",
  },
  parse(input) {
    return rows(input.payload).flatMap((cols, i) => {
      const [circuitId, field, value] = cols;
      if (!circuitId || !field) return [];
      return [claim(input, this.descriptor, i, "circuit", circuitId, `${circuitId}.${field}`, value ?? "")];
    });
  },
};

export const CONNECTORS: Connector[] = [cmdbInventoryConnector, cloudAssetConnector, carrierResponseConnector];

export function getConnector(kind: ConnectorKind): Connector | undefined {
  return CONNECTORS.find((c) => c.descriptor.kind === kind);
}

// --- Reconciliation ---------------------------------------------------------

/**
 * Classify a staged claim against any existing provenance for the same field.
 * A claim that would overwrite a consultant-verified canonical fact is flagged
 * as a conflict (it can never be auto-applied — a consultant must supersede it).
 */
export function classifyClaim(claim: ProposedClaim, existing: FieldProvenance | undefined): ProposedClaim {
  if (existing && !canOverwriteFact(existing, claim.sourceType)) {
    return {
      ...claim,
      reconciliationStatus: "conflict",
      conflictReason: "Field is consultant-verified; carrier/import input requires consultant reconciliation.",
    };
  }
  return { ...claim, reconciliationStatus: "staged" };
}

export type ReconciliationAction = "accept" | "reject" | "hold" | "supersede";

/**
 * Apply a consultant's reconciliation decision to a claim. Accepting (or a
 * consultant supersede of a conflict) produces the canonical FieldProvenance
 * that records the accepted value and its source.
 */
export function reconcileClaim(
  claim: ProposedClaim,
  action: ReconciliationAction,
  consultantUserId: string,
  decidedAt: string,
): { claim: ProposedClaim; provenance?: FieldProvenance } {
  if (action === "reject") {
    return { claim: { ...claim, reconciliationStatus: "rejected" } };
  }
  if (action === "hold") {
    return { claim: { ...claim, reconciliationStatus: "held" } };
  }
  // A plain "accept" of a conflict is not allowed — it must be a consultant supersede.
  if (claim.reconciliationStatus === "conflict" && action !== "supersede") {
    return { claim };
  }
  const status: ClaimReconciliationStatus = action === "supersede" ? "superseded" : "accepted";
  const provenance: FieldProvenance = {
    id: `prov-${claim.id}`,
    engagementId: claim.engagementId,
    entityType: claim.entityType,
    entityId: claim.entityId ?? claim.fieldPath,
    fieldPath: claim.fieldPath,
    sourceType: action === "supersede" ? "consultant-entry" : claim.sourceType,
    sourceName: claim.sourceName,
    sourceRecordId: claim.id,
    submittedByUserId: consultantUserId,
    observedAt: claim.receivedAt,
    receivedAt: claim.receivedAt,
    verificationState: action === "supersede" ? "consultant-verified" : "provider-claimed",
    evidenceItemId: null,
    authoritative: action === "supersede",
    manuallyOverridden: action === "supersede",
    overrideReason: action === "supersede" ? "Consultant superseded a consultant-verified fact after review" : null,
    supersededAt: null,
  };
  return { claim: { ...claim, reconciliationStatus: status }, provenance };
}
