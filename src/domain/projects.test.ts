import { describe, expect, it } from "vitest";
import { buildProjectSummaries, engagementProgress, ENGAGEMENT_STATUS_LABELS } from "./projects";
import type { Engagement } from "./engagements";
import type { EnterpriseClient } from "./organizations";
import type { SiteRecord } from "./sites";

const NOW = "2026-07-21T00:00:00.000Z";

function enterprise(id: string, name: string): EnterpriseClient {
  return { id, consultancyOrganizationId: "org", name, legalName: name, industry: "x", headquartersCountry: "US", status: "active", externalReference: null, createdAt: NOW, updatedAt: NOW };
}
function engagement(id: string, enterpriseClientId: string, status: Engagement["status"]): Engagement {
  return { id, consultancyOrganizationId: "org", enterpriseClientId, name: `Project ${id}`, code: id.toUpperCase(), description: "", status, scopeStatement: "scope", startDate: null, targetCompletionDate: null, reviewCadence: "annual", leadConsultantUserId: null, createdAt: NOW, updatedAt: NOW };
}
function site(id: string, engagementId: string, over: Partial<SiteRecord> = {}): SiteRecord {
  return {
    id, tenantId: "t", enterpriseClientId: "e", engagementId, code: id, name: id, archetypeId: "a", primaryLocationType: "x",
    secondaryLocationTypes: [], businessRoles: [], networkRoles: [], workloads: [], address: "", city: "", stateProvince: "", postalCode: "",
    countryCode: "US", countryName: "US", latitude: null, longitude: null, timezone: "", ownershipModel: "unknown", occupancyModel: "unknown",
    operatingHours: "24x7", userCount: null, endpointCount: null, businessCriticality: 4, operationalDependency: 4, safetyImpact: 1,
    regulatoryScope: [], registryState: "consultant-verified", assessmentStatus: "published", completenessPercent: 100, lastVerifiedAt: NOW,
    nextReviewAt: NOW, consultantOwnerId: null, enterpriseOwnerContactId: null, pendingEnterpriseRequestCount: 0, pendingCarrierRequestCount: 0,
    unresolvedDependencyCount: 0, openDataGapCount: 0, archivedAt: null, createdAt: NOW, updatedAt: NOW, version: 1, region: "", criticalityLabel: "",
    ownerLabel: "", favorite: false, evidenceBadge: null, imageAsset: "", score: { score: 90, band: "excellent", label: "Excellent", profileVersion: "1", assessedAt: NOW, singleSiteApproved: false, technicalGapRetained: false, provisional: false },
    carrierConnections: [], dependencyCount: 0, risks: [], cardOpenRiskCount: 0, criticalServices: [], resilienceIndicators: [], compliance: [],
    evidenceConfidence: "high", evidenceConfidencePercent: 90, activity: [], publicationState: "publishable", tags: [],
    ...over,
  };
}

describe("buildProjectSummaries", () => {
  const enterprises = [enterprise("e1", "Alpha"), enterprise("e2", "Beta")];
  const engagements = [engagement("g1", "e1", "data-collection"), engagement("g2", "e2", "published"), engagement("g3", "e1", "archived")];
  const sites = [
    site("s1", "g1", { countryCode: "US", publicationState: "publishable", cardOpenRiskCount: 2 }),
    site("s2", "g1", { countryCode: "DE", publicationState: "provisional", cardOpenRiskCount: 0 }),
    site("s3", "g2", { countryCode: "US", publicationState: "publishable" }),
  ];

  it("excludes archived engagements and joins the enterprise name", () => {
    const out = buildProjectSummaries({ engagements, enterprises, sites });
    expect(out.map((p) => p.engagementId)).toEqual(["g1", "g2"]);
    expect(out[0].enterpriseName).toBe("Alpha");
  });

  it("computes site/country/publishable/risk counts per project", () => {
    const [g1] = buildProjectSummaries({ engagements, enterprises, sites });
    expect(g1.siteCount).toBe(2);
    expect(g1.countryCount).toBe(2);
    expect(g1.publishableCount).toBe(1);
    expect(g1.openRiskCount).toBe(2);
  });

  it("reports zero counts for a project with no sites", () => {
    const g2 = buildProjectSummaries({ engagements: [engagement("g9", "e1", "scoping")], enterprises, sites: [] })[0];
    expect(g2.siteCount).toBe(0);
    expect(g2.countryCount).toBe(0);
  });
});

describe("engagementProgress", () => {
  it("increases along the lifecycle and caps published+ at 1", () => {
    expect(engagementProgress("draft")).toBe(0);
    expect(engagementProgress("assessment")).toBeGreaterThan(engagementProgress("scoping"));
    expect(engagementProgress("published")).toBe(1);
    expect(engagementProgress("periodic-review")).toBe(1);
  });
  it("labels every status", () => {
    expect(ENGAGEMENT_STATUS_LABELS["data-collection"]).toBe("Data Collection");
  });
});
