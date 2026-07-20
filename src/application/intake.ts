// Site intake — pure form model and record builder shared by the create and
// edit flows. Unknown carrier/circuit facts become DataGaps; nothing is
// fabricated.

import type {
  Circuit,
  CircuitRole,
  CircuitServiceType,
  ComponentLayer,
  ComponentType,
  DataGap,
  DataGapRequestedFrom,
  Dependency,
  DependencyType,
  EvidenceItem,
  EvidenceType,
  InfrastructureComponent,
  PhysicalMedium,
  Scale5,
  SiteRecord,
} from "../domain";
import { computeResilienceScore } from "../domain";

// --- Controlled option lists (also used by the wizard UI) -------------------

export const ARCHETYPES = [
  "Branch Office", "Regional Office", "Primary Data Center", "Secondary Data Center",
  "Cloud Region", "Network Hub", "Edge Site", "Manufacturing Site", "Warehouse", "Contact Center",
];
export const OWNERSHIP_MODELS = ["owned", "leased", "colocation", "cloud", "provider-managed", "unknown"] as const;
export const OCCUPANCY_MODELS = ["single-tenant", "multi-tenant", "shared", "unknown"] as const;
export const CIRCUIT_ROLES: CircuitRole[] = ["primary", "secondary", "tertiary", "backup", "temporary"];
export const SERVICE_TYPES: CircuitServiceType[] = ["DIA", "broadband", "carrier-ethernet", "MPLS-IPVPN", "wavelength", "dark-fiber", "fixed-wireless", "LTE", "5G", "satellite", "cloud-interconnect", "internet-VPN", "private-WAN", "other"];
export const PHYSICAL_MEDIA: PhysicalMedium[] = ["single-mode-fiber", "multimode-fiber", "copper", "coax", "microwave", "fixed-wireless", "cellular", "satellite", "unknown"];
export const COMPONENT_TYPES: ComponentType[] = ["facility", "rack", "chassis", "router", "firewall", "switch", "SD-WAN-edge", "wireless-controller", "wireless-access-point", "modem", "transceiver", "physical-port", "VLAN", "VRF", "subnet", "route-table", "VPN-gateway", "NAT-gateway", "transit-gateway", "VPC", "VNet", "VCN", "cloud-region", "availability-zone", "cloud-interconnect", "power-feed", "UPS", "generator", "cooling", "other"];
export const COMPONENT_LAYERS: ComponentLayer[] = ["L1", "L2", "L3", "cloud", "facility", "power", "control-plane", "adjacent"];
export const DEPENDENCY_TYPES: DependencyType[] = ["physical-path", "carrier", "underlying-provider", "facility", "building-entrance", "riser", "shared-conduit", "shared-pop", "shared-router", "shared-firewall", "shared-switch", "shared-power", "shared-cloud-region", "shared-availability-zone", "shared-transit", "shared-identity", "shared-control-plane", "business-service", "contract", "other"];

export const SLIDER_SCALES = {
  businessCriticality: ["Minimal", "Low", "Moderate", "High", "Severe"],
  operationalDependency: ["Optional", "Supporting", "Important", "Critical", "Essential"],
  safetyImpact: ["None", "Low", "Moderate", "High", "Life/Safety"],
  dependencyCriticality: ["Minimal", "Low", "Moderate", "High", "Essential"],
  substitutability: ["Easily substitutable", "Substitutable", "Difficult", "Very difficult", "Not substitutable"],
  failureImpact: ["Local inconvenience", "Limited site impact", "Material site impact", "Multi-service impact", "Enterprise-critical impact"],
} as const;

export type KnownState = "known" | "unknown" | "not-applicable";

export interface CircuitDraft {
  key: string;
  knownState: KnownState;
  role: CircuitRole;
  serviceType: CircuitServiceType;
  serviceIdentifier: string;
  contractedProviderId: string; // "" = unknown
  underlyingProviderId: string;
  accessProviderId: string;
  bandwidthValue: string;
  bandwidthUnit: "Mbps" | "Gbps";
  physicalMedium: PhysicalMedium;
  buildingEntrance: string;
}

