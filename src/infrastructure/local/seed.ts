import type {
  ActivityRecord,
  CardCarrierConnection,
  CardCriticalService,
  ComplianceMapping,
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
}

function buildSite(spec: SiteSpec): SiteRecord {
  const verified = spec.carriers.filter((c) => c.routeVerification === "verified").length;
  const providerClaimed = spec.carriers.filter((c) => c.routeVerification === "provider-claimed").length;
  const total = spec.carriers.length;
  const documented = verified + providerClaimed;
  const openRisks = spec.risks.filter((r) => r.status === "open").length;
  return {
    id: spec.id,
    tenantId: TENANT_ID,
    enterpriseClientId: ENTERPRISE_ID,
    engagementId: ENGAGEMENT_ID,
    code: spec.code,
    name: spec.name,
    archetypeId: spec.archetype,
    primaryLocationType: spec.primaryLocationType,
    secondaryLocationTypes: [],
    businessRoles: [],
    networkRoles: [],
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
    assessmentStatus: "provisional",
    completenessPercent: Math.round(60 + (documented / Math.max(total, 1)) * 40),
    lastVerifiedAt: spec.assessedAt,
    nextReviewAt: spec.nextReviewAt,
    consultantOwnerId: "user-consultant-1",
    enterpriseOwnerContactId: "con-1",
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
      provisional: true,
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
    publicationState: "provisional",
    tags: spec.tags,
  };
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

export function buildSeedDataset(): RegistryDataset {
  const sites = siteSpecs.map(buildSite);
  return {
    organizations: [
      { id: ORG_ID, name: "IDA Consulting", legalName: "IDA Consulting LLP", status: "active", primaryContactId: "user-engagement-lead", createdAt: NOW, updatedAt: NOW },
    ],
    enterpriseClients: [
      { id: ENTERPRISE_ID, consultancyOrganizationId: ORG_ID, name: "Enterprise Co.", legalName: "Enterprise Co. PLC", industry: "Financial Services", headquartersCountry: "UK", status: "active", externalReference: "CRM-4821", createdAt: NOW, updatedAt: NOW },
    ],
    engagements: [
      { id: ENGAGEMENT_ID, consultancyOrganizationId: ORG_ID, enterpriseClientId: ENTERPRISE_ID, name: "Global Infrastructure Assurance 2026", code: "ENG-2026-001", description: "Point-in-time dependency assurance across the global estate.", status: "data-collection", scopeStatement: "128 sites across 23 countries; carrier, circuit, facility, cloud, and service dependencies.", startDate: "2026-01-05", targetCompletionDate: "2026-09-30", reviewCadence: "quarterly", leadConsultantUserId: "user-engagement-lead", createdAt: NOW, updatedAt: NOW },
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
    providers: providersFromSites(sites),
    circuits: [],
    components: [],
    cloudResources: [],
    dependencies: [],
    evidence: [],
    dataGaps: [],
    tasks: [],
    authorizations: [
      { id: "auth-uk-2026", engagementId: ENGAGEMENT_ID, enterpriseClientId: ENTERPRISE_ID, status: "active", scopeSummary: "BT circuit inventory and route evidence for UK sites", effectiveDate: "2026-01-01", expirationDate: "2026-12-31", carrierIds: ["provider-bt-global-services"], siteIds: ["site-dc1-london"] },
      { id: "auth-emea-gtt-2026", engagementId: ENGAGEMENT_ID, enterpriseClientId: ENTERPRISE_ID, status: "pending-enterprise-signature", scopeSummary: "GTT circuit inventory for EMEA hubs", effectiveDate: null, expirationDate: null, carrierIds: ["provider-gtt"], siteIds: ["site-hub-amsterdam", "site-dc2-frankfurt"] },
    ],
    acknowledgments: [
      { id: "ack-uk-bt", authorizationId: "auth-uk-2026", carrierId: "provider-bt-global-services", status: "accepted", receivedAt: "2026-01-08", notes: "" },
      { id: "ack-emea-gtt", authorizationId: "auth-emea-gtt-2026", carrierId: "provider-gtt", status: "not-submitted", receivedAt: null, notes: "" },
    ],
    audit: [
      { id: "audit-seed", engagementId: ENGAGEMENT_ID, actorUserId: "user-engagement-lead", actorRole: "engagement-lead", entityType: "engagement", entityId: ENGAGEMENT_ID, action: "engagement-created", timestamp: NOW, beforeSummary: null, afterSummary: "Engagement seeded", source: "seed" },
    ],
  };
}

export const CANONICAL_IDS = { ORG_ID, ENTERPRISE_ID, ENGAGEMENT_ID, TENANT_ID };
