// Production assessment engine.
//
// Assesses a site against its versioned archetype profile using stored control
// results, and produces a point-in-time architecture-assurance snapshot:
// score + band, design conformance, assessment coverage, evidence confidence,
// residual risk, and publication state.
//
// Rules (see docs/SCORING_MODEL.md):
//   raw_score   = earned_weight / applicable_weight × 100
//   final_score = min(raw_score, any triggered critical cap)
// - An approved single-site connectivity-diversity control is not-applicable
//   (excluded from applicable weight) — never penalized.
// - Risk acceptance NEVER improves the technical score: an accepted control
//   contributes zero earned weight and remains a residual gap.

import type { HealthBand, PublicationState } from "./models";
import type { FactVerificationState } from "./provenance";
import { bandForScore } from "./scoring";

export type ControlOutcome = "pass" | "partial" | "fail" | "not-applicable" | "unassessed";

export const CONTROL_FACTOR: Record<Exclude<ControlOutcome, "not-applicable" | "unassessed">, number> = {
  pass: 1,
  partial: 0.55,
  fail: 0,
};

export type ControlCategory = "connectivity" | "power" | "facility" | "environment" | "security" | "workforce" | "cyber" | "recovery";

export interface ControlDefinition {
  id: string;
  label: string;
  weight: number;
  category: ControlCategory;
  isConnectivityDiversity?: boolean;
  /** When this control fails, the final score is capped at capScore. */
  capScore?: number;
  requiresEvidence: boolean;
}

export interface AssessmentProfile {
  id: string;
  archetype: string;
  version: string;
  redundancyExpectation: "required" | "acceptable-single" | "not-applicable";
  controls: ControlDefinition[];
}

export interface ControlResult {
  siteId: string;
  controlId: string;
  outcome: ControlOutcome;
  evidenceItemIds: string[];
  verificationState: FactVerificationState;
  note?: string;
}

export interface AssessmentContext {
  singleSiteApproved: boolean;
  /** Controls whose gaps have been formally accepted (still residual, no credit). */
  acceptedRiskControlIds?: string[];
  assessedAt: string;
}

export type DesignConformance = "conformant" | "exception-approved" | "non-conformant";

export interface AssessmentResult {
  architectureAssuranceScore: number;
  architectureAssuranceBand: HealthBand;
  label: string;
  designConformance: DesignConformance;
  assessmentCoveragePercent: number;
  evidenceConfidencePercent: number;
  residualRiskCount: number;
  publicationState: PublicationState;
  technicalGapRetained: boolean;
  earnedWeight: number;
  applicableWeight: number;
  profileVersion: string;
  assessedAt: string;
  /** Always false — this result comes from stored control results. */
  provisional: false;
}

const EVIDENCE_BACKED_STATES: FactVerificationState[] = ["provider-confirmed", "document-verified", "consultant-verified"];