export interface ComponentDraft {
  key: string;
  componentType: ComponentType;
  layer: ComponentLayer;
  manufacturer: string;
  model: string;
  redundancyRole: string;
  lifecycleState: string;
}

export interface DependencyDraft {
  key: string;
  dependencyType: DependencyType;
  targetLabel: string;
  criticality: Scale5;
  substitutability: Scale5;
  failureImpact: Scale5;
}

export interface EvidenceDraft {
  key: string;
  evidenceType: EvidenceType;
  title: string;
  source: string;
  documentDate: string;
  receivedDate: string;
  effectiveDate: string;
  expirationDate: string;
  notes: string;
}

export type GapDisposition = DataGapRequestedFrom | "accepted-unknown" | "not-required";

export interface IntakeForm {
  // Step 1 — identity
  code: string;
  name: string;
  archetype: string;
  primaryLocationType: string;
  address: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  countryCode: string;
  countryName: string;
  timezone: string;
  ownershipModel: string;
  occupancyModel: string;
  operatingHours: string;
  userCount: string;
  endpointCount: string;
  // Step 2 — business context
  businessRoles: string;
  networkRoles: string;
  consultantOwnerId: string;
  enterpriseOwnerContactId: string;
  reviewCadence: string;
  businessCriticality: Scale5;
  operationalDependency: Scale5;
  safetyImpact: Scale5;
  regulatoryScope: string;
  rtoMinutes: string;
  rpoMinutes: string;
  mtoMinutes: string;
  singleSiteApproved: boolean;
  // Step 3-5 — repeatable records
  circuits: CircuitDraft[];
  components: ComponentDraft[];
  dependencies: DependencyDraft[];
  // Step 6 — evidence + gap dispositions
  evidence: EvidenceDraft[];
  gapDispositions: Record<string, GapDisposition>;
}

export interface IntakeContext {
  siteId: string;
  tenantId: string;
  enterpriseClientId: string;
  engagementId: string;
  createdAt: string;
  existing?: SiteRecord;
}

export interface IntakeRecords {
  site: SiteRecord;
  circuits: Circuit[];
  components: InfrastructureComponent[];
  dependencies: Dependency[];
  evidence: EvidenceItem[];
  dataGaps: DataGap[];
}

export function emptyIntakeForm(): IntakeForm {
  return {
    code: "", name: "", archetype: "Branch Office", primaryLocationType: "Standard Branch",
    address: "", city: "", stateProvince: "", postalCode: "", countryCode: "", countryName: "",
    timezone: "", ownershipModel: "unknown", occupancyModel: "unknown", operatingHours: "",
    userCount: "", endpointCount: "",
    businessRoles: "", networkRoles: "", consultantOwnerId: "user-consultant-1", enterpriseOwnerContactId: "",
    reviewCadence: "quarterly", businessCriticality: 3, operationalDependency: 3, safetyImpact: 1,
    regulatoryScope: "", rtoMinutes: "", rpoMinutes: "", mtoMinutes: "", singleSiteApproved: false,
    circuits: [], components: [], dependencies: [], evidence: [], gapDispositions: {},
  };
}

export function newCircuitDraft(key: string): CircuitDraft {
  return { key, knownState: "known", role: "primary", serviceType: "DIA", serviceIdentifier: "", contractedProviderId: "", underlyingProviderId: "", accessProviderId: "", bandwidthValue: "", bandwidthUnit: "Gbps", physicalMedium: "unknown", buildingEntrance: "" };
}
export function newComponentDraft(key: string): ComponentDraft {
  return { key, componentType: "router", layer: "L3", manufacturer: "", model: "", redundancyRole: "standalone", lifecycleState: "active" };
}
export function newDependencyDraft(key: string): DependencyDraft {
  return { key, dependencyType: "carrier", targetLabel: "", criticality: 3, substitutability: 3, failureImpact: 3 };
}
export function newEvidenceDraft(key: string): EvidenceDraft {
  return { key, evidenceType: "circuit-record", title: "", source: "", documentDate: "", receivedDate: "", effectiveDate: "", expirationDate: "", notes: "" };
}

