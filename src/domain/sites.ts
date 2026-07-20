import type {
  ActivityRecord,
  CardCarrierConnection,
  CardCriticalService,
  ComplianceMapping,
  EvidenceBadge,
  EvidenceConfidence,
  PublicationState,
  ResilienceIndicator,
  ScoreSnapshot,
  Site,
  SiteRisk,
} from "./models";
import type { AssessmentStatus, RegistryState } from "./siteStates";

/** 1..5 controlled scales (labeled sliders in the intake UI). */
export type Scale5 = 1 | 2 | 3 | 4 | 5;

export type OwnershipModel = "owned" | "leased" | "colocation" | "cloud" | "provider-managed" | "unknown";
export type OccupancyModel = "single-tenant" | "multi-tenant" | "shared" | "unknown";

/**
 * Rich persisted Site aggregate. Retains the structural facts required by the
 * registry. The embedded presentation collections let `presentSite` build the
 * approved card/inspector view without rebuilding the layout.
 */
export interface SiteRecord {
  id: string;
  tenantId: string;
  enterpriseClientId: string;
  engagementId: string;
  code: string;
  name: string;
  archetypeId: string;
  primaryLocationType: string;
  secondaryLocationTypes: string[];
  businessRoles: string[];
  networkRoles: string[];
  address: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  countryCode: string;
  countryName: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  ownershipModel: OwnershipModel;
  occupancyModel: OccupancyModel;
  operatingHours: string;
  userCount: number | null;
  endpointCount: number | null;
  businessCriticality: Scale5;
  operationalDependency: Scale5;
  safetyImpact: Scale5;
  regulatoryScope: string[];
  registryState: RegistryState;
  assessmentStatus: AssessmentStatus;
  completenessPercent: number;
  lastVerifiedAt: string;
  nextReviewAt: string;
  consultantOwnerId: string | null;
  enterpriseOwnerContactId: string | null;
  pendingEnterpriseRequestCount: number;
  pendingCarrierRequestCount: number;
  unresolvedDependencyCount: number;
  openDataGapCount: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;

  // --- Embedded presentation support (region/criticality/owner display etc.) ---
  region: string;
  criticalityLabel: string;
  ownerLabel: string;
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
  publicationState: PublicationState;
  tags: string[];
}

/** Adapter: map the rich Site aggregate into the approved card/inspector view. */
export function presentSite(record: SiteRecord): Site {
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    type: record.archetypeId,
    locationType: record.primaryLocationType,
    criticality: record.criticalityLabel,
    city: record.city,
    countryCode: record.countryCode,
    countryName: record.countryName,
    region: record.region,
    address: record.address,
    timezone: record.timezone,
    owner: record.ownerLabel,
    favorite: record.favorite,
    evidenceBadge: record.evidenceBadge,
    imageAsset: record.imageAsset,
    score: record.score,
    carrierConnections: record.carrierConnections,
    dependencyCount: record.dependencyCount,
    risks: record.risks,
    cardOpenRiskCount: record.cardOpenRiskCount,
    criticalServices: record.criticalServices,
    resilienceIndicators: record.resilienceIndicators,
    compliance: record.compliance,
    evidenceConfidence: record.evidenceConfidence,
    evidenceConfidencePercent: record.evidenceConfidencePercent,
    activity: record.activity,
    tags: record.tags,
    registryState: record.registryState,
    assessmentStatus: record.assessmentStatus,
    completenessPercent: record.completenessPercent,
    lastVerifiedAt: record.lastVerifiedAt,
    nextReviewAt: record.nextReviewAt,
    pendingEnterpriseRequestCount: record.pendingEnterpriseRequestCount,
    pendingCarrierRequestCount: record.pendingCarrierRequestCount,
    unresolvedDependencyCount: record.unresolvedDependencyCount,
    openDataGapCount: record.openDataGapCount,
    publicationState: record.publicationState,
  };
}