/** Assess a site against its profile using stored control results. */
export function assessSite(
  profile: AssessmentProfile,
  results: ControlResult[],
  context: AssessmentContext,
): AssessmentResult {
  const resultByControl = new Map(results.map((r) => [r.controlId, r]));
  const accepted = new Set(context.acceptedRiskControlIds ?? []);

  let applicableWeight = 0;
  let earnedWeight = 0;
  let evidenceBackedEarned = 0;
  let assessedWeight = 0;
  const totalWeight = profile.controls.reduce((sum, c) => sum + c.weight, 0);
  let cappedScore = 100;
  let technicalGapRetained = false;
  let residualRiskCount = 0;
  let singleSiteExceptionApplied = false;
  let connectivityConformant = true;

  for (const control of profile.controls) {
    const result = resultByControl.get(control.id);
    const rawOutcome: ControlOutcome = result?.outcome ?? "unassessed";

    // Single-site exception: an approved single-site connectivity-diversity
    // control is not-applicable (excluded), never penalized.
    if (
      control.isConnectivityDiversity &&
      profile.redundancyExpectation === "acceptable-single" &&
      context.singleSiteApproved
    ) {
      singleSiteExceptionApplied = true;
      continue; // excluded from applicable weight
    }

    if (rawOutcome === "not-applicable") continue;
    if (rawOutcome === "unassessed") continue; // reduces coverage, not applicable weight

    assessedWeight += control.weight;

    // Accepted risk: no credit, still a residual gap.
    const isAccepted = accepted.has(control.id);
    const effectiveOutcome: Exclude<ControlOutcome, "not-applicable" | "unassessed"> =
      isAccepted ? "fail" : (rawOutcome as Exclude<ControlOutcome, "not-applicable" | "unassessed">);

    applicableWeight += control.weight;
    const factor = CONTROL_FACTOR[effectiveOutcome];
    const earned = control.weight * factor;
    earnedWeight += earned;

    if (result && EVIDENCE_BACKED_STATES.includes(result.verificationState) && result.evidenceItemIds.length > 0) {
      evidenceBackedEarned += earned;
    }

    if (effectiveOutcome === "fail" || effectiveOutcome === "partial" || isAccepted) residualRiskCount += 1;
    if (effectiveOutcome === "fail" && !control.isConnectivityDiversity) technicalGapRetained = true;
    if (control.isConnectivityDiversity && effectiveOutcome !== "pass") connectivityConformant = false;
    if (control.capScore !== undefined && effectiveOutcome === "fail") cappedScore = Math.min(cappedScore, control.capScore);
  }

  const rawScore = applicableWeight === 0 ? 100 : Math.round((earnedWeight / applicableWeight) * 100);
  const score = Math.min(rawScore, cappedScore);
  const band = bandForScore(score);

  const assessmentCoveragePercent = totalWeight === 0 ? 0 : Math.round((assessedWeight / totalWeight) * 100);
  const evidenceConfidencePercent = earnedWeight === 0 ? 0 : Math.round((evidenceBackedEarned / earnedWeight) * 100);

  const designConformance: DesignConformance = singleSiteExceptionApplied
    ? "exception-approved"
    : connectivityConformant
      ? "conformant"
      : "non-conformant";

  const publicationState: PublicationState =
    assessmentCoveragePercent < 40 ? "insufficient-assessment" : assessmentCoveragePercent < 80 ? "provisional" : "publishable";

  return {
    architectureAssuranceScore: score,
    architectureAssuranceBand: band.band,
    label: band.label,
    designConformance,
    assessmentCoveragePercent,
    evidenceConfidencePercent,
    residualRiskCount,
    publicationState,
    technicalGapRetained,
    earnedWeight,
    applicableWeight,
    profileVersion: profile.version,
    assessedAt: context.assessedAt,
    provisional: false,
  };
}

/** A persisted point-in-time assessment snapshot. */
export interface AssuranceSnapshot {
  id: string;
  engagementId: string;
  siteId: string;
  architectureAssuranceScore: number;
  architectureAssuranceBand: HealthBand;
  assessmentCoveragePercent: number;
  evidenceConfidencePercent: number;
  residualRiskCount: number;
  publicationState: PublicationState;
  designConformance: DesignConformance;
  profileVersion: string;
  calculatedAt: string;
  createdAt: string;
}

export function snapshotFromResult(
  id: string,
  engagementId: string,
  siteId: string,
  result: AssessmentResult,
  createdAt: string,
): AssuranceSnapshot {
  return {
    id,
    engagementId,
    siteId,
    architectureAssuranceScore: result.architectureAssuranceScore,
    architectureAssuranceBand: result.architectureAssuranceBand,
    assessmentCoveragePercent: result.assessmentCoveragePercent,
    evidenceConfidencePercent: result.evidenceConfidencePercent,
    residualRiskCount: result.residualRiskCount,
    publicationState: result.publicationState,
    designConformance: result.designConformance,
    profileVersion: result.profileVersion,
    calculatedAt: result.assessedAt,
    createdAt,
  };
}
