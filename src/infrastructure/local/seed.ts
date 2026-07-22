import type {
  ActivityRecord,
  AssuranceSnapshot,
  CardCarrierConnection,
  CardCriticalService,
  ComplianceMapping,
  Contract,
  ControlResult,
  Engagement,
  EnterpriseClient,
  EvidenceBadge,
  EvidenceConfidence,
  HealthBand,
  Provider,
  ResilienceIndicator,
  SiteRecord,
  SiteRisk,
} from "../../domain";
import type { RegistryState } from "../../domain";
import type { RegistryDataset } from "./localStore";

const NOW = "2026-07-20T00:00:00.000Z";
const ORG_ID = "org-ida-consulting";
const ENTERPRISE_ID = "ent-enterprise-co";
const ENGAGEMENT_ID = "eng-2026-001";
const TENANT_ID = ORG_ID;

const commonIndicators: ResilienceIndicator[] = [
  { id: "power", label: "Power Resilience", value: "Redundant (N+1)", state: "pass", verification: "verified" },
  { id: "connectivity", label: "Connectivity Resilience", value: "Multi-Carrier Diverse", state: "pass", verification: "verified" },
  { id: "facility", label: "Facility Resilience", value: "Tier III", state: "pass", verification: "verified" },
  { id: "environment", label: "Environmental Controls", value: "Redundant (N+1)", state: "pass", verification: "verified" },
  { id: "physical", label: "Physical Security", value: "High", state: "pass", verification: "verified" },
  { id: "workforce", label: "Workforce Availability", value: "High", state: "pass", verification: "verified" },
  { id: "cyber", label: "Cyber Resilience", value: "Strong", state: "pass", verification: "verified" },
  { id: "recovery", label: "Backup & Recovery", value: "Strong", state: "pass", verification: "verified" },
];

const commonServices: CardCriticalService[] = [
  { id: "svc-core-banking", name: "Core Banking Platform", criticality: "critical", assuranceState: "confirmed" },
  { id: "svc-customer-data", name: "Customer Data Platform", criticality: "important", assuranceState: "documented" },
  { id: "svc-payments", name: "Payments Processing", criticality: "essential", assuranceState: "confirmation-pending" },
];

const commonCompliance: ComplianceMapping[] = [
  { framework: "DORA", state: "mapped", mappedControls: 14, lastAssessed: "2 days ago" },
  { framework: "ICT (EU)", state: "mapped", mappedControls: 11, lastAssessed: "2 days ago" },
  { framework: "ISO 22301", state: "mapped", mappedControls: 9, lastAssessed: "12 days ago" },
];

const commonActivity: ActivityRecord[] = [
  { id: "activity-1", action: "Assessment snapshot recorded", actor: "Sarah J.", relativeTime: "2 days ago" },
  { id: "activity-2", action: "Evidence package updated", actor: "System", relativeTime: "2 days ago" },
  { id: "activity-3", action: "Data gap DG-102 raised", actor: "Michael T.", relativeTime: "5 days ago" },
];

function registryStateForBadge(badge: EvidenceBadge, confidence: EvidenceConfidence): RegistryState {
  if (badge === "evidence-verified") return "consultant-verified";
  if (badge === "under-carrier-review") return "carrier-confirmation-pending";
  if (badge === "provider-claimed-diverse") return "partially-confirmed";
  if (badge === "single-site-acceptable") return "consultant-verified";
  if (badge === "risk-accepted") return "review-due";
  return confidence === "high" ? "consultant-verified" : "consultant-review";
}

interface SiteSpec {
  id: string;
  /** Owning engagement; defaults to the canonical ENG-2026-001 when omitted. */
  engagementId?: string;
  /** Owning enterprise; defaults to the canonical Enterprise Co. when omitted. */
  enterpriseClientId?: string;
  code: string;
  name: string;
  archetype: string;
  primaryLocationType: string;
  criticalityLabel: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  countryCode: string;
  countryName: string;
  region: string;
  address: string;
  timezone: string;
  owner: string;
  favorite: boolean;
  evidenceBadge: EvidenceBadge;
  image: string;
  score: number;
  band: HealthBand;
  label: string;
  assessedAt: string;
  singleSiteApproved: boolean;
  technicalGapRetained: boolean;
  carriers: CardCarrierConnection[];
  dependencyCount: number;
  cardOpenRiskCount: number;
  risks: SiteRisk[];
  evidenceConfidence: EvidenceConfidence;
  evidenceConfidencePercent: number;
  nextReviewAt: string;
  indicators?: ResilienceIndicator[];
  tags: string[];
  /** Workload / network-traffic categories (WorkloadId[]); defaults to none. */
  workloads?: string[];
}

function buildSite(spec: SiteSpec): SiteRecord {
  const verified = spec.carriers.filter((c) => c.routeVerification === "verified").length;
  const providerClaimed = spec.carriers.filter((c) => c.routeVerification === "provider-claimed").length;
  const total = spec.carriers.length;
  const documented = verified + providerClaimed;
  const openRisks = spec.risks.filter((r) => r.status === "open").length;
  const enterpriseClientId = spec.enterpriseClientId ?? ENTERPRISE_ID;
  const engagementId = spec.engagementId ?? ENGAGEMENT_ID;
  const isCanonical = enterpriseClientId === ENTERPRISE_ID;
  return {
    id: spec.id,
    tenantId: TENANT_ID,
    enterpriseClientId,
    engagementId,
    code: spec.code,
    name: spec.name,
    archetypeId: spec.archetype,
    primaryLocationType: spec.primaryLocationType,
    secondaryLocationTypes: [],
    businessRoles: [],
    networkRoles: [],
    workloads: spec.workloads ?? [],
    address: spec.address,
    city: spec.city,
    stateProvince: spec.stateProvince,
    postalCode: spec.postalCode,
    countryCode: spec.countryCode,
    countryName: spec.countryName,
    latitude: null,
    longitude: null,
    timezone: spec.timezone,
    ownershipModel: "unknown",
    occupancyModel: "unknown",
    operatingHours: "24x7",
    userCount: null,
    endpointCount: null,
    businessCriticality: 4,
    operationalDependency: 4,
    safetyImpact: 1,
    regulatoryScope: [],
    registryState: registryStateForBadge(spec.evidenceBadge, spec.evidenceConfidence),
    assessmentStatus: "published",
    completenessPercent: Math.round(60 + (documented / Math.max(total, 1)) * 40),
    lastVerifiedAt: spec.assessedAt,
    nextReviewAt: spec.nextReviewAt,
    consultantOwnerId: "user-consultant-1",
    // Demo-portfolio sites have no seeded enterprise contacts; avoid a dangling ref.
    enterpriseOwnerContactId: isCanonical ? "con-1" : null,
    pendingEnterpriseRequestCount: openRisks > 0 ? 1 : 0,
    pendingCarrierRequestCount: providerClaimed + (total - documented),
    unresolvedDependencyCount: spec.carriers.filter((c) => c.routeVerification !== "verified").length,
    openDataGapCount: 0,
    archivedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    version: 1,
    region: spec.region,
    criticalityLabel: spec.criticalityLabel,
    ownerLabel: spec.owner,
    favorite: spec.favorite,
    evidenceBadge: spec.evidenceBadge,
    imageAsset: spec.image,
    score: {
      score: spec.score,
      band: spec.band,
      label: spec.label,
      profileVersion: "2026.1",
      assessedAt: spec.assessedAt,
      singleSiteApproved: spec.singleSiteApproved,
      technicalGapRetained: spec.technicalGapRetained,
      provisional: false,
    },
    carrierConnections: spec.carriers,
    dependencyCount: spec.dependencyCount,
    risks: spec.risks,
    cardOpenRiskCount: spec.cardOpenRiskCount,
    criticalServices: commonServices,
    resilienceIndicators: spec.indicators ?? commonIndicators,
    compliance: commonCompliance,
    evidenceConfidence: spec.evidenceConfidence,
    evidenceConfidencePercent: spec.evidenceConfidencePercent,
    activity: commonActivity,
    publicationState: "publishable",
    tags: spec.tags,
  };
}

