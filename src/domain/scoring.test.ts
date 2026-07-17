import { describe, expect, it } from "vitest";
import { computeResilienceScore } from "./scoring";

const controls = [
  { id: "power", weight: 30, result: "pass" as const },
  {
    id: "connectivity-diversity",
    weight: 30,
    result: "fail" as const,
    isConnectivityDiversityControl: true,
  },
  { id: "recovery", weight: 40, result: "pass" as const },
];

describe("computeResilienceScore", () => {
  it("does not penalize an approved single-site design", () => {
    const score = computeResilienceScore({
      controls,
      profile: {
        id: "regional-office",
        version: "2026.1",
        archetype: "Regional Office",
        redundancyExpectation: "acceptable-single",
        criticalCaps: [],
      },
      singleSiteApproved: true,
      assessedAt: "2026-07-16",
    });

    expect(score.score).toBe(100);
    expect(score.singleSiteApproved).toBe(true);
  });

  it("does penalize diversity when the archetype requires it", () => {
    const score = computeResilienceScore({
      controls,
      profile: {
        id: "data-center",
        version: "2026.1",
        archetype: "Primary Data Center",
        redundancyExpectation: "required",
        criticalCaps: [],
      },
      singleSiteApproved: false,
      assessedAt: "2026-07-16",
    });

    expect(score.score).toBe(70);
  });
});
