import { describe, expect, it } from "vitest";
import {
  canOverwriteFact,
  deriveRegistrationDataGaps,
  isOperationalStateTerm,
  presentSite,
  shouldCreateCarrierConnections,
  type Circuit,
  type CriticalService,
  type FieldProvenance,
  type RegistryState,
} from "./index";
import { buildSeedDataset } from "../infrastructure/local/seed";
import { toCamelCase, toSnakeCase } from "../infrastructure/supabase/mappers";

const registrationInput = {
  siteId: "site-berlin",
  engagementId: "eng-1",
  knownCarrierCount: 1,
  providedFields: {},
  requireEnterpriseFollowUp: true,
  requireCarrierConfirmation: true,
  createdAt: "2026-07-20",
};

describe("Add Site data gaps", () => {
  it("creates a data gap for unknown carrier data instead of a fictional connection", () => {
    const gaps = deriveRegistrationDataGaps(registrationInput);
    expect(gaps.find((g) => g.fieldPath === "carrierIdentity")).toBeDefined();
    expect(shouldCreateCarrierConnections(registrationInput)).toBe(false);
  });

  it("creates a gap for an unknown circuit identifier", () => {
    const gaps = deriveRegistrationDataGaps(registrationInput);
    expect(gaps.some((g) => g.fieldPath === "circuitInventory")).toBe(true);
  });

  it("does not create carrier gaps once identity and inventory are known", () => {
    const known = { ...registrationInput, providedFields: { carrierIdentity: true, circuitInventory: true } };
    const gaps = deriveRegistrationDataGaps(known);
    expect(gaps.some((g) => g.fieldPath === "carrierIdentity")).toBe(false);
    expect(shouldCreateCarrierConnections(known)).toBe(true);
  });
});

describe("provenance protects consultant-verified facts", () => {
  const verified: FieldProvenance = {
    id: "p1", engagementId: "eng-1", entityType: "circuit", entityId: "c1", fieldPath: "circuitId",
    sourceType: "consultant-entry", sourceName: "Consultant", sourceRecordId: null, submittedByUserId: "u1",
    observedAt: null, receivedAt: "2026-06-01", verificationState: "consultant-verified", evidenceItemId: null,
    authoritative: true, manuallyOverridden: false, overrideReason: null, supersededAt: null,
  };

  it("blocks a carrier claim from overwriting a consultant-verified fact", () => {
    expect(canOverwriteFact(verified, "carrier-response")).toBe(false);
  });

  it("blocks an imported claim from overwriting a consultant-verified fact", () => {
    expect(canOverwriteFact(verified, "CMDB-import")).toBe(false);
  });

  it("allows a consultant entry to supersede a consultant-verified fact", () => {
    expect(canOverwriteFact(verified, "consultant-entry")).toBe(true);
  });

  it("allows overwrite when no prior fact or the fact is not locked", () => {
    expect(canOverwriteFact(undefined, "carrier-response")).toBe(true);
    expect(canOverwriteFact({ ...verified, verificationState: "provider-claimed", authoritative: false }, "carrier-response")).toBe(true);
  });
});

describe("no operational/monitoring semantics", () => {
  it("registry states are never operational up/down terms", () => {
    const states: RegistryState[] = ["draft", "enterprise-declared", "consultant-verified", "carrier-confirmed", "review-due", "stale", "archived"];
    for (const state of states) expect(isOperationalStateTerm(state)).toBe(false);
  });

  it("a presented site has no `online` field", () => {
    const site = presentSite(buildSeedDataset().sites[0]);
    expect("online" in site).toBe(false);
  });

  it("a critical service has an assurance state and no up/down status", () => {
    const service: CriticalService = {
      id: "svc-1", enterpriseClientId: "e1", engagementId: "eng-1", name: "Payments", description: "",
      serviceOwnerContactId: null, businessFunction: "payments", criticality: "essential", operationalDependency: 5,
      rtoMinutes: 5, rpoMinutes: 0, maximumTolerableOutageMinutes: 60, serviceTier: "T1", assuranceState: "confirmed",
      verificationState: "consultant-verified", evidenceItemIds: [], createdAt: "", updatedAt: "",
    };
    expect("status" in service).toBe(false);
    expect(service.assuranceState).toBe("confirmed");
  });
});

describe("structural separation", () => {
  it("keeps contracted, underlying, and access providers as separate fields", () => {
    const circuit: Circuit = {
      id: "c1", engagementId: "eng-1", siteId: "s1", role: "primary", serviceType: "DIA", serviceIdentifier: "X",
      contractedProviderId: "p-contracted", underlyingProviderId: "p-underlying", accessProviderId: "p-access",
      bandwidthValue: 10, bandwidthUnit: "Gbps", committedRateValue: null, committedRateUnit: null, physicalMedium: "single-mode-fiber",
      handoffType: null, demarcation: null, buildingEntrance: null, riser: null, carrierPop: null, routingType: null,
      ipAddressingSummary: null, sdwanMembership: null, contractStartDate: null, contractEndDate: null, slaAvailability: null,
      verificationState: "unknown", evidenceItemIds: [], notes: "", createdAt: "", updatedAt: "",
    };
    expect(new Set([circuit.contractedProviderId, circuit.underlyingProviderId, circuit.accessProviderId]).size).toBe(3);
  });

  it("requires tenant and engagement ids on seeded sites", () => {
    for (const site of buildSeedDataset().sites) {
      expect(site.tenantId).toBeTruthy();
      expect(site.engagementId).toBeTruthy();
    }
  });
});

describe("supabase mapper name round-trip", () => {
  it("round-trips camelCase <-> snake_case", () => {
    for (const key of ["engagementId", "enterpriseClientId", "lastVerifiedAt", "pendingCarrierRequestCount"]) {
      expect(toCamelCase(toSnakeCase(key))).toBe(key);
    }
  });
});
