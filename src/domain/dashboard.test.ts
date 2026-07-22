import { describe, expect, it } from "vitest";
import { buildDashboard } from "./dashboard";
import type { SiteRecord } from "./sites";
import type { HealthBand } from "./models";

const NOW = "2026-07-21T00:00:00.000Z";

function site(id: string, band: HealthBand, score: number, over: Partial<SiteRecord> = {}): SiteRecord {
  return {
    id, tenantId: "t", enterpriseClientId: "e", engagementId: "g", code: id, name: id, archetypeId: "a", primaryLocationType: "x",
    secondaryLocationTypes: [], businessRoles: [], networkRoles: [], workloads: [], address: "", city: "City", stateProvince: "", postalCode: "",
    countryCode: "US", countryName: "US", latitude: null, longitude: null, timezone: "", ownershipModel: "unknown", occupancyModel: "unknown",
    operatingHours: "24x7", userCount: null, endpointCount: null, businessCriticality: 4, operationalDependency: 4, safetyImpact: 1,
    regulatoryScope: [], registryState: "consultant-verified", assessmentStatus: "published", completenessPercent: 100, lastVerifiedAt: NOW,
    nextReviewAt: NOW, consultantOwnerId: null, enterpriseOwnerContactId: null, pendingEnterpriseRequestCount: 0, pendingCarrierRequestCount: 0,
    unresolvedDependencyCount: 0, openDataGapCount: 0, archivedAt: null, createdAt: NOW, updatedAt: NOW, version: 1, region: "", criticalityLabel: "",
    ownerLabel: "", favorite: false, evidenceBadge: null, imageAsset: "", score: { score, band, label: band, profileVersion: "1", assessedAt: NOW, singleSiteApproved: false, technicalGapRetained: false, provisional: false },
    carrierConnections: [], dependencyCount: 0, risks: [], cardOpenRiskCount: 0, criticalServices: [], resilienceIndicators: [], compliance: [],
    evidenceConfidence: "high", evidenceConfidencePercent: 90, activity: [], publicationState: "publishable", tags: [],
    ...over,
  };
}

describe("buildDashboard", () => {
  const sites = [
    site("A", "excellent", 95, { countryCode: "US", publicationState: "publishable" }),
    site("B", "good", 78, { countryCode: "FR", cardOpenRiskCount: 2, risks: [{ id: "r1", title: "x", severity: "high", status: "open" }] }),
    site("C", "at-risk", 54, { countryCode: "ES", publicationState: "provisional", cardOpenRiskCount: 4, score: { score: 54, band: "at-risk", label: "At Risk", profileVersion: "1", assessedAt: NOW, singleSiteApproved: false, technicalGapRetained: false, provisional: true }, risks: [{ id: "r2", title: "y", severity: "critical", status: "open" }] }),
  ];

  it("aggregates counts, countries, and band distribution", () => {
    const m = buildDashboard(sites);
    expect(m.siteCount).toBe(3);
    expect(m.countryCount).toBe(3);
    expect(m.bands).toEqual({ excellent: 1, good: 1, "at-risk": 1, critical: 0 });
  });

  it("averages assurance and derives its band", () => {
    const m = buildDashboard(sites); // (95+78+54)/3 = 75.67 -> 76
    expect(m.averageAssurance).toBe(76);
    expect(m.averageBand).toBe("good");
  });

  it("splits publishable vs provisional and counts critical/high open risks", () => {
    const m = buildDashboard(sites);
    expect(m.publishableCount).toBe(2);
    expect(m.provisionalCount).toBe(1);
    expect(m.openCriticalRiskCount).toBe(2); // one high + one critical
    expect(m.totalOpenRiskCount).toBe(6); // 0 + 2 + 4
  });

  it("surfaces attention sites worst-band first", () => {
    const m = buildDashboard(sites);
    expect(m.attention[0].code).toBe("C"); // at-risk first
    expect(m.attention.map((a) => a.code)).toContain("B"); // has open risks
    expect(m.attention.map((a) => a.code)).not.toContain("A"); // excellent, no risks
  });

  it("handles an empty registry", () => {
    const m = buildDashboard([]);
    expect(m.siteCount).toBe(0);
    expect(m.averageAssurance).toBe(0);
    expect(m.attention).toEqual([]);
  });
});
