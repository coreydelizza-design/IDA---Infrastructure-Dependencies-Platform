import { describe, expect, it } from "vitest";
import {
  applyCarrierResponse,
  canIssueCarrierRequest,
  deriveRegistrationDataGaps,
  isAuthorizationEffective,
  isRegistryStateOperational,
  isSiteVisibleToCarrier,
  shouldFabricateCarrierConnections,
  visibleFieldsForCarrier,
  type SiteRegistrationInput,
} from "./assurance";
import { computeResilienceScore } from "./scoring";
import type {
  CanonicalFact,
  CarrierAcknowledgment,
  ConfirmationResponse,
  EnterpriseAuthorization,
  RegistryState,
} from "./models";

function baseAuthorization(overrides: Partial<EnterpriseAuthorization> = {}): EnterpriseAuthorization {
  return {
    id: "auth-1",
    engagementId: "eng-1",
    enterprise: "Enterprise Co.",
    carriers: ["BT Global Services"],
    scopeSites: ["site-dc1-london"],
    scopeFields: ["circuitId", "routeVerification"],
    signatureStatus: "signed",
    status: "active",
    effectiveDate: "2026-01-01",
    expirationDate: "2026-12-31",
    revokedAt: null,
    siteCount: 1,
    ...overrides,
  };
}

function carrierResponse(overrides: Partial<ConfirmationResponse> = {}): ConfirmationResponse {
  return {
    id: "resp-1",
    requestId: "req-1",
    carrier: "BT Global Services",
    respondentRole: "carrier-respondent",
    disposition: "correct",
    proposedFields: [{ field: "circuitId", value: "BT-DC1-999" }],
    evidenceRefs: [],
    submittedAt: "2026-07-15",
    reconciliationStatus: "staged",
    ...overrides,
  };
}

describe("Add Site data gaps", () => {
  const baseInput: SiteRegistrationInput = {
    siteId: "site-berlin",
    code: "BR-1002",
    knownCarrierCount: 1,
    providedFields: {},
    requireEnterpriseFollowUp: true,
    requireCarrierConfirmation: true,
    createdAt: "2026-07-20",
  };

  it("creates a data gap for unknown carrier data instead of a fictional connection", () => {
    const gaps = deriveRegistrationDataGaps(baseInput);
    const carrierGap = gaps.find((gap) => gap.field === "carrierIdentity");

    expect(carrierGap).toBeDefined();
    expect(carrierGap?.state).toBe("open");
    expect(carrierGap?.followUp).toBe("carrier");
    // No fabricated carrier/circuit records when identity/inventory are unknown.
    expect(shouldFabricateCarrierConnections(baseInput)).toBe(false);
  });

  it("does not create a carrier gap once carrier identity and inventory are provided", () => {
    const input: SiteRegistrationInput = {
      ...baseInput,
      providedFields: { carrierIdentity: true, circuitInventory: true },
    };
    const gaps = deriveRegistrationDataGaps(input);
    expect(gaps.find((gap) => gap.field === "carrierIdentity")).toBeUndefined();
    expect(shouldFabricateCarrierConnections(input)).toBe(true);
  });

  it("routes follow-up to internal when neither enterprise nor carrier follow-up is requested", () => {
    const gaps = deriveRegistrationDataGaps({
      ...baseInput,
      requireEnterpriseFollowUp: false,
      requireCarrierConfirmation: false,
    });
    expect(gaps.every((gap) => gap.followUp === "internal")).toBe(true);
  });
});

describe("carrier response reconciliation", () => {
  it("cannot directly overwrite a consultant-verified canonical fact", () => {
    const canonical: CanonicalFact = {
      id: "fact-1",
      siteId: "site-dc1-london",
      field: "circuitId",
      value: "BT-DC1-001",
      provenance: {
        source: "consultant",
        verificationState: "consultant-verified",
        updatedAt: "2026-06-01",
        locked: true,
      },
    };

    const outcome = applyCarrierResponse(canonical, carrierResponse(), { field: "circuitId", value: "BT-DC1-999" });

    expect(outcome.staged).toBe(true);
    expect(outcome.fact.value).toBe("BT-DC1-001"); // unchanged
    expect(outcome.proposedClaim?.reconciliationStatus).toBe("staged");
  });

  it("applies a carrier value only when the fact is not consultant-verified", () => {
    const claimed: CanonicalFact = {
      id: "fact-2",
      siteId: "site-dc1-london",
      field: "circuitId",
      value: "unknown",
      provenance: {
        source: "inferred",
        verificationState: "unknown",
        updatedAt: "2026-06-01",
        locked: false,
      },
    };

    const outcome = applyCarrierResponse(claimed, carrierResponse(), { field: "circuitId", value: "BT-DC1-999" });

    expect(outcome.staged).toBe(false);
    expect(outcome.fact.value).toBe("BT-DC1-999");
    expect(outcome.fact.provenance.verificationState).toBe("provider-claimed");
  });
});