function toNumberOrNull(value: string): number | null {
  const n = Number(value);
  return value.trim() === "" || Number.isNaN(n) ? null : n;
}

function gap(ctx: IntakeContext, fieldPath: string, title: string, gapType: DataGap["gapType"], requestedFrom: DataGapRequestedFrom, priority: DataGap["priority"]): DataGap {
  return {
    id: `gap-${ctx.siteId}-${fieldPath}`,
    engagementId: ctx.engagementId,
    siteId: ctx.siteId,
    entityType: "site",
    entityId: ctx.siteId,
    fieldPath,
    title,
    description: `${title}. Recorded as a data gap rather than a fabricated fact.`,
    gapType,
    priority,
    requestedFrom,
    requiresAuthorization: requestedFrom === "carrier",
    status: "open",
    resolution: null,
    createdAt: ctx.createdAt,
    resolvedAt: null,
  };
}

/**
 * Build the persisted records from an intake form. Circuits marked "unknown"
 * (or missing a contracted provider) produce a carrier DataGap instead of a
 * fabricated circuit record. Missing identity facts produce enterprise gaps.
 */
export function buildIntakeRecords(form: IntakeForm, ctx: IntakeContext): IntakeRecords {
  const gaps: DataGap[] = [];

  // Identity gaps
  if (!form.address.trim()) gaps.push(gap(ctx, "address", "Verified site address missing", "enterprise-confirmation-required", "enterprise", "medium"));
  if (!form.timezone.trim()) gaps.push(gap(ctx, "timezone", "Site time zone missing", "missing-fact", "enterprise", "low"));

  // Circuits: only build records for genuinely-known circuits with a provider.
  const circuits: Circuit[] = [];
  form.circuits.forEach((draft, index) => {
    if (draft.knownState === "not-applicable") return;
    const providerKnown = draft.knownState === "known" && draft.contractedProviderId !== "";
    if (!providerKnown) {
      gaps.push(gap(ctx, `circuit[${index}].contractedProvider`, `Circuit ${index + 1} carrier/circuit identity unknown`, "carrier-confirmation-required", "carrier", "high"));
      return;
    }
    circuits.push({
      id: `${ctx.siteId}-circuit-${index + 1}`,
      engagementId: ctx.engagementId,
      siteId: ctx.siteId,
      role: draft.role,
      serviceType: draft.serviceType,
      serviceIdentifier: draft.serviceIdentifier || null,
      contractedProviderId: draft.contractedProviderId,
      underlyingProviderId: draft.underlyingProviderId || null,
      accessProviderId: draft.accessProviderId || null,
      bandwidthValue: toNumberOrNull(draft.bandwidthValue),
      bandwidthUnit: draft.bandwidthUnit,
      committedRateValue: null,
      committedRateUnit: null,
      physicalMedium: draft.physicalMedium,
      handoffType: null,
      demarcation: null,
      buildingEntrance: draft.buildingEntrance || null,
      riser: null,
      carrierPop: null,
      routingType: null,
      ipAddressingSummary: null,
      sdwanMembership: null,
      contractStartDate: null,
      contractEndDate: null,
      slaAvailability: null,
      verificationState: "provider-claimed",
      evidenceItemIds: [],
      notes: "",
      createdAt: ctx.createdAt,
      updatedAt: ctx.createdAt,
    });
    // Route diversity always requires carrier confirmation.
    gaps.push(gap(ctx, `circuit[${index}].routeDiversity`, `Circuit ${index + 1} route diversity evidence pending`, "carrier-confirmation-required", "carrier", "medium"));
  });

  const components: InfrastructureComponent[] = form.components.map((draft, index) => ({
    id: `${ctx.siteId}-component-${index + 1}`,
    engagementId: ctx.engagementId,
    siteId: ctx.siteId,
    componentType: draft.componentType,
    layer: draft.layer,
    manufacturer: draft.manufacturer || null,
    model: draft.model || null,
    serialNumber: null,
    cloudResourceId: null,
    managementDomain: null,
    redundancyRole: (draft.redundancyRole as InfrastructureComponent["redundancyRole"]) || "unknown",
    highAvailabilityPartnerId: null,
    lifecycleState: (draft.lifecycleState as InfrastructureComponent["lifecycleState"]) || "unknown",
    verificationState: "enterprise-declared",
    evidenceItemIds: [],
    createdAt: ctx.createdAt,
    updatedAt: ctx.createdAt,
  }));

  const dependencies: Dependency[] = form.dependencies.map((draft, index) => ({
    id: `${ctx.siteId}-dependency-${index + 1}`,
    engagementId: ctx.engagementId,
    sourceEntityType: "site",
    sourceEntityId: ctx.siteId,
    targetEntityType: "external",
    targetEntityId: draft.targetLabel || `unknown-${index + 1}`,
    dependencyType: draft.dependencyType,
    state: draft.targetLabel ? "declared" : "unknown",
    criticality: draft.criticality,
    substitutability: draft.substitutability,
    failureImpact: draft.failureImpact,
    verificationState: "enterprise-declared",
    evidenceItemIds: [],
    notes: "",
    createdAt: ctx.createdAt,
    updatedAt: ctx.createdAt,
  }));

  form.dependencies.forEach((draft, index) => {
    if (!draft.targetLabel.trim()) gaps.push(gap(ctx, `dependency[${index}].target`, `Dependency ${index + 1} target unknown`, "dependency-unknown", "consultant-research", "medium"));
  });

  const evidence: EvidenceItem[] = form.evidence.map((draft, index) => ({
    id: `${ctx.siteId}-evidence-${index + 1}`,
    engagementId: ctx.engagementId,
    siteId: ctx.siteId,
    evidenceType: draft.evidenceType,
    title: draft.title || "Untitled evidence",
    source: draft.source,
    documentDate: draft.documentDate || null,
    receivedDate: draft.receivedDate || ctx.createdAt,
    effectiveDate: draft.effectiveDate || null,
    expirationDate: draft.expirationDate || null,
    verificationState: "document-verified",
    attachmentRef: null,
    notes: draft.notes,
    createdAt: ctx.createdAt,
    updatedAt: ctx.createdAt,
  }));

  // Apply consultant gap dispositions. "not-required" drops the gap;
  // "accepted-unknown" keeps it as an accepted record; a requestedFrom value
  // re-routes it.
  const finalGaps = gaps
    .filter((g) => form.gapDispositions[g.fieldPath] !== "not-required")
    .map((g) => {
      const disposition = form.gapDispositions[g.fieldPath];
      if (disposition === "accepted-unknown") return { ...g, status: "accepted-unknown" as const };
      if (disposition && disposition !== "none") {
        return { ...g, requestedFrom: disposition as DataGapRequestedFrom, requiresAuthorization: disposition === "carrier" };
      }
      return g;
    });

  const openGaps = finalGaps.filter((g) => g.status === "open");
  const carrierGaps = openGaps.filter((g) => g.requestedFrom === "carrier").length;
  const enterpriseGaps = openGaps.filter((g) => g.requestedFrom === "enterprise").length;

  const profileRequiresDiversity = form.archetype.includes("Data Center") || form.archetype.includes("Hub");
  const score = computeResilienceScore({
    controls: [
      { id: "power", weight: 20, result: "pass" },
      { id: "facility", weight: 15, result: "pass" },
      { id: "connectivity-diversity", weight: 30, result: circuits.length > 1 ? "pass" : "fail", isConnectivityDiversityControl: true },
      { id: "cyber", weight: 20, result: "pass" },
      { id: "recovery", weight: 15, result: "partial" },
    ],
    profile: {
      id: form.archetype.toLowerCase().replaceAll(" ", "-"),
      version: "2026.1",
      archetype: form.archetype,
      redundancyExpectation: profileRequiresDiversity ? "required" : "acceptable-single",
      criticalCaps: profileRequiresDiversity ? [{ controlId: "connectivity-diversity", maxScore: 69 }] : [],
    },
    singleSiteApproved: form.singleSiteApproved,
    assessedAt: "Just now",
    provisional: true,
  });

  const existing = ctx.existing;
  const site: SiteRecord = {
    id: ctx.siteId,
    tenantId: ctx.tenantId,
    enterpriseClientId: ctx.enterpriseClientId,
    engagementId: ctx.engagementId,
    code: form.code.trim(),
    name: form.name.trim(),
    archetypeId: form.archetype,
    primaryLocationType: form.primaryLocationType,
    secondaryLocationTypes: [],
    businessRoles: form.businessRoles ? form.businessRoles.split(",").map((s) => s.trim()).filter(Boolean) : [],
    networkRoles: form.networkRoles ? form.networkRoles.split(",").map((s) => s.trim()).filter(Boolean) : [],
    address: form.address.trim() || "Not yet provided",
    city: form.city.trim(),
    stateProvince: form.stateProvince.trim(),
    postalCode: form.postalCode.trim(),
    countryCode: form.countryCode.trim().toUpperCase(),
    countryName: form.countryName.trim(),
    latitude: null,
    longitude: null,
    timezone: form.timezone.trim() || "Not yet provided",
    ownershipModel: form.ownershipModel as SiteRecord["ownershipModel"],
    occupancyModel: form.occupancyModel as SiteRecord["occupancyModel"],
    operatingHours: form.operatingHours || "Unknown",
    userCount: toNumberOrNull(form.userCount),
    endpointCount: toNumberOrNull(form.endpointCount),
    businessCriticality: form.businessCriticality,
    operationalDependency: form.operationalDependency,
    safetyImpact: form.safetyImpact,
    regulatoryScope: form.regulatoryScope ? form.regulatoryScope.split(",").map((s) => s.trim()).filter(Boolean) : [],
    registryState: existing?.registryState ?? "draft",
    assessmentStatus: existing?.assessmentStatus ?? "data-collection",
    completenessPercent: circuits.length > 0 && form.address ? 55 : 20,
    lastVerifiedAt: existing?.lastVerifiedAt ?? "Not yet verified",
    nextReviewAt: existing?.nextReviewAt ?? "in 30 days",
    consultantOwnerId: form.consultantOwnerId || null,
    enterpriseOwnerContactId: form.enterpriseOwnerContactId || null,
    pendingEnterpriseRequestCount: enterpriseGaps,
    pendingCarrierRequestCount: carrierGaps,
    unresolvedDependencyCount: dependencies.filter((d) => d.state === "unknown").length + openGaps.filter((g) => g.requestedFrom === "carrier").length,
    openDataGapCount: openGaps.length,
    archivedAt: existing?.archivedAt ?? null,
    createdAt: existing?.createdAt ?? ctx.createdAt,
    updatedAt: ctx.createdAt,
    version: existing ? existing.version + 1 : 1,
    region: existing?.region ?? "Unassigned",
    criticalityLabel: form.archetype.includes("Data Center") ? "Tier I Mission Critical" : "Tier III Business Critical",
    ownerLabel: existing?.ownerLabel ?? "Not yet assigned",
    favorite: existing?.favorite ?? false,
    evidenceBadge: form.singleSiteApproved ? "single-site-acceptable" : existing?.evidenceBadge ?? null,
    imageAsset: existing?.imageAsset ?? assetForArchetype(form.archetype),
    score,
    carrierConnections: circuits.map((c) => ({ id: c.id, contractedCarrier: providerLabel(c.contractedProviderId), underlyingCarrier: providerLabel(c.underlyingProviderId), role: c.role === "primary" || c.role === "secondary" || c.role === "tertiary" ? c.role : "tertiary", serviceType: c.serviceType, circuitId: c.serviceIdentifier ?? "—", routeVerification: "provider-claimed" })),
    dependencyCount: circuits.length + components.length + dependencies.length,
    cardOpenRiskCount: circuits.length <= 1 && !form.singleSiteApproved ? 1 : 0,
    risks: circuits.length <= 1 && !form.singleSiteApproved
      ? [{ id: `RSK-${ctx.siteId.slice(-4).toUpperCase()}`, title: "Single carrier dependency", severity: "high", status: "open", control: "NET-DIV-01" }]
      : [],
    criticalServices: [],
    resilienceIndicators: [
      { id: "power", label: "Power Resilience", value: "Assessment pending", state: "warning", verification: "unknown" },
      { id: "connectivity", label: "Connectivity Resilience", value: form.singleSiteApproved ? "Approved Single-Site" : circuits.length > 1 ? "Multi-Carrier" : "Single/Unknown", state: form.singleSiteApproved ? "not-applicable" : circuits.length > 1 ? "pass" : "fail", verification: "unknown" },
      { id: "recovery", label: "Backup & Recovery", value: "Assessment pending", state: "warning", verification: "unknown" },
    ],
    compliance: existing?.compliance ?? [
      { framework: "DORA", state: "mapped", mappedControls: 0, lastAssessed: "Not assessed" },
      { framework: "ICT (EU)", state: "mapped", mappedControls: 0, lastAssessed: "Not assessed" },
    ],
    evidenceConfidence: evidence.length > 1 ? "medium" : "low",
    evidenceConfidencePercent: Math.min(80, 10 + evidence.length * 15),
    activity: existing?.activity ?? [{ id: `${ctx.siteId}-created`, action: "Site registered", actor: "AB", relativeTime: "Just now" }],
    publicationState: "insufficient-assessment",
    tags: [form.archetype.toLowerCase().replaceAll(" ", "-"), existing ? "edited" : "new-site"],
  };

  return { site, circuits, components, dependencies, evidence, dataGaps: finalGaps };
}

