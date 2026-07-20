// Presentation-facing types consumed by the approved UI components. The rich
// persisted aggregates live in their own modules (see index.ts); a presenter
// maps a rich Site aggregate into the `Site` view type below so the approved
// card/inspector layout does not need to be rebuilt.

import type { AssessmentStatus, RegistryState } from "./siteStates";
import type { ServiceAssuranceState, ServiceCriticality } from "./services";

export type HealthBand = "excellent" | "good" | "at-risk" | "critical";
export type EvidenceBadge =
  | "evidence-verified"
  | "provider-claimed-diverse"
  | "under-carrier-review"
  | "single-site-acceptable"
  | "risk-accepted"
  | null;

export type RoleMode = "loa" | "carrier";
export type InventoryView = "grid" | "list";
export type DetailTab = "overview" | "resilience" | "risks" | "dependencies" | "compliance" | "history";
export type EvidenceConfidence = "high" | "medium" | "low";
export type RequirementState = "compliant" | "mapped" | "gap" | "not-applicable";
export type VerificationState = "verified" | "provider-claimed" | "inferred" | "unknown";

export interface ScoreSnapshot {
  score: number;
  band: HealthBand;
  label: string;
  profileVersion: string;
  assessedAt: string;
  singleSiteApproved: boolean;
  technicalGapRetained: boolean;
  /** Provisional when the score does not come from stored control results. */
  provisional: boolean;
}

export interface ResilienceIndicator {
  id: string;
  label: string;
  value: string;
  state: "pass" | "warning" | "fail" | "not-applicable";
  verification: VerificationState;
}

/** Presentation view of a critical-service dependency (no live status). */
export interface CardCriticalService {
  id: string;
  name: string;
  criticality: ServiceCriticality;
  assuranceState: ServiceAssuranceState;
}

export interface SiteRisk {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "validated" | "accepted" | "remediating" | "closed";
  control?: string;
}

/** Presentation view of a connectivity dependency for the inspector. */
export interface CardCarrierConnection {
  id: string;
  contractedCarrier: string;
  underlyingCarrier: string;
  role: "primary" | "secondary" | "tertiary";
  serviceType: string;
  circuitId: string;
  routeVerification: VerificationState;
}

export interface ComplianceMapping {
  framework: "DORA" | "ICT (EU)" | "ISO 22301" | "NIS2";
  state: RequirementState;
  mappedControls: number;
  lastAssessed: string;
}

export interface ActivityRecord {
  id: string;
  action: string;
  actor: string;
  relativeTime: string;
}

/** Architecture-assurance summary surfaced in the UI. */
export type PublicationState = "insufficient-assessment" | "provisional" | "publishable" | "superseded";

export interface Site {
  id: string;
  code: string;
  name: string;
  type: string;
  locationType: string;
  criticality: string;
  city: string;
  countryCode: string;
  countryName: string;
  region: string;
  address: string;
  timezone: string;
  owner: string;
  favorite: boolean;
  evidenceBadge: EvidenceBadge;
  imageAsset: string;
  score: ScoreSnapshot;
  carrierConnections: CardCarrierConnection[];
  dependencyCount: number;
  risks: SiteRisk[];
  cardOpenRiskCount?: number;
  criticalServices: CardCriticalService[];
  resilienceIndicators: ResilienceIndicator[];
  compliance: ComplianceMapping[];
  evidenceConfidence: EvidenceConfidence;
  evidenceConfidencePercent: number;
  activity: ActivityRecord[];
  tags: string[];
  // Phase 1 assurance/registry fields
  registryState: RegistryState;
  assessmentStatus: AssessmentStatus;
  completenessPercent: number;
  lastVerifiedAt: string;
  nextReviewAt: string;
  pendingEnterpriseRequestCount: number;
  pendingCarrierRequestCount: number;
  unresolvedDependencyCount: number;
  openDataGapCount: number;
  publicationState: PublicationState;
}

export interface PortfolioSummary {
  totalSites: number;
  countries: number;
  excellent: { count: number; percentage: number };
  good: { count: number; percentage: number };
  atRisk: { count: number; percentage: number };
  critical: { count: number; percentage: number };
  averageScore: number;
  averageLabel: string;
}

export interface ScoringControlInput {
  id: string;
  weight: number;
  result: "pass" | "partial" | "fail" | "not-applicable";
  isConnectivityDiversityControl?: boolean;
}

export interface ScoringProfile {
  id: string;
  version: string;
  archetype: string;
  redundancyExpectation: "required" | "acceptable-single" | "not-applicable";
  criticalCaps: Array<{ controlId: string; maxScore: number }>;
}