const ASSESSMENT_CONTROL_IDS = [
  "connectivity-diversity", "power-resilience", "facility-resilience", "environmental-controls",
  "physical-security", "workforce-availability", "cyber-resilience", "backup-recovery",
];

/**
 * Seed stored control results + a published assurance snapshot per site so
 * seeded scores are assessment-backed (non-provisional). The stored snapshot
 * score is the last published value; "Run Assessment" recomputes from the
 * control-result working set via the engine.
 */
function assessmentArtifacts(sites: SiteRecord[]): { controlResults: ControlResult[]; snapshots: AssuranceSnapshot[] } {
  const controlResults: ControlResult[] = [];
  const snapshots: AssuranceSnapshot[] = [];
  for (const site of sites) {
    const conf = site.evidenceConfidencePercent;
    const singleCarrier = site.carrierConnections.length <= 1 && !site.score.singleSiteApproved;
    const backed = conf >= 85;
    for (const controlId of ASSESSMENT_CONTROL_IDS) {
      let outcome: ControlResult["outcome"] = "pass";
      if (controlId === "connectivity-diversity" && singleCarrier) outcome = site.score.band === "at-risk" ? "fail" : "partial";
      else if (controlId === "backup-recovery" && conf < 85) outcome = "partial";
      else if (site.score.band === "at-risk" && (controlId === "power-resilience" || controlId === "environmental-controls")) outcome = "partial";
      controlResults.push({
        siteId: site.id,
        controlId,
        outcome,
        evidenceItemIds: backed ? [`ev-${site.id}-${controlId}`] : [],
        verificationState: backed ? "consultant-verified" : "provider-claimed",
      });
    }
    snapshots.push({
      id: `snapshot-${site.id}`,
      engagementId: site.engagementId,
      siteId: site.id,
      architectureAssuranceScore: site.score.score,
      architectureAssuranceBand: site.score.band,
      assessmentCoveragePercent: 100,
      evidenceConfidencePercent: conf,
      residualRiskCount: site.risks.filter((r) => r.status !== "closed").length,
      publicationState: "publishable",
      designConformance: site.score.singleSiteApproved ? "exception-approved" : singleCarrier ? "non-conformant" : "conformant",
      profileVersion: "2026.1",
      calculatedAt: site.score.assessedAt,
      createdAt: NOW,
    });
  }
  return { controlResults, snapshots };
}

function carrier(
  id: string,
  contractedCarrier: string,
  underlyingCarrier: string,
  role: CardCarrierConnection["role"],
  serviceType: string,
  circuitId: string,
  routeVerification: CardCarrierConnection["routeVerification"],
): CardCarrierConnection {
  return { id, contractedCarrier, underlyingCarrier, role, serviceType, circuitId, routeVerification };
}