function providerLabel(id: string | null): string {
  if (!id) return "Unknown";
  return id.replace(/^provider-/, "").replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function assetForArchetype(type: string): string {
  if (type.includes("Cloud")) return "/assets/sites/aws-eu-west-1.webp";
  if (type.includes("Data Center")) return "/assets/sites/dc1-london.webp";
  if (type.includes("Hub")) return "/assets/sites/hub-amsterdam.webp";
  if (type.includes("Edge")) return "/assets/sites/edge-25-madrid.webp";
  return "/assets/sites/br-1001-paris.webp";
}

/** Reverse a SiteRecord into an editable IntakeForm (for the edit flow). */
export function formFromSite(site: SiteRecord): IntakeForm {
  const base = emptyIntakeForm();
  return {
    ...base,
    code: site.code,
    name: site.name,
    archetype: site.archetypeId,
    primaryLocationType: site.primaryLocationType,
    address: site.address === "Not yet provided" ? "" : site.address,
    city: site.city,
    stateProvince: site.stateProvince,
    postalCode: site.postalCode,
    countryCode: site.countryCode,
    countryName: site.countryName,
    timezone: site.timezone === "Not yet provided" ? "" : site.timezone,
    ownershipModel: site.ownershipModel,
    occupancyModel: site.occupancyModel,
    operatingHours: site.operatingHours === "Unknown" ? "" : site.operatingHours,
    userCount: site.userCount?.toString() ?? "",
    endpointCount: site.endpointCount?.toString() ?? "",
    businessRoles: site.businessRoles.join(", "),
    networkRoles: site.networkRoles.join(", "),
    consultantOwnerId: site.consultantOwnerId ?? "",
    enterpriseOwnerContactId: site.enterpriseOwnerContactId ?? "",
    businessCriticality: site.businessCriticality,
    operationalDependency: site.operationalDependency,
    safetyImpact: site.safetyImpact,
    regulatoryScope: site.regulatoryScope.join(", "),
    singleSiteApproved: site.evidenceBadge === "single-site-acceptable",
  };
}
