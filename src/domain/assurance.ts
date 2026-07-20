import type { HealthBand, PublicationState } from "./models";
import type { DataGap, DataGapRequestedFrom } from "./dataGaps";
import { bandForScore } from "./scoring";

export interface AssuranceSummary {
  architectureAssuranceScore: number;
  architectureAssuranceBand: HealthBand;
  assessmentCoveragePercent: number;
  evidenceConfidencePercent: number;
  residualRiskCount: number;
  publicationState: PublicationState;
  calculatedAt: string;
  profileVersion: string;
}

/** Provisional publication state derived from coverage/confidence in this phase. */
export function publicationStateFor(coveragePercent: number, provisional: boolean): PublicationState {
  if (coveragePercent < 40) return "insufficient-assessment";
  if (provisional) return "provisional";
  return "publishable";
}

export function buildProvisionalAssuranceSummary(input: {
  score: number;
  assessmentCoveragePercent: number;
  evidenceConfidencePercent: number;
  residualRiskCount: number;
  provisional: boolean;
  calculatedAt: string;
  profileVersion: string;
}): AssuranceSummary {
  return {
    architectureAssuranceScore: input.score,
    architectureAssuranceBand: bandForScore(input.score).band,
    assessmentCoveragePercent: input.assessmentCoveragePercent,
    evidenceConfidencePercent: input.evidenceConfidencePercent,
    residualRiskCount: input.residualRiskCount,
    publicationState: publicationStateFor(input.assessmentCoveragePercent, input.provisional),
    calculatedAt: input.calculatedAt,
    profileVersion: input.profileVersion,
  };
}

export type RegistrationField =
  | "carrierIdentity"
  | "circuitInventory"
  | "routeDiversity"
  | "address"
  | "owner"
  | "timezone";

export interface SiteRegistrationInput {
  siteId: string;
  engagementId: string;
  knownCarrierCount: number;
  providedFields: Partial<Record<RegistrationField, boolean>>;
  requireEnterpriseFollowUp: boolean;
  requireCarrierConfirmation: boolean;
  createdAt: string;
}

const REGISTRATION_FIELDS: Array<{
  field: RegistrationField;
  title: string;
  gapType: DataGap["gapType"];
  defaultFrom: DataGapRequestedFrom;
}> = [
  { field: "carrierIdentity", title: "Carrier identity unknown", gapType: "carrier-confirmation-required", defaultFrom: "carrier" },
  { field: "circuitInventory", title: "Circuit inventory unknown", gapType: "missing-fact", defaultFrom: "carrier" },
  { field: "routeDiversity", title: "Route diversity evidence missing", gapType: "carrier-confirmation-required", defaultFrom: "carrier" },
  { field: "address", title: "Verified site address missing", gapType: "enterprise-confirmation-required", defaultFrom: "enterprise" },
  { field: "owner", title: "Accountable site owner missing", gapType: "enterprise-confirmation-required", defaultFrom: "enterprise" },
  { field: "timezone", title: "Site time zone missing", gapType: "missing-fact", defaultFrom: "enterprise" },
];

/**
 * Derive DataGap records for genuinely unknown facts at registration. Missing
 * carrier/circuit facts create data gaps — never fictional carrier or circuit
 * records.
 */
export function deriveRegistrationDataGaps(input: SiteRegistrationInput): DataGap[] {
  const gaps: DataGap[] = [];
  for (const spec of REGISTRATION_FIELDS) {
    if (input.providedFields[spec.field]) continue;
    let requestedFrom: DataGapRequestedFrom = spec.defaultFrom;
    if (requestedFrom === "carrier" && !input.requireCarrierConfirmation) {
      requestedFrom = input.requireEnterpriseFollowUp ? "enterprise" : "consultant-research";
    }
    if (requestedFrom === "enterprise" && !input.requireEnterpriseFollowUp) {
      requestedFrom = "consultant-research";
    }
    gaps.push({
      id: `gap-${input.siteId}-${spec.field}`,
      engagementId: input.engagementId,
      siteId: input.siteId,
      entityType: "site",
      entityId: input.siteId,
      fieldPath: spec.field,
      title: spec.title,
      description: `${spec.title}. Recorded as a data gap rather than a fabricated fact.`,
      gapType: spec.gapType,
      priority: spec.field === "carrierIdentity" || spec.field === "routeDiversity" ? "high" : "medium",
      requestedFrom,
      requiresAuthorization: requestedFrom === "carrier",
      status: "open",
      resolution: null,
      createdAt: input.createdAt,
      resolvedAt: null,
    });
  }
  return gaps;
}

/** Unknown carrier data must NOT produce fabricated carrier connections. */
export function shouldCreateCarrierConnections(input: SiteRegistrationInput): boolean {
  return input.providedFields.carrierIdentity === true && input.providedFields.circuitInventory === true;
}
