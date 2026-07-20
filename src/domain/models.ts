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

// ---------------------------------------------------------------------------
// Consultancy-assurance product spine
//
// IDA is a consultancy-operated Infrastructure Dependency Assurance registry.
// It is NOT a monitoring/observability/NOC/alerting/uptime platform. The types
// below describe engagement, authorization, reconciliation, and point-in-time
// assurance — never live operational up/down state. See AGENTS.md ("Canonical
// product operating model").
// ---------------------------------------------------------------------------

export type UserRole =
  | "consultancy-admin"
  | "engagement-lead"
  | "consultant"
  | "evidence-reviewer"
  | "enterprise-sponsor"
  | "enterprise-contributor"
  | "enterprise-approver"
  | "carrier-respondent"
  | "carrier-reviewer"
  | "read-only-reviewer";

/** Lifecycle of a site's registry record. Deliberately excludes operational
 * up/down/online/offline states — a registry state is not a health state. */
export type RegistryState =
  | "engagement-established"
  | "collecting"
  | "in-reconciliation"
  | "assured"
  | "revalidation-due";

/** Point-in-time assessment lifecycle. Never a live status. */
export type AssessmentStatus =
  | "not-started"
  | "in-progress"
  | "assessed"
  | "revalidation-due"
  | "expired";

/** How well a documented fact is verified. A consultant-verified fact is
 * canonical and cannot be directly overwritten by a carrier response. */
export type FactVerificationState =
  | "consultant-verified"
  | "enterprise-provided"
  | "provider-claimed"
  | "inferred"
  | "unknown"
  | "disputed";

/** Reconciliation state of a dependency relationship. */
export type DependencyState =
  | "documented"
  | "proposed"
  | "unverified"
  | "disputed"
  | "reconciled"
  | "gap";

export interface Engagement {
  id: string;
  enterpriseName: string;
  status: "onboarding" | "active" | "closed";
  startedAt: string;
  engagementLeadId: string;
  scopeSummary: string;
}

export interface EngagementMember {
  id: string;
  engagementId: string;
  userId: string;
  name: string;
  role: UserRole;
}

export interface EnterpriseContact {
  id: string;
  engagementId: string;
  name: string;
  title: string;
  role: UserRole;
  email?: string;
}

/** Provenance of a single field value — who supplied it, how verified it is,
 * and whether it is locked as a consultant-verified canonical fact. */
export interface FieldProvenance {
  source: "consultant" | "enterprise" | "carrier" | "connector" | "inferred";
  verificationState: FactVerificationState;
  updatedAt: string;
  updatedBy?: string;
  /** Locked canonical facts are protected from direct carrier overwrite and
   * require consultant reconciliation to change. */
  locked: boolean;
}

/** A canonical registry fact with provenance. */
export interface CanonicalFact<T = string> {
  id: string;
  siteId: string;
  field: string;
  value: T;
  provenance: FieldProvenance;
}

/** A missing/unknown required fact — recorded rather than fabricated. */
export interface DataGap {
  id: string;
  siteId: string;
  field: string;
  description: string;
  requiredFor?: string;
  state: "open" | "in-progress" | "resolved";
  /** Who must supply the missing fact. */
  followUp: "enterprise" | "carrier" | "internal" | "none";
  createdAt: string;
}

export type ConfirmationRequestStatus =
  | "draft"
  | "authorized"
  | "submitted"
  | "carrier-review"
  | "responded"
  | "reconciled"
  | "closed";

/** A scoped request to a carrier/provider to confirm specified facts. */
export interface ConfirmationRequest {
  id: string;
  engagementId: string;
  authorizationId: string;
  siteId: string;
  carrier: string;
  requestedFields: string[];
  status: ConfirmationRequestStatus;
  createdAt: string;
  dueAt: string;
}

export type ConfirmationDisposition = "confirm" | "correct" | "dispute" | "support";

/** A carrier's reply to a confirmation request. It enters staging as proposed
 * claims — it never directly alters a published assessment. */
export interface ConfirmationResponse {
  id: string;
  requestId: string;
  carrier: string;
  respondentRole: UserRole;
  disposition: ConfirmationDisposition;
  proposedFields: Array<{ field: string; value: string }>;
  evidenceRefs: string[];
  submittedAt: string;
  reconciliationStatus: "staged" | "accepted" | "rejected" | "superseded";
}

/** A consultant's reconciliation of a proposed claim against canonical facts. */
export interface ReconciliationDecision {
  id: string;
  responseId: string;
  factId: string;
  consultantUserId: string;
  decision: "accept" | "reject" | "supersede" | "hold";
  rationale: string;
  decidedAt: string;
}

export type SignatureStatus = "unsigned" | "pending-signature" | "signed";
export type AuthorizationStatus = "draft" | "pending-signature" | "active" | "expired" | "revoked";

/** Enterprise-issued authorization permitting the consultancy to engage
 * specified carriers about specified sites and fields. Replaces the prior LOA
 * record. Carrier acknowledgment is tracked separately (see CarrierAcknowledgment). */
export interface EnterpriseAuthorization {
  id: string;
  engagementId: string;
  enterprise: string;
  carriers: string[];
  /** Site ids in scope. Empty means no site is authorized. */
  scopeSites: string[];
  /** Field names the carrier is authorized to see/confirm. */
  scopeFields: string[];
  signatureStatus: SignatureStatus;
  status: AuthorizationStatus;
  effectiveDate: string;
  expirationDate: string;
  revokedAt?: string | null;
  siteCount: number;
}

export type AcknowledgmentStatus = "not-sent" | "pending" | "acknowledged" | "declined";

/** A carrier's acknowledgment of an authorization — a separate state from the
 * enterprise's signature/authorization status. */
export interface CarrierAcknowledgment {
  id: string;
  authorizationId: string;
  carrier: string;
  acknowledgmentStatus: AcknowledgmentStatus;
  acknowledgedAt?: string | null;
}

// --- Connector domain contracts (point-in-time only; never continuous) ------

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
  produces: "proposed-claims" | "evidence" | "signature";
  /** Connectors are point-in-time imports; continuous monitoring is not supported. */
  continuous: false;
}

/** Connector output is staged as a proposed claim requiring reconciliation
 * before it can become canonical. */
export interface ProposedClaim {
  id: string;
  connectorKind: ConnectorKind;
  siteId?: string;
  field: string;
  proposedValue: string;
  source: FieldProvenance["source"];
  receivedAt: string;
  reconciliationStatus: "staged" | "accepted" | "rejected" | "superseded";
}

// --- Site model -------------------------------------------------------------

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

export type ServiceAssuranceState = "assured" | "partially-assured" | "unassured" | "not-assessed";

/** A critical service and its documented assurance posture. This describes
 * criticality, dependency role, and recovery objectives — never live up/down. */
export interface CriticalService {
  id: string;
  name: string;
  criticality: "critical" | "high" | "standard";
  dependencyRole: "primary" | "supporting" | "downstream";
  rtoMinutes: number;
  rpoMinutes: number;
  assuranceState: ServiceAssuranceState;
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
  dependencyState?: DependencyState;
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

export interface VerificationSummary {
  verified: number;
  providerClaimed: number;
  unverified: number;
  gaps: number;
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
  engagementId: string;
  registryState: RegistryState;
  assessmentStatus: AssessmentStatus;
  completenessPercent: number;
  lastVerifiedAt: string;
  nextReviewAt: string;
  pendingEnterpriseRequests: number;
  pendingCarrierRequests: number;
  unresolvedDependencyCount: number;
  verificationSummary: VerificationSummary;
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
  activity: ActivityRecord[];
  dataGaps: DataGap[];
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
