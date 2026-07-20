// Field-level provenance: who supplied a fact, how verified, and whether it is
// authoritative. A carrier or imported claim must never silently overwrite a
// consultant-verified canonical fact.

export type FactVerificationState =
  | "enterprise-declared"
  | "provider-claimed"
  | "provider-confirmed"
  | "document-verified"
  | "consultant-verified"
  | "inferred"
  | "disputed"
  | "unknown";

export type ProvenanceSourceType =
  | "enterprise-entry"
  | "consultant-entry"
  | "carrier-response"
  | "provider-document"
  | "contract"
  | "CMDB-import"
  | "cloud-inventory"
  | "spreadsheet-import"
  | "diagram"
  | "consultant-inference"
  | "other";

export interface FieldProvenance {
  id: string;
  engagementId: string;
  entityType: string;
  entityId: string;
  fieldPath: string;
  sourceType: ProvenanceSourceType;
  sourceName: string;
  sourceRecordId: string | null;
  submittedByUserId: string | null;
  observedAt: string | null;
  receivedAt: string;
  verificationState: FactVerificationState;
  evidenceItemId: string | null;
  authoritative: boolean;
  manuallyOverridden: boolean;
  overrideReason: string | null;
  supersededAt: string | null;
}

/** A consultant-verified authoritative fact is protected from silent overwrite. */
export function isProvenanceLocked(p: FieldProvenance): boolean {
  return p.verificationState === "consultant-verified" && p.authoritative && !p.supersededAt;
}

/**
 * Decide whether an incoming claim (carrier/import) may overwrite an existing
 * provenance record. Returns false when the existing fact is consultant-verified
 * and authoritative — such claims must be staged for reconciliation instead.
 */
export function canOverwriteFact(
  existing: FieldProvenance | undefined,
  incomingSource: ProvenanceSourceType,
): boolean {
  if (!existing) return true;
  if (!isProvenanceLocked(existing)) return true;
  // Only a consultant entry may supersede a consultant-verified fact.
  return incomingSource === "consultant-entry";
}