describe("authorization scope", () => {
  it("limits carrier-visible sites to the authorization scope", () => {
    const auth = baseAuthorization({ scopeSites: ["site-dc1-london"] });
    expect(isSiteVisibleToCarrier(auth, "site-dc1-london")).toBe(true);
    expect(isSiteVisibleToCarrier(auth, "site-trd-new-york")).toBe(false);
  });

  it("limits carrier-visible fields to the authorization scope", () => {
    const auth = baseAuthorization({ scopeFields: ["circuitId"] });
    const record = { circuitId: "BT-DC1-001", contractPrice: "confidential", owner: "Resilience Office" };
    const visible = visibleFieldsForCarrier(auth, record);
    expect(visible).toEqual({ circuitId: "BT-DC1-001" });
    expect("contractPrice" in visible).toBe(false);
  });
});

describe("authorization lifecycle blocks carrier requests", () => {
  const asOf = "2026-07-15";

  it("allows requests under an effective authorization", () => {
    expect(canIssueCarrierRequest(baseAuthorization(), asOf)).toBe(true);
  });

  it("blocks requests when the authorization is expired", () => {
    const expired = baseAuthorization({ status: "expired", expirationDate: "2026-06-30" });
    expect(isAuthorizationEffective(expired, asOf)).toBe(false);
    expect(canIssueCarrierRequest(expired, asOf)).toBe(false);
  });

  it("blocks requests when the authorization is revoked", () => {
    const revoked = baseAuthorization({ status: "revoked", revokedAt: "2026-07-01" });
    expect(canIssueCarrierRequest(revoked, asOf)).toBe(false);
  });

  it("blocks requests before the effective date", () => {
    expect(canIssueCarrierRequest(baseAuthorization(), "2025-12-01")).toBe(false);
  });
});

describe("carrier acknowledgment is separate from enterprise authorization", () => {
  it("does not change authorization status and can lag a signed authorization", () => {
    const auth = baseAuthorization();
    const ack: CarrierAcknowledgment = {
      id: "ack-1",
      authorizationId: auth.id,
      carrier: "BT Global Services",
      acknowledgmentStatus: "pending",
      acknowledgedAt: null,
    };

    // Authorization is effective regardless of acknowledgment state.
    expect(isAuthorizationEffective(auth, "2026-07-15")).toBe(true);
    expect(ack.acknowledgmentStatus).toBe("pending");
    // Acknowledgment carries no authorization/signature semantics.
    expect(ack).not.toHaveProperty("signatureStatus");
    expect(ack).not.toHaveProperty("status");
  });
});

describe("registry state is not operational up/down state", () => {
  it("no registry state maps to an operational term", () => {
    const states: RegistryState[] = [
      "engagement-established",
      "collecting",
      "in-reconciliation",
      "assured",
      "revalidation-due",
    ];
    for (const state of states) {
      expect(isRegistryStateOperational(state)).toBe(false);
    }
  });
});

describe("point-in-time scoring is independent of live status", () => {
  it("scores identically regardless of any live/operational signal", () => {
    const scoreInput = {
      controls: [
        { id: "power", weight: 20, result: "pass" as const },
        { id: "connectivity-diversity", weight: 30, result: "pass" as const, isConnectivityDiversityControl: true },
        { id: "recovery", weight: 15, result: "partial" as const },
      ],
      profile: {
        id: "dc",
        version: "2026.1",
        archetype: "Primary Data Center",
        redundancyExpectation: "required" as const,
        criticalCaps: [],
      },
      singleSiteApproved: false,
      assessedAt: "2 days ago",
    };

    const first = computeResilienceScore(scoreInput);
    const second = computeResilienceScore(scoreInput);

    // Deterministic and derived only from documented controls + profile.
    expect(first.score).toBe(second.score);
    expect(first).not.toHaveProperty("online");
    expect(first).not.toHaveProperty("liveStatus");
    // The scoring input surface has no operational/live status field at all.
    expect(Object.keys(scoreInput)).not.toContain("online");
    expect(Object.keys(scoreInput)).not.toContain("status");
  });
});
