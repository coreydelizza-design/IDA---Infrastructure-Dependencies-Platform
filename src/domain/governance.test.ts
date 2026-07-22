import { describe, expect, it } from "vitest";
import { buildDecision, buildPendingApprovals, buildReconciliationQueue, parseDecisionTarget, pendingCount, resolveDecisionEffect } from "./governance";
import type { CustomerDecision, PendingApproval } from "./governance";
import type { EnterpriseAuthorizationSummary } from "./authorization";
import type { SiteRecord } from "./sites";
import type { HealthBand } from "./models";

const NOW = "2026-07-21T00:00:00.000Z";
const ENG = "eng-2026-001";

function site(id: string, over: Partial<SiteRecord> = {}): SiteRecord {
  const band: HealthBand = "good";
  return {
    id, tenantId: "t", enterpriseClientId: "e", engagementId: ENG, code: id, name: id, archetypeId: "a", primaryLocationType: "x",
    secondaryLocationTypes: [], businessRoles: [], networkRoles: [], workloads: [], address: "", city: "City", stateProvince: "", postalCode: "",
    countryCode: "US", countryName: "US", latitude: null, longitude: null, timezone: "", ownershipModel: "unknown", occupancyModel: "unknown",
    operatingHours: "24x7", userCount: null, endpointCount: null, businessCriticality: 4, operationalDependency: 4, safetyImpact: 1,
    regulatoryScope: [], registryState: "consultant-verified", assessmentStatus: "published", completenessPercent: 100, lastVerifiedAt: NOW,
    nextReviewAt: NOW, consultantOwnerId: null, enterpriseOwnerContactId: null, pendingEnterpriseRequestCount: 0, pendingCarrierRequestCount: 0,
    unresolvedDependencyCount: 0, openDataGapCount: 0, archivedAt: null, createdAt: NOW, updatedAt: NOW, version: 1, region: "", criticalityLabel: "",
    ownerLabel: "", favorite: false, evidenceBadge: null, imageAsset: "", score: { score: 78, band, label: "Good", profileVersion: "1", assessedAt: NOW, singleSiteApproved: false, technicalGapRetained: false, provisional: false },
    carrierConnections: [], dependencyCount: 0, risks: [], cardOpenRiskCount: 0, criticalServices: [], resilienceIndicators: [], compliance: [],
    evidenceConfidence: "high", evidenceConfidencePercent: 90, activity: [], publicationState: "publishable", tags: [],
    ...over,
  };
}

function auth(id: string, over: Partial<EnterpriseAuthorizationSummary> = {}): EnterpriseAuthorizationSummary {
  return {
    id, engagementId: ENG, enterpriseClientId: "e", status: "pending-enterprise-signature",
    scopeSummary: "Confirm circuits", effectiveDate: null, expirationDate: null,
    carrierIds: ["provider-gtt"], siteIds: ["site-1", "site-2"], ...over,
  };
}

describe("buildPendingApprovals", () => {
  it("queues LOAs awaiting signature and open high/critical risks", () => {
    const items = buildPendingApprovals({
      engagementId: ENG,
      authorizations: [auth("a1"), auth("a2", { status: "active" })],
      siteRecords: [
        site("S1", { risks: [{ id: "r1", title: "No diverse path", severity: "high", status: "open" }] }),
        site("S2", { risks: [{ id: "r2", title: "Low", severity: "low", status: "open" }, { id: "r3", title: "Closed crit", severity: "critical", status: "closed" }] }),
      ],
      decisions: [],
    });
    const ids = items.map((i) => i.id);
    expect(ids).toContain("loa:a1"); // pending signature
    expect(ids).not.toContain("loa:a2"); // active, not pending
    expect(ids).toContain("risk:S1:r1"); // open high
    expect(ids).not.toContain("risk:S2:r2"); // low severity
    expect(ids).not.toContain("risk:S2:r3"); // closed
  });

  it("links a submitted decision to its item", () => {
    const decision: CustomerDecision = {
      id: "d1", engagementId: ENG, itemId: "loa:a1", actionType: "loa-signature",
      outcome: "approved", note: "", actorRole: "enterprise-sponsor", submittedAt: NOW, reconciliationState: "pending-reconciliation",
    };
    const items = buildPendingApprovals({ engagementId: ENG, authorizations: [auth("a1")], siteRecords: [], decisions: [decision] });
    expect(items[0].decision).toEqual(decision);
    expect(pendingCount(items)).toBe(0);
  });

  it("caps risk items at the configured limit", () => {
    const risks = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, title: `Risk ${i}`, severity: "high" as const, status: "open" as const }));
    const items = buildPendingApprovals({ engagementId: ENG, authorizations: [], siteRecords: [site("S1", { risks })], decisions: [], riskLimit: 3 });
    expect(items.filter((i) => i.actionType === "risk-acceptance")).toHaveLength(3);
  });
});