const siteSpecs: SiteSpec[] = [
  {
    id: "site-dc1-london", code: "DC1", name: "London", archetype: "Primary Data Center", primaryLocationType: "Tier I / Mission Critical",
    criticalityLabel: "Tier I Mission Critical", city: "London", stateProvince: "England", postalCode: "EC1A 1BB", countryCode: "UK",
    countryName: "United Kingdom", region: "EMEA", address: "1 Data Center Way\nLondon, UK EC1A 1BB", timezone: "GMT (UTC+0)", owner: "Resilience Office",
    favorite: false, evidenceBadge: "evidence-verified", image: "/assets/sites/dc1-london.webp", score: 95, band: "excellent", label: "Excellent",
    assessedAt: "2 days ago", singleSiteApproved: false, technicalGapRetained: false,
    carriers: [carrier("circuit-dc1-bt", "BT Global Services", "Openreach", "primary", "10G DIA", "BT-DC1-001", "verified"), carrier("circuit-dc1-lumen", "Lumen", "Lumen", "secondary", "10G DIA", "LVLT-DC1-784", "verified")],
    dependencyCount: 14, cardOpenRiskCount: 0,
    risks: [{ id: "RSK-102", title: "Annual carrier route evidence renewal", severity: "high", status: "validated", control: "ICT-TPRM-06" }, { id: "RSK-119", title: "Cross-connect maintenance coordination", severity: "medium", status: "open", control: "OPS-BCP-12" }],
    evidenceConfidence: "high", evidenceConfidencePercent: 92, nextReviewAt: "in 28 days", tags: ["primary", "data-center", "critical", "dora", "verified"],
  },
  {
    id: "site-dc2-frankfurt", code: "DC2", name: "Frankfurt", archetype: "Secondary Data Center", primaryLocationType: "Tier II / Critical",
    criticalityLabel: "Tier II Critical", city: "Frankfurt", stateProvince: "Hesse", postalCode: "60314", countryCode: "DE",
    countryName: "Germany", region: "EMEA", address: "Hanauer Landstrasse 302\nFrankfurt 60314", timezone: "CET (UTC+1)", owner: "Infrastructure Operations",
    favorite: false, evidenceBadge: "provider-claimed-diverse", image: "/assets/sites/dc2-frankfurt.webp", score: 92, band: "excellent", label: "Excellent",
    assessedAt: "3 days ago", singleSiteApproved: false, technicalGapRetained: false,
    carriers: [carrier("circuit-dc2-colt", "Colt", "Colt", "primary", "10G EPL", "COLT-FRA-10G", "provider-claimed"), carrier("circuit-dc2-gtt", "GTT", "Versatel", "secondary", "10G DIA", "GTT-FRA-21", "provider-claimed")],
    dependencyCount: 11, cardOpenRiskCount: 0, risks: [], evidenceConfidence: "medium", evidenceConfidencePercent: 81, nextReviewAt: "in 31 days", tags: ["secondary", "data-center", "provider-claimed"],
  },
  {
    id: "site-br-1001-paris", code: "BR-1001", name: "Paris", archetype: "Branch Office", primaryLocationType: "Standard Branch",
    criticalityLabel: "Tier III Business Critical", city: "Paris", stateProvince: "Île-de-France", postalCode: "75009", countryCode: "FR",
    countryName: "France", region: "EMEA", address: "18 Rue de Londres\nParis 75009", timezone: "CET (UTC+1)", owner: "France IT",
    favorite: true, evidenceBadge: null, image: "/assets/sites/br-1001-paris.webp", score: 78, band: "good", label: "Good",
    assessedAt: "7 days ago", singleSiteApproved: false, technicalGapRetained: true,
    carriers: [carrier("circuit-paris-orange", "Orange Business", "Orange", "primary", "1G DIA", "OBS-PAR-1001", "unknown")],
    dependencyCount: 7, cardOpenRiskCount: 2,
    risks: [{ id: "RSK-205", title: "No independent secondary access", severity: "high", status: "open", control: "NET-DIV-01" }, { id: "RSK-207", title: "Single building entrance", severity: "medium", status: "open", control: "PHY-DIV-02" }],
    evidenceConfidence: "medium", evidenceConfidencePercent: 68, nextReviewAt: "in 14 days", tags: ["branch", "single-carrier", "france"],
  },
  {
    id: "site-trd-new-york", code: "TRD", name: "New York", archetype: "Financial Trading Floor", primaryLocationType: "Regulated Trading Facility",
    criticalityLabel: "Tier I Mission Critical", city: "New York", stateProvince: "NY", postalCode: "10001", countryCode: "US",
    countryName: "United States", region: "Americas", address: "55 Hudson Yards\nNew York, NY 10001", timezone: "EST (UTC-5)", owner: "Global Markets Technology",
    favorite: false, evidenceBadge: "under-carrier-review", image: "/assets/sites/trd-new-york.webp", score: 90, band: "excellent", label: "Excellent",
    assessedAt: "1 day ago", singleSiteApproved: false, technicalGapRetained: false,
    carriers: [carrier("circuit-trd-lumen", "Lumen", "Lumen", "primary", "10G Wave", "TRD-LUM-01", "verified"), carrier("circuit-trd-zayo", "Zayo", "Zayo", "secondary", "10G Wave", "TRD-ZAY-02", "verified"), carrier("circuit-trd-verizon", "Verizon", "Verizon", "tertiary", "5G DIA", "TRD-VZ-03", "provider-claimed")],
    dependencyCount: 18, cardOpenRiskCount: 0, risks: [], evidenceConfidence: "high", evidenceConfidencePercent: 89, nextReviewAt: "in 21 days", tags: ["trading", "regulated", "low-latency", "carrier-review"],
  },
  {
    id: "site-ro-singapore", code: "RO", name: "Singapore", archetype: "Regional Office", primaryLocationType: "Regional Office",
    criticalityLabel: "Tier III Business Critical", city: "Singapore", stateProvince: "—", postalCode: "018960", countryCode: "SG",
    countryName: "Singapore", region: "APAC", address: "8 Marina View\nSingapore 018960", timezone: "SGT (UTC+8)", owner: "APAC Technology",
    favorite: false, evidenceBadge: "single-site-acceptable", image: "/assets/sites/ro-singapore.webp", score: 72, band: "good", label: "Good",
    assessedAt: "6 days ago", singleSiteApproved: true, technicalGapRetained: true,
    carriers: [carrier("circuit-ro-singtel", "Singtel", "Singtel", "primary", "1G DIA", "SGT-RO-01", "verified"), carrier("circuit-ro-starhub", "StarHub", "StarHub", "secondary", "500M Broadband", "SH-RO-02", "verified")],
    dependencyCount: 8, cardOpenRiskCount: 1,
    risks: [{ id: "RSK-302", title: "Shared building demarcation accepted by design", severity: "medium", status: "accepted", control: "PHY-DIV-02" }],
    indicators: [commonIndicators[0], { id: "connectivity", label: "Connectivity Resilience", value: "Approved Single-Site", state: "not-applicable", verification: "verified" }, ...commonIndicators.slice(2)],
    evidenceConfidence: "high", evidenceConfidencePercent: 86, nextReviewAt: "in 19 days", tags: ["regional-office", "single-site-acceptable", "apac"],
  },
  {
    id: "site-edge-25-madrid", code: "EDGE-25", name: "Madrid", archetype: "Edge Site", primaryLocationType: "Edge Compute Site",
    criticalityLabel: "Tier III Operations Critical", city: "Madrid", stateProvince: "Madrid", postalCode: "28006", countryCode: "ES",
    countryName: "Spain", region: "EMEA", address: "Calle de Serrano 55\nMadrid 28006", timezone: "CET (UTC+1)", owner: "Edge Platform Team",
    favorite: false, evidenceBadge: "risk-accepted", image: "/assets/sites/edge-25-madrid.webp", score: 54, band: "at-risk", label: "At Risk",
    assessedAt: "12 days ago", singleSiteApproved: false, technicalGapRetained: true,
    carriers: [carrier("circuit-edge-telefonica", "Telefónica", "Telefónica", "primary", "500M DIA", "TEL-EDGE-25", "unknown")],
    dependencyCount: 6, cardOpenRiskCount: 4,
    risks: [{ id: "RSK-401", title: "Single carrier dependency", severity: "high", status: "accepted", control: "NET-DIV-01" }, { id: "RSK-402", title: "No carrier route evidence", severity: "high", status: "open", control: "EVD-03" }, { id: "RSK-403", title: "UPS runtime below standard", severity: "medium", status: "remediating", control: "PWR-02" }, { id: "RSK-404", title: "No tertiary wireless path", severity: "low", status: "open", control: "NET-BKP-04" }],
    indicators: commonIndicators.map((i) => i.id === "connectivity" ? { ...i, value: "Single Carrier", state: "fail" as const, verification: "unknown" as const } : i.id === "power" ? { ...i, value: "UPS Only", state: "warning" as const } : i),
    evidenceConfidence: "low", evidenceConfidencePercent: 49, nextReviewAt: "in 7 days", tags: ["edge", "risk-accepted", "single-carrier", "spain"],
  },
  {
    id: "site-aws-eu-west-1", code: "AWS", name: "eu-west-1", archetype: "Cloud Region", primaryLocationType: "Hyperscale Cloud Region",
    criticalityLabel: "Tier I Mission Critical", city: "Dublin", stateProvince: "Leinster", postalCode: "—", countryCode: "IE",
    countryName: "Ireland", region: "EMEA", address: "AWS eu-west-1\nMultiple Availability Zones", timezone: "GMT (UTC+0)", owner: "Cloud Platform Team",
    favorite: false, evidenceBadge: "evidence-verified", image: "/assets/sites/aws-eu-west-1.webp", score: 96, band: "excellent", label: "Excellent",
    assessedAt: "1 day ago", singleSiteApproved: false, technicalGapRetained: false,
    carriers: [carrier("aws-provider", "AWS", "AWS Global Network", "primary", "Cloud Region", "aws-eu-west-1", "verified")],
    dependencyCount: 22, cardOpenRiskCount: 0, risks: [], evidenceConfidence: "high", evidenceConfidencePercent: 95, nextReviewAt: "in 34 days", tags: ["cloud", "aws", "multi-az", "verified"],
  },
  {
    id: "site-hub-amsterdam", code: "HUB", name: "Amsterdam", archetype: "Network Hub", primaryLocationType: "Regional Network Hub",
    criticalityLabel: "Tier II Critical", city: "Amsterdam", stateProvince: "North Holland", postalCode: "1098 XG", countryCode: "NL",
    countryName: "Netherlands", region: "EMEA", address: "Science Park 120\nAmsterdam 1098 XG", timezone: "CET (UTC+1)", owner: "Network Engineering",
    favorite: false, evidenceBadge: "provider-claimed-diverse", image: "/assets/sites/hub-amsterdam.webp", score: 88, band: "excellent", label: "Excellent",
    assessedAt: "4 days ago", singleSiteApproved: false, technicalGapRetained: false,
    carriers: [carrier("circuit-hub-gtt", "GTT", "GTT", "primary", "100G Wave", "GTT-AMS-100", "provider-claimed"), carrier("circuit-hub-colt", "Colt", "Colt", "secondary", "100G Wave", "COLT-AMS-100", "provider-claimed")],
    dependencyCount: 16, cardOpenRiskCount: 0, risks: [], evidenceConfidence: "medium", evidenceConfidencePercent: 80, nextReviewAt: "in 23 days", tags: ["hub", "network", "provider-claimed", "amsterdam"],
  },
];

