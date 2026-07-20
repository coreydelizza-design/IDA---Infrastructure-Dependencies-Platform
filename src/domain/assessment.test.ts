import { describe, expect, it } from "vitest";
import { assessSite, type AssessmentContext, type ControlResult } from "./assessment";
import { getAssessmentProfile } from "./assessmentProfiles";

const ctx = (overrides: Partial<AssessmentContext> = {}): AssessmentContext => ({
  singleSiteApproved: false,
  acceptedRiskControlIds: [],
  assessedAt: "2026-07-20",
  ...overrides,
});

function results(siteId: string, outcomes: Record<string, ControlResult["outcome"]>, evidenceControls: string[] = []): ControlResult[] {
  return Object.entries(outcomes).map(([controlId, outcome]) => ({
    siteId,
    controlId,
    outcome,
    evidenceItemIds: evidenceControls.includes(controlId) ? [`ev-${controlId}`] : [],
    verificationState: evidenceControls.includes(controlId) ? "consultant-verified" : "unknown",
  }));
}

const ALL_PASS = {
  "connectivity-diversity": "pass", "power-resilience": "pass", "facility-resilience": "pass",
  "environmental-controls": "pass", "physical-security": "pass", "workforce-availability": "pass",
  "cyber-resilience": "pass", "backup-recovery": "pass",
} as const;

describe("assessSite — scoring", () => {
  it("scores 100 when all applicable controls pass", () => {
    const profile = getAssessmentProfile("Primary Data Center");
    const res = assessSite(profile, results("s1", ALL_PASS), ctx());
    expect(res.architectureAssuranceScore).toBe(100);
    expect(res.architectureAssuranceBand).toBe("excellent");
    expect(res.provisional).toBe(false);
  });

  it("computes earned/applicable × 100", () => {
    const profile = getAssessmentProfile("Cloud Region"); // no diversity cap
    // fail cyber-resilience (weight 10) -> 90
    const res = assessSite(profile, results("s1", { ...ALL_PASS, "cyber-resilience": "fail" }), ctx());
    expect(res.architectureAssuranceScore).toBe(90);
    expect(res.technicalGapRetained).toBe(true);
  });

  it("applies the critical cap when a required diversity control fails", () => {
    const profile = getAssessmentProfile("Primary Data Center"); // connectivity capScore 69
    const res = assessSite(profile, results("s1", { ...ALL_PASS, "connectivity-diversity": "fail" }), ctx());
    expect(res.architectureAssuranceScore).toBeLessThanOrEqual(69);
    expect(res.designConformance).toBe("non-conformant");
  });
});

describe("single-site exception", () => {
  it("does not penalize an approved single-site connectivity control", () => {
    const profile = getAssessmentProfile("Regional Office"); // acceptable-single
    const single = { ...ALL_PASS, "connectivity-diversity": "fail" } as Record<string, ControlResult["outcome"]>;
    const res = assessSite(profile, results("s1", single), ctx({ singleSiteApproved: true }));
    // connectivity excluded -> all remaining pass -> 100
    expect(res.architectureAssuranceScore).toBe(100);
    expect(res.designConformance).toBe("exception-approved");
  });

  it("penalizes a single-carrier site that is NOT approved single-site", () => {
    const profile = getAssessmentProfile("Regional Office");
    const res = assessSite(profile, results("s1", { ...ALL_PASS, "connectivity-diversity": "fail" }), ctx({ singleSiteApproved: false }));
    expect(res.architectureAssuranceScore).toBeLessThan(100);
  });
});

describe("risk acceptance never improves the technical score", () => {
  it("an accepted control earns nothing and remains a residual gap", () => {
    const profile = getAssessmentProfile("Cloud Region");
    const withFail = assessSite(profile, results("s1", { ...ALL_PASS, "power-resilience": "fail" }), ctx());
    const withAccepted = assessSite(profile, results("s1", { ...ALL_PASS, "power-resilience": "pass" }), ctx({ acceptedRiskControlIds: ["power-resilience"] }));
    // Accepting the risk must NOT score higher than the underlying failure.
    expect(withAccepted.architectureAssuranceScore).toBe(withFail.architectureAssuranceScore);
    expect(withAccepted.residualRiskCount).toBeGreaterThan(0);
  });
});

describe("coverage and evidence confidence", () => {
  it("reduces coverage when controls are unassessed", () => {
    const profile = getAssessmentProfile("Cloud Region");
    const partial = { "connectivity-diversity": "pass", "power-resilience": "pass" } as Record<string, ControlResult["outcome"]>;
    const res = assessSite(profile, results("s1", partial), ctx());
    expect(res.assessmentCoveragePercent).toBe(45); // 25+20 of 100
    expect(res.publicationState).toBe("provisional");
  });

  it("computes evidence confidence from evidence-backed earned weight", () => {
    const profile = getAssessmentProfile("Cloud Region");
    const res = assessSite(profile, results("s1", ALL_PASS, ["connectivity-diversity", "power-resilience"]), ctx());
    // 45 of 100 earned weight is evidence-backed
    expect(res.evidenceConfidencePercent).toBe(45);
    expect(res.publicationState).toBe("publishable");
  });

  it("marks insufficient assessment below 40% coverage", () => {
    const profile = getAssessmentProfile("Cloud Region");
    const res = assessSite(profile, results("s1", { "backup-recovery": "pass" }), ctx());
    expect(res.publicationState).toBe("insufficient-assessment");
  });
});