describe("buildDecision", () => {
  it("stamps a pending-reconciliation decision bound to the item", () => {
    const item: PendingApproval = { id: "risk:S1:r1", actionType: "risk-acceptance", title: "t", detail: "d", context: "c", decision: null };
    const d = buildDecision({ id: "dec-1", engagementId: ENG, item, outcome: "accepted", note: "signed off", actorRole: "enterprise-approver", submittedAt: NOW });
    expect(d).toEqual({
      id: "dec-1", engagementId: ENG, itemId: "risk:S1:r1", actionType: "risk-acceptance",
      outcome: "accepted", note: "signed off", actorRole: "enterprise-approver", submittedAt: NOW, reconciliationState: "pending-reconciliation",
    });
  });
});

function decision(over: Partial<CustomerDecision>): CustomerDecision {
  return {
    id: "dec", engagementId: ENG, itemId: "loa:a1", actionType: "loa-signature",
    outcome: "approved", note: "", actorRole: "enterprise-sponsor", submittedAt: NOW,
    reconciliationState: "pending-reconciliation", ...over,
  };
}

describe("parseDecisionTarget", () => {
  it("recovers the authorization id from an LOA decision", () => {
    expect(parseDecisionTarget(decision({ actionType: "loa-signature", itemId: "loa:auth-emea-gtt-2026" }))).toEqual({ authId: "auth-emea-gtt-2026" });
  });
  it("recovers site + risk ids from a risk decision", () => {
    expect(parseDecisionTarget(decision({ actionType: "risk-acceptance", itemId: "risk:site-1:RSK-205" }))).toEqual({ siteId: "site-1", riskId: "RSK-205" });
  });
});

describe("resolveDecisionEffect", () => {
  it("approved LOA activates the authorization", () => {
    const e = resolveDecisionEffect(decision({ actionType: "loa-signature", outcome: "approved", itemId: "loa:a1" }));
    expect(e).toMatchObject({ kind: "authorization", targetId: "a1", nextStatus: "active" });
  });
  it("declined LOA makes no canonical change", () => {
    const e = resolveDecisionEffect(decision({ actionType: "loa-signature", outcome: "declined", itemId: "loa:a1" }));
    expect(e).toMatchObject({ kind: "none", nextStatus: null });
  });
  it("accepted risk sets the risk to accepted", () => {
    const e = resolveDecisionEffect(decision({ actionType: "risk-acceptance", outcome: "accepted", itemId: "risk:S1:r1" }));
    expect(e).toMatchObject({ kind: "risk", targetId: "r1", siteId: "S1", nextStatus: "accepted" });
  });
  it("declined risk makes no canonical change", () => {
    const e = resolveDecisionEffect(decision({ actionType: "risk-acceptance", outcome: "declined", itemId: "risk:S1:r1" }));
    expect(e).toMatchObject({ kind: "none", nextStatus: null });
  });
});

describe("buildReconciliationQueue", () => {
  it("includes only pending decisions for the engagement and resolves titles/effects", () => {
    const items = buildReconciliationQueue({
      engagementId: ENG,
      decisions: [
        decision({ id: "d1", actionType: "loa-signature", outcome: "approved", itemId: "loa:a1" }),
        decision({ id: "d2", actionType: "risk-acceptance", outcome: "accepted", itemId: "risk:S1:r1", reconciliationState: "reconciled" }), // already reconciled → excluded
        decision({ id: "d3", actionType: "risk-acceptance", outcome: "accepted", itemId: "risk:S1:r1", engagementId: "other" }), // other engagement → excluded
      ],
      authorizations: [auth("a1")],
      siteRecords: [site("S1", { code: "BR-1001", name: "Paris", risks: [{ id: "r1", title: "No diverse path", severity: "high", status: "open" }] })],
    });
    expect(items).toHaveLength(1);
    expect(items[0].decision.id).toBe("d1");
    expect(items[0].title).toContain("provider-gtt");
    expect(items[0].effect.nextStatus).toBe("active");
    expect(items[0].outcomeLabel).toBe("Signed");
  });
});
