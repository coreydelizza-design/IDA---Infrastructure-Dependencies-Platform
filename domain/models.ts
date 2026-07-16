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
}

export interface ResilienceIndicator {
  id: string;
  label: string;
  value: string;
  state: "pass" | "warning" | "fail" | "not-applicable";
  verification: VerificationState;
}

export interface CriticalService {
  id: string;
  name: string;
  status: "up" | "degraded" | "down";
  rtoMinutes: number;
  rpoMinutes: number;
}

export interface SiteRisk {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "validated" | "accepted" | "remediating" | "closed";
  control?: string;
}

export interface CarrierConnection {
  id: string;
  contractedCarrier: string;
  underlyingCarrier: string;
  role: "primary" | "secondary" | "tertiary";
  serviceType: string;
  circuitId: string;
  accessProvider: string;
  bandwidth: string;
  entrance: string;
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
  online: boolean;
  favorite: boolean;
  evidenceBadge: EvidenceBadge;
  imageAsset: string;
  score: ScoreSnapshot;
  carrierConnections: CarrierConnection[];
  dependencyCount: number;
  risks: SiteRisk[];
  cardOpenRiskCount?: number;
  criticalServices: CriticalService[];
  resilienceIndicators: ResilienceIndicator[];
  compliance: ComplianceMapping[];
  evidenceConfidence: EvidenceConfidence;
  evidenceConfidencePercent: number;
  nextReview: string;
  activity: ActivityRecord[];
  tags: string[];
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

export interface LoaRecord {
  id: string;
  enterprise: string;
  carrier: string;
  scope: string[];
  status: "draft" | "pending-signature" | "active" | "expired" | "revoked";
  effectiveDate: string;
  expirationDate: string;
  authorizedActions: string[];
  siteCount: number;
}

export interface CarrierRequest {
  id: string;
  loaId: string;
  siteId: string;
  carrier: string;
  requestType: "circuit-inventory" | "route-diversity" | "demarc-evidence" | "service-record";
  status: "draft" | "sent" | "carrier-review" | "responded" | "verified" | "closed";
  dueDate: string;
  evidenceCount: number;
}