function providersFromSites(sites: SiteRecord[]): Provider[] {
  const seen = new Map<string, Provider>();
  for (const site of sites) {
    for (const c of site.carrierConnections) {
      if (seen.has(c.contractedCarrier)) continue;
      seen.set(c.contractedCarrier, {
        id: `provider-${c.contractedCarrier.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        tenantId: TENANT_ID,
        enterpriseClientId: ENTERPRISE_ID,
        name: c.contractedCarrier,
        legalName: c.contractedCarrier,
        providerType: "contracted-carrier",
        identifiers: [],
        accountNumbers: [],
        primaryContact: null,
        verificationState: c.routeVerification === "verified" ? "consultant-verified" : "provider-claimed",
        createdAt: NOW,
        updatedAt: NOW,
      });
    }
  }
  return [...seen.values()];
}

// Additional demo enterprises + engagements so the consultant's Project
// Inventory shows a realistic portfolio at different lifecycle stages. The
// canonical Enterprise Co. / ENG-2026-001 project (with the seeded sites and the
// locked branding) remains the primary; each demo engagement carries its own
// representative sites (see demoSiteSpecs) so every project opens populated.
export const DEMO_ENTERPRISES: EnterpriseClient[] = [
  { id: "ent-northwind", consultancyOrganizationId: ORG_ID, name: "Northwind Trading", legalName: "Northwind Trading Group Ltd", industry: "Capital Markets", headquartersCountry: "US", status: "active", externalReference: "CRM-5107", createdAt: NOW, updatedAt: NOW },
  { id: "ent-meridian", consultancyOrganizationId: ORG_ID, name: "Meridian Health", legalName: "Meridian Health Systems Inc", industry: "Healthcare", headquartersCountry: "US", status: "active", externalReference: "CRM-4990", createdAt: NOW, updatedAt: NOW },
  { id: "ent-atlas", consultancyOrganizationId: ORG_ID, name: "Atlas Logistics", legalName: "Atlas Logistics International GmbH", industry: "Logistics", headquartersCountry: "DE", status: "active", externalReference: "CRM-5233", createdAt: NOW, updatedAt: NOW },
];

export const DEMO_ENGAGEMENTS: Engagement[] = [
  { id: "eng-2026-014", consultancyOrganizationId: ORG_ID, enterpriseClientId: ENTERPRISE_ID, name: "Disaster Recovery Site Review", code: "ENG-2026-014", description: "Point-in-time review of DR site dependencies and failover readiness.", status: "scoping", scopeStatement: "12 disaster-recovery and standby sites; power, connectivity, and recovery dependencies.", startDate: "2026-06-01", targetCompletionDate: "2026-11-30", reviewCadence: "one-time", leadConsultantUserId: "user-engagement-lead", createdAt: NOW, updatedAt: NOW },
  { id: "eng-2026-022", consultancyOrganizationId: ORG_ID, enterpriseClientId: "ent-northwind", name: "Trading Floor Resilience 2026", code: "ENG-2026-022", description: "Assurance of low-latency trading floor and exchange connectivity.", status: "assessment", scopeStatement: "6 trading floors and 3 exchange access points; carrier diversity and latency-path evidence.", startDate: "2026-03-10", targetCompletionDate: "2026-08-15", reviewCadence: "quarterly", leadConsultantUserId: "user-engagement-lead", createdAt: NOW, updatedAt: NOW },
  { id: "eng-2026-031", consultancyOrganizationId: ORG_ID, enterpriseClientId: "ent-meridian", name: "Data Center Consolidation Assurance", code: "ENG-2026-031", description: "Dependency assurance across a data-center consolidation programme.", status: "periodic-review", scopeStatement: "4 core data centers and 40 clinical sites; facility, power, and clinical-system dependencies.", startDate: "2025-10-01", targetCompletionDate: "2026-07-31", reviewCadence: "semi-annual", leadConsultantUserId: "user-engagement-lead", createdAt: NOW, updatedAt: NOW },
  { id: "eng-2026-040", consultancyOrganizationId: ORG_ID, enterpriseClientId: "ent-atlas", name: "Edge Network Baseline", code: "ENG-2026-040", description: "Baseline dependency registry for distribution-center edge sites.", status: "published", scopeStatement: "58 distribution-center edge sites; connectivity and wireless-failover dependencies.", startDate: "2025-09-15", targetCompletionDate: "2026-04-30", reviewCadence: "annual", leadConsultantUserId: "user-engagement-lead", createdAt: NOW, updatedAt: NOW },
];

// Demo-portfolio site specs. A small, representative set of sites for each demo
// engagement so a consultant clicking between projects always lands on a
// populated Site Inventory (varied scores, risks, and carrier evidence). The
// canonical ENG-2026-001 estate is unchanged; these sites live on other
// engagements and never affect the locked default render.
const demoSiteSpecs: SiteSpec[] = [
  // --- ENG-2026-014 · Disaster Recovery Site Review (Enterprise Co., scoping) ---
  {
    id: "site-dr1-slough", engagementId: "eng-2026-014", code: "DR1", name: "Slough", archetype: "Recovery Data Center", primaryLocationType: "Tier II / Recovery",
    criticalityLabel: "Tier II Recovery", city: "Slough", stateProvince: "Berkshire", postalCode: "SL1 4AX", countryCode: "UK", countryName: "United Kingdom", region: "EMEA",
    address: "Buckingham Avenue\nSlough SL1 4AX", timezone: "GMT (UTC+0)", owner: "Resilience Office", favorite: false, evidenceBadge: "provider-claimed-diverse", image: "/assets/sites/dc2-frankfurt.webp",
    score: 84, band: "good", label: "Good", assessedAt: "5 days ago", singleSiteApproved: false, technicalGapRetained: false,
    carriers: [carrier("circuit-dr1-bt", "BT Global Services", "Openreach", "primary", "10G DIA", "BT-DR1-014", "provider-claimed"), carrier("circuit-dr1-colt", "Colt", "Colt", "secondary", "10G EPL", "COLT-DR1-88", "provider-claimed")],
    dependencyCount: 9, cardOpenRiskCount: 1, risks: [{ id: "RSK-314", title: "Failover runbook evidence outstanding", severity: "medium", status: "open", control: "OPS-BCP-05" }],
    evidenceConfidence: "medium", evidenceConfidencePercent: 79, nextReviewAt: "in 40 days", tags: ["recovery", "data-center", "dr"],
  },
  {
    id: "site-dr2-reading", engagementId: "eng-2026-014", code: "DR2", name: "Reading", archetype: "Standby Site", primaryLocationType: "Standby",
    criticalityLabel: "Tier III Standby", city: "Reading", stateProvince: "Berkshire", postalCode: "RG1 8EQ", countryCode: "UK", countryName: "United Kingdom", region: "EMEA",
    address: "Forbury Road\nReading RG1 8EQ", timezone: "GMT (UTC+0)", owner: "Resilience Office", favorite: false, evidenceBadge: null, image: "/assets/sites/br-1001-paris.webp",
    score: 61, band: "at-risk", label: "At Risk", assessedAt: "9 days ago", singleSiteApproved: false, technicalGapRetained: true,
    carriers: [carrier("circuit-dr2-virgin", "Virgin Media O2", "Virgin", "primary", "1G DIA", "VMB-DR2-11", "unknown")],
    dependencyCount: 5, cardOpenRiskCount: 2, risks: [{ id: "RSK-320", title: "No independent secondary access", severity: "high", status: "open", control: "NET-DIV-01" }, { id: "RSK-322", title: "Standby power test overdue", severity: "medium", status: "open", control: "PWR-BCP-03" }],
    evidenceConfidence: "low", evidenceConfidencePercent: 58, nextReviewAt: "in 10 days", tags: ["standby", "single-carrier", "dr"],
  },
  {
    id: "site-dr3-manchester", engagementId: "eng-2026-014", code: "DR3", name: "Manchester", archetype: "Regional Office", primaryLocationType: "Regional Office",
    criticalityLabel: "Tier III Business Critical", city: "Manchester", stateProvince: "Greater Manchester", postalCode: "M1 4WP", countryCode: "UK", countryName: "United Kingdom", region: "EMEA",
    address: "Piccadilly Place\nManchester M1 4WP", timezone: "GMT (UTC+0)", owner: "North IT", favorite: false, evidenceBadge: "evidence-verified", image: "/assets/sites/ro-singapore.webp",
    score: 82, band: "good", label: "Good", assessedAt: "6 days ago", singleSiteApproved: false, technicalGapRetained: false,
    carriers: [carrier("circuit-dr3-bt", "BT Global Services", "Openreach", "primary", "1G DIA", "BT-DR3-02", "verified"), carrier("circuit-dr3-gtt", "GTT", "GTT", "secondary", "1G DIA", "GTT-DR3-17", "verified")],
    dependencyCount: 8, cardOpenRiskCount: 0, risks: [], evidenceConfidence: "high", evidenceConfidencePercent: 88, nextReviewAt: "in 34 days", tags: ["regional", "recovery", "dr"],
  },

  // --- ENG-2026-022 · Trading Floor Resilience 2026 (Northwind, assessment) ---
  {
    id: "site-tf1-chicago", engagementId: "eng-2026-022", enterpriseClientId: "ent-northwind", code: "TF1", name: "Chicago", archetype: "Financial Trading Floor", primaryLocationType: "Regulated Trading Facility",
    criticalityLabel: "Tier I Mission Critical", city: "Chicago", stateProvince: "IL", postalCode: "60604", countryCode: "US", countryName: "United States", region: "Americas",
    address: "141 W Jackson Blvd\nChicago, IL 60604", timezone: "CST (UTC-6)", owner: "Global Markets Technology", favorite: false, evidenceBadge: "evidence-verified", image: "/assets/sites/trd-new-york.webp",
    score: 93, band: "excellent", label: "Excellent", assessedAt: "2 days ago", singleSiteApproved: false, technicalGapRetained: false,
    carriers: [carrier("circuit-tf1-lumen", "Lumen", "Lumen", "primary", "10G Wave", "TF1-LUM-01", "verified"), carrier("circuit-tf1-zayo", "Zayo", "Zayo", "secondary", "10G Wave", "TF1-ZAY-02", "verified")],
    dependencyCount: 16, cardOpenRiskCount: 0, risks: [], evidenceConfidence: "high", evidenceConfidencePercent: 90, nextReviewAt: "in 20 days", tags: ["trading", "regulated", "low-latency"],
  },
  {
    id: "site-tf2-london", engagementId: "eng-2026-022", enterpriseClientId: "ent-northwind", code: "TF2", name: "London (City)", archetype: "Financial Trading Floor", primaryLocationType: "Regulated Trading Facility",
    criticalityLabel: "Tier I Mission Critical", city: "London", stateProvince: "England", postalCode: "EC2N 1HQ", countryCode: "UK", countryName: "United Kingdom", region: "EMEA",
    address: "Old Broad Street\nLondon EC2N 1HQ", timezone: "GMT (UTC+0)", owner: "Global Markets Technology", favorite: false, evidenceBadge: "under-carrier-review", image: "/assets/sites/dc1-london.webp",
    score: 80, band: "good", label: "Good", assessedAt: "4 days ago", singleSiteApproved: false, technicalGapRetained: false,
    carriers: [carrier("circuit-tf2-colt", "Colt", "Colt", "primary", "10G Wave", "TF2-COLT-01", "provider-claimed"), carrier("circuit-tf2-bt", "BT Global Services", "Openreach", "secondary", "10G DIA", "TF2-BT-02", "provider-claimed")],
    dependencyCount: 13, cardOpenRiskCount: 1, risks: [{ id: "RSK-410", title: "Latency-path diversity unverified", severity: "medium", status: "open", control: "NET-DIV-03" }],
    evidenceConfidence: "medium", evidenceConfidencePercent: 77, nextReviewAt: "in 18 days", tags: ["trading", "regulated", "carrier-review"],
  },
  {
    id: "site-exc1-secaucus", engagementId: "eng-2026-022", enterpriseClientId: "ent-northwind", code: "EXC1", name: "Secaucus (NY4)", archetype: "Exchange Access Point", primaryLocationType: "Colocation / Exchange Access",
    criticalityLabel: "Tier I Mission Critical", city: "Secaucus", stateProvince: "NJ", postalCode: "07094", countryCode: "US", countryName: "United States", region: "Americas",
    address: "755 Secaucus Road\nSecaucus, NJ 07094", timezone: "EST (UTC-5)", owner: "Global Markets Technology", favorite: false, evidenceBadge: "evidence-verified", image: "/assets/sites/aws-eu-west-1.webp",
    score: 91, band: "excellent", label: "Excellent", assessedAt: "3 days ago", singleSiteApproved: false, technicalGapRetained: false,
    carriers: [carrier("circuit-exc1-eqx", "Equinix Fabric", "Equinix", "primary", "10G Cross-Connect", "EXC1-EQX-01", "verified"), carrier("circuit-exc1-verizon", "Verizon", "Verizon", "secondary", "10G Wave", "EXC1-VZ-02", "verified")],
    dependencyCount: 12, cardOpenRiskCount: 0, risks: [], evidenceConfidence: "high", evidenceConfidencePercent: 92, nextReviewAt: "in 24 days", tags: ["exchange", "colocation", "low-latency"],
  },
  {
    id: "site-tf3-tokyo", engagementId: "eng-2026-022", enterpriseClientId: "ent-northwind", code: "TF3", name: "Tokyo", archetype: "Financial Trading Floor", primaryLocationType: "Regulated Trading Facility",
    criticalityLabel: "Tier II Critical", city: "Tokyo", stateProvince: "—", postalCode: "100-0005", countryCode: "JP", countryName: "Japan", region: "APAC",
    address: "Marunouchi\nChiyoda, Tokyo 100-0005", timezone: "JST (UTC+9)", owner: "APAC Markets Technology", favorite: false, evidenceBadge: null, image: "/assets/sites/hub-amsterdam.webp",
    score: 66, band: "at-risk", label: "At Risk", assessedAt: "8 days ago", singleSiteApproved: false, technicalGapRetained: true,
    carriers: [carrier("circuit-tf3-ntt", "NTT", "NTT", "primary", "10G Wave", "TF3-NTT-01", "unknown")],
    dependencyCount: 10, cardOpenRiskCount: 1, risks: [{ id: "RSK-420", title: "Single exchange access path", severity: "high", status: "open", control: "NET-DIV-01" }],
    evidenceConfidence: "low", evidenceConfidencePercent: 62, nextReviewAt: "in 12 days", tags: ["trading", "regulated", "single-carrier"],
  },

  // --- ENG-2026-031 · Data Center Consolidation Assurance (Meridian, periodic-review) ---
  {
    id: "site-core1-dallas", engagementId: "eng-2026-031", enterpriseClientId: "ent-meridian", code: "CORE1", name: "Dallas", archetype: "Primary Data Center", primaryLocationType: "Tier I / Mission Critical",
    criticalityLabel: "Tier I Mission Critical", city: "Dallas", stateProvince: "TX", postalCode: "75207", countryCode: "US", countryName: "United States", region: "Americas",
    address: "Stemmons Freeway\nDallas, TX 75207", timezone: "CST (UTC-6)", owner: "Clinical Infrastructure", favorite: false, evidenceBadge: "evidence-verified", image: "/assets/sites/dc1-london.webp",
    score: 94, band: "excellent", label: "Excellent", assessedAt: "3 days ago", singleSiteApproved: false, technicalGapRetained: false,
    carriers: [carrier("circuit-core1-att", "AT&T", "AT&T", "primary", "10G DIA", "CORE1-ATT-01", "verified"), carrier("circuit-core1-lumen", "Lumen", "Lumen", "secondary", "10G DIA", "CORE1-LUM-02", "verified")],
    dependencyCount: 17, cardOpenRiskCount: 0, risks: [], evidenceConfidence: "high", evidenceConfidencePercent: 91, nextReviewAt: "in 26 days", tags: ["primary", "data-center", "clinical"],
  },
  {
    id: "site-core2-atlanta", engagementId: "eng-2026-031", enterpriseClientId: "ent-meridian", code: "CORE2", name: "Atlanta", archetype: "Secondary Data Center", primaryLocationType: "Tier II / Critical",
    criticalityLabel: "Tier II Critical", city: "Atlanta", stateProvince: "GA", postalCode: "30328", countryCode: "US", countryName: "United States", region: "Americas",
    address: "Northside Parkway\nAtlanta, GA 30328", timezone: "EST (UTC-5)", owner: "Clinical Infrastructure", favorite: false, evidenceBadge: "provider-claimed-diverse", image: "/assets/sites/dc2-frankfurt.webp",
    score: 83, band: "good", label: "Good", assessedAt: "5 days ago", singleSiteApproved: false, technicalGapRetained: false,
    carriers: [carrier("circuit-core2-comcast", "Comcast Business", "Comcast", "primary", "10G EPL", "CORE2-CMB-01", "provider-claimed"), carrier("circuit-core2-cox", "Cox", "Cox", "secondary", "10G DIA", "CORE2-COX-02", "provider-claimed")],
    dependencyCount: 12, cardOpenRiskCount: 0, risks: [], evidenceConfidence: "medium", evidenceConfidencePercent: 80, nextReviewAt: "in 29 days", tags: ["secondary", "data-center", "clinical"],
  },
  {
    id: "site-clin1-houston", engagementId: "eng-2026-031", enterpriseClientId: "ent-meridian", code: "CLIN1", name: "Houston Clinical Hub", archetype: "Clinical Facility", primaryLocationType: "Clinical Hub",
    criticalityLabel: "Tier II Critical", city: "Houston", stateProvince: "TX", postalCode: "77030", countryCode: "US", countryName: "United States", region: "Americas",
    address: "Fannin Street\nHouston, TX 77030", timezone: "CST (UTC-6)", owner: "Clinical Operations", favorite: false, evidenceBadge: null, image: "/assets/sites/br-1001-paris.webp",
    score: 64, band: "at-risk", label: "At Risk", assessedAt: "10 days ago", singleSiteApproved: false, technicalGapRetained: true,
    carriers: [carrier("circuit-clin1-att", "AT&T", "AT&T", "primary", "1G DIA", "CLIN1-ATT-01", "unknown")],
    dependencyCount: 6, cardOpenRiskCount: 2, risks: [{ id: "RSK-430", title: "Clinical system single path", severity: "high", status: "open", control: "NET-DIV-01" }, { id: "RSK-433", title: "Generator load test overdue", severity: "medium", status: "open", control: "PWR-BCP-03" }],
    evidenceConfidence: "low", evidenceConfidencePercent: 60, nextReviewAt: "in 9 days", tags: ["clinical", "single-carrier", "at-risk"],
  },

  // --- ENG-2026-040 · Edge Network Baseline (Atlas, published) ---
  {
    id: "site-edge-a-rotterdam", engagementId: "eng-2026-040", enterpriseClientId: "ent-atlas", code: "EDGE-A", name: "Rotterdam DC", archetype: "Edge Site", primaryLocationType: "Distribution-Center Edge",
    criticalityLabel: "Tier III Business Critical", city: "Rotterdam", stateProvince: "South Holland", postalCode: "3011", countryCode: "NL", countryName: "Netherlands", region: "EMEA",
    address: "Waalhaven\nRotterdam 3011", timezone: "CET (UTC+1)", owner: "Edge Operations", favorite: false, evidenceBadge: "evidence-verified", image: "/assets/sites/edge-25-madrid.webp",
    score: 81, band: "good", label: "Good", assessedAt: "6 days ago", singleSiteApproved: false, technicalGapRetained: false,
    carriers: [carrier("circuit-edgea-kpn", "KPN", "KPN", "primary", "1G DIA", "EDGEA-KPN-01", "verified"), carrier("circuit-edgea-lte", "Vodafone", "Vodafone", "secondary", "LTE Failover", "EDGEA-VF-02", "verified")],
    dependencyCount: 5, cardOpenRiskCount: 0, risks: [], evidenceConfidence: "high", evidenceConfidencePercent: 87, nextReviewAt: "in 44 days", tags: ["edge", "distribution", "wireless-failover"],
  },
  {
    id: "site-edge-b-hamburg", engagementId: "eng-2026-040", enterpriseClientId: "ent-atlas", code: "EDGE-B", name: "Hamburg DC", archetype: "Edge Site", primaryLocationType: "Distribution-Center Edge",
    criticalityLabel: "Tier III Business Critical", city: "Hamburg", stateProvince: "Hamburg", postalCode: "20457", countryCode: "DE", countryName: "Germany", region: "EMEA",
    address: "Am Sandtorkai\nHamburg 20457", timezone: "CET (UTC+1)", owner: "Edge Operations", favorite: false, evidenceBadge: "single-site-acceptable", image: "/assets/sites/hub-amsterdam.webp",
    score: 88, band: "excellent", label: "Excellent", assessedAt: "4 days ago", singleSiteApproved: true, technicalGapRetained: false,
    carriers: [carrier("circuit-edgeb-telekom", "Deutsche Telekom", "Telekom", "primary", "1G DIA", "EDGEB-DT-01", "verified")],
    dependencyCount: 4, cardOpenRiskCount: 0, risks: [], evidenceConfidence: "high", evidenceConfidencePercent: 86, nextReviewAt: "in 41 days", tags: ["edge", "distribution", "single-site-approved"],
  },
  {
    id: "site-edge-c-lyon", engagementId: "eng-2026-040", enterpriseClientId: "ent-atlas", code: "EDGE-C", name: "Lyon DC", archetype: "Edge Site", primaryLocationType: "Distribution-Center Edge",
    criticalityLabel: "Tier III Business Critical", city: "Lyon", stateProvince: "Auvergne-Rhône-Alpes", postalCode: "69007", countryCode: "FR", countryName: "France", region: "EMEA",
    address: "Rue de Gerland\nLyon 69007", timezone: "CET (UTC+1)", owner: "Edge Operations", favorite: false, evidenceBadge: "provider-claimed-diverse", image: "/assets/sites/ro-singapore.webp",
    score: 79, band: "good", label: "Good", assessedAt: "7 days ago", singleSiteApproved: false, technicalGapRetained: false,
    carriers: [carrier("circuit-edgec-orange", "Orange Business", "Orange", "primary", "1G DIA", "EDGEC-OBS-01", "provider-claimed"), carrier("circuit-edgec-lte", "Bouygues", "Bouygues", "secondary", "LTE Failover", "EDGEC-BYG-02", "provider-claimed")],
    dependencyCount: 5, cardOpenRiskCount: 1, risks: [{ id: "RSK-440", title: "Wireless-failover test evidence outstanding", severity: "medium", status: "open", control: "OPS-BCP-05" }],
    evidenceConfidence: "medium", evidenceConfidencePercent: 78, nextReviewAt: "in 38 days", tags: ["edge", "distribution", "wireless-failover"],
  },
  {
    id: "site-edge-d-milan", engagementId: "eng-2026-040", enterpriseClientId: "ent-atlas", code: "EDGE-D", name: "Milan DC", archetype: "Edge Site", primaryLocationType: "Distribution-Center Edge",
    criticalityLabel: "Tier III Business Critical", city: "Milan", stateProvince: "Lombardy", postalCode: "20138", countryCode: "IT", countryName: "Italy", region: "EMEA",
    address: "Via Mecenate\nMilan 20138", timezone: "CET (UTC+1)", owner: "Edge Operations", favorite: false, evidenceBadge: null, image: "/assets/sites/aws-eu-west-1.webp",
    score: 63, band: "at-risk", label: "At Risk", assessedAt: "11 days ago", singleSiteApproved: false, technicalGapRetained: true,
    carriers: [carrier("circuit-edged-tim", "TIM", "TIM", "primary", "1G DIA", "EDGED-TIM-01", "unknown")],
    dependencyCount: 4, cardOpenRiskCount: 1, risks: [{ id: "RSK-450", title: "No wireless failover configured", severity: "high", status: "open", control: "NET-DIV-04" }],
    evidenceConfidence: "low", evidenceConfidencePercent: 57, nextReviewAt: "in 8 days", tags: ["edge", "distribution", "single-carrier"],
  },
];

// Representative workloads per demo archetype (some demo archetypes are bespoke
// and not in ARCHETYPE_WORKLOAD_PRESETS, so map them here) — so every demo site
// opens with a realistic workload set.
const DEMO_WORKLOADS: Record<string, string[]> = {
  "Recovery Data Center": ["backup-dr", "dc-compute", "storage-replication", "cloud-connectivity"],
  "Standby Site": ["backup-dr", "user-internet", "remote-access"],
  "Regional Office": ["core-business-app", "voice", "video-uc", "user-internet"],
  "Financial Trading Floor": ["trading", "voice", "core-banking", "user-internet"],
  "Exchange Access Point": ["trading", "cloud-connectivity", "network-management"],
  "Primary Data Center": ["dc-compute", "backup-dr", "cloud-connectivity", "core-business-app", "ai-ml"],
  "Secondary Data Center": ["dc-compute", "backup-dr", "storage-replication", "cloud-connectivity"],
  "Clinical Facility": ["core-business-app", "physical-security", "voice", "bms", "user-internet"],
  "Edge Site": ["wireless-failover", "iot-telemetry", "pos-store", "user-internet"],
};

/** Built demo-portfolio site records + their assessment artifacts, exported for
 *  the fresh-install seed and the v6/v7 migrations (injected by id if absent). */
export const DEMO_SITES: SiteRecord[] = demoSiteSpecs.map((s) =>
  buildSite({ ...s, workloads: s.workloads ?? DEMO_WORKLOADS[s.archetype] ?? [] }),
);
export const DEMO_SITE_ARTIFACTS = assessmentArtifacts(DEMO_SITES);

// Contract repository seed — MSAs and related instruments per enterprise client.
export const DEMO_CONTRACTS: Contract[] = [
  { id: "ct-msa-enterprise-co", enterpriseClientId: ENTERPRISE_ID, engagementId: null, type: "msa", title: "Master Service Agreement", reference: "MSA-2025-0042", status: "active", counterparty: "Enterprise Co. PLC", effectiveDate: "2025-06-01", expirationDate: "2027-05-31", documentName: "MSA_EnterpriseCo_2025.pdf", notes: "Governs all assurance engagements.", createdAt: NOW, updatedAt: NOW },
  { id: "ct-sow-enterprise-co-2026", enterpriseClientId: ENTERPRISE_ID, engagementId: ENGAGEMENT_ID, type: "sow", title: "SOW — Global Infrastructure Assurance 2026", reference: "SOW-2026-001", status: "active", counterparty: "Enterprise Co. PLC", effectiveDate: "2026-01-05", expirationDate: "2026-09-30", documentName: "SOW_2026-001.pdf", notes: "Scope: 128 sites / 23 countries.", createdAt: NOW, updatedAt: NOW },
  { id: "ct-dpa-enterprise-co", enterpriseClientId: ENTERPRISE_ID, engagementId: null, type: "dpa", title: "Data Processing Agreement", reference: "DPA-2025-0042", status: "active", counterparty: "Enterprise Co. PLC", effectiveDate: "2025-06-01", expirationDate: "2027-05-31", documentName: "DPA_EnterpriseCo.pdf", notes: "", createdAt: NOW, updatedAt: NOW },
  { id: "ct-msa-northwind", enterpriseClientId: "ent-northwind", engagementId: null, type: "msa", title: "Master Service Agreement", reference: "MSA-2026-0110", status: "active", counterparty: "Northwind Trading Group Ltd", effectiveDate: "2026-02-15", expirationDate: "2028-02-14", documentName: "MSA_Northwind.pdf", notes: "", createdAt: NOW, updatedAt: NOW },
  { id: "ct-msa-meridian", enterpriseClientId: "ent-meridian", engagementId: null, type: "msa", title: "Master Service Agreement", reference: "MSA-2025-0098", status: "active", counterparty: "Meridian Health Systems Inc", effectiveDate: "2025-09-01", expirationDate: "2027-08-31", documentName: "MSA_Meridian.pdf", notes: "", createdAt: NOW, updatedAt: NOW },
  { id: "ct-msa-atlas", enterpriseClientId: "ent-atlas", engagementId: null, type: "msa", title: "Master Service Agreement", reference: "MSA-2024-0071", status: "expiring", counterparty: "Atlas Logistics International GmbH", effectiveDate: "2024-08-01", expirationDate: "2026-07-31", documentName: "MSA_Atlas.pdf", notes: "Renewal in progress.", createdAt: NOW, updatedAt: NOW },
  { id: "ct-nda-atlas", enterpriseClientId: "ent-atlas", engagementId: null, type: "nda", title: "Mutual NDA", reference: "NDA-2024-0071", status: "active", counterparty: "Atlas Logistics International GmbH", effectiveDate: "2024-07-15", expirationDate: "2029-07-14", documentName: "NDA_Atlas.pdf", notes: "", createdAt: NOW, updatedAt: NOW },
];

export function buildSeedDataset(): RegistryDataset {
  const canonicalSites = siteSpecs.map(buildSite);
  // Shallow-copy the pre-built demo sites so a caller mutating the returned
  // dataset never corrupts the shared DEMO_SITES module state.
  const sites = [...canonicalSites, ...DEMO_SITES.map((s) => ({ ...s }))];
  const { controlResults, snapshots } = assessmentArtifacts(sites);
  return {
    organizations: [
      { id: ORG_ID, name: "IDA Consulting", legalName: "IDA Consulting LLP", status: "active", primaryContactId: "user-engagement-lead", createdAt: NOW, updatedAt: NOW },
    ],
    enterpriseClients: [
      // The seeded enterprise reproduces the approved locked wordmark exactly, so
      // the default render is pixel-identical to the visual baseline (see
      // docs/UI_LOCK.md). White-label branding is purely additive on top of this.
      { id: ENTERPRISE_ID, consultancyOrganizationId: ORG_ID, name: "Enterprise Co.", legalName: "Enterprise Co. PLC", industry: "Financial Services", headquartersCountry: "UK", status: "active", externalReference: "CRM-4821", branding: { brandName: "ResiliLink", productLabel: "Site Resiliency Registry", logoUrl: null, logoAlt: "" }, createdAt: NOW, updatedAt: NOW },
      ...DEMO_ENTERPRISES,
    ],
    engagements: [
      { id: ENGAGEMENT_ID, consultancyOrganizationId: ORG_ID, enterpriseClientId: ENTERPRISE_ID, name: "Global Infrastructure Assurance 2026", code: "ENG-2026-001", description: "Point-in-time dependency assurance across the global estate.", status: "data-collection", scopeStatement: "128 sites across 23 countries; carrier, circuit, facility, cloud, and service dependencies.", startDate: "2026-01-05", targetCompletionDate: "2026-09-30", reviewCadence: "quarterly", leadConsultantUserId: "user-engagement-lead", createdAt: NOW, updatedAt: NOW },
      ...DEMO_ENGAGEMENTS,
    ],
    engagementMembers: [
      { id: "mem-1", engagementId: ENGAGEMENT_ID, userId: "user-engagement-lead", role: "engagement-lead", status: "active", joinedAt: NOW },
      { id: "mem-2", engagementId: ENGAGEMENT_ID, userId: "user-consultant-1", role: "consultant", status: "active", joinedAt: NOW },
      { id: "mem-3", engagementId: ENGAGEMENT_ID, userId: "user-reviewer-1", role: "evidence-reviewer", status: "active", joinedAt: NOW },
    ],
    enterpriseContacts: [
      { id: "con-1", enterpriseClientId: ENTERPRISE_ID, engagementId: ENGAGEMENT_ID, name: "Dana Fox", title: "VP Resilience", department: "Technology Risk", email: "dana.fox@enterprise.example", phone: "", responsibility: "Programme sponsor", approvalAuthority: true, role: "enterprise-sponsor", status: "active" },
      { id: "con-2", enterpriseClientId: ENTERPRISE_ID, engagementId: ENGAGEMENT_ID, name: "Owen Ridley", title: "Head of Network", department: "Infrastructure", email: "owen.ridley@enterprise.example", phone: "", responsibility: "Network data owner", approvalAuthority: true, role: "enterprise-approver", status: "active" },
      { id: "con-3", enterpriseClientId: ENTERPRISE_ID, engagementId: ENGAGEMENT_ID, name: "Lena Ortiz", title: "Infrastructure Analyst", department: "Infrastructure", email: "lena.ortiz@enterprise.example", phone: "", responsibility: "Data contributor", approvalAuthority: false, role: "enterprise-contributor", status: "active" },
    ],
    sites,
    criticalServices: [],
    providers: providersFromSites(canonicalSites),
    circuits: [],
    components: [],
    cloudResources: [],
    dependencies: [],
    evidence: [],
    dataGaps: [],
    tasks: [],
    controlResults,
    assuranceSnapshots: snapshots,
    importBatches: [],
    proposedClaims: [],
    fieldProvenance: [],
    authorizations: [
      { id: "auth-uk-2026", engagementId: ENGAGEMENT_ID, enterpriseClientId: ENTERPRISE_ID, status: "active", scopeSummary: "BT circuit inventory and route evidence for UK sites", effectiveDate: "2026-01-01", expirationDate: "2026-12-31", carrierIds: ["provider-bt-global-services"], siteIds: ["site-dc1-london"] },
      { id: "auth-emea-gtt-2026", engagementId: ENGAGEMENT_ID, enterpriseClientId: ENTERPRISE_ID, status: "pending-enterprise-signature", scopeSummary: "GTT circuit inventory for EMEA hubs", effectiveDate: null, expirationDate: null, carrierIds: ["provider-gtt"], siteIds: ["site-hub-amsterdam", "site-dc2-frankfurt"] },
    ],
    acknowledgments: [
      { id: "ack-uk-bt", authorizationId: "auth-uk-2026", carrierId: "provider-bt-global-services", status: "accepted", receivedAt: "2026-01-08", notes: "" },
      { id: "ack-emea-gtt", authorizationId: "auth-emea-gtt-2026", carrierId: "provider-gtt", status: "not-submitted", receivedAt: null, notes: "" },
    ],
    contracts: [...DEMO_CONTRACTS],
    customerDecisions: [],
    audit: [
      { id: "audit-seed", engagementId: ENGAGEMENT_ID, actorUserId: "user-engagement-lead", actorRole: "engagement-lead", entityType: "engagement", entityId: ENGAGEMENT_ID, action: "engagement-created", timestamp: NOW, beforeSummary: null, afterSummary: "Engagement seeded", source: "seed" },
    ],
  };
}

export const CANONICAL_IDS = { ORG_ID, ENTERPRISE_ID, ENGAGEMENT_ID, TENANT_ID };
