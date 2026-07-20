import { describe, expect, it } from "vitest";
import {
  carrierResponseConnector,
  classifyClaim,
  cmdbInventoryConnector,
  getConnector,
  reconcileClaim,
  type ConnectorInput,
  type ProposedClaim,
} from "./connectors";
import type { FieldProvenance } from "./provenance";

const input = (payload: string): ConnectorInput => ({
  batchId: "batch-1",
  engagementId: "eng-1",
  sourceName: "Test source",
  receivedAt: "2026-07-20",
  payload,
});

function consultantVerified(fieldPath: string): FieldProvenance {
  return {
    id: "p1", engagementId: "eng-1", entityType: "circuit", entityId: "circuit-dc1-bt", fieldPath,
    sourceType: "consultant-entry", sourceName: "Consultant", sourceRecordId: null, submittedByUserId: "u1",
    observedAt: null, receivedAt: "2026-06-01", verificationState: "consultant-verified", evidenceItemId: null,
    authoritative: true, manuallyOverridden: false, overrideReason: null, supersededAt: null,
  };
}

describe("connectors parse point-in-time payloads into staged claims", () => {
  it("CMDB connector produces staged component claims (not canonical)", () => {
    const claims = cmdbInventoryConnector.parse(input("site-dc1-london,router,Cisco,ASR-9000"));
    expect(claims).toHaveLength(1);
    expect(claims[0].reconciliationStatus).toBe("staged");
    expect(claims[0].entityType).toBe("component");
  });

  it("connectors are point-in-time, never continuous", () => {
    expect(cmdbInventoryConnector.descriptor.continuous).toBe(false);
    expect(getConnector("carrier-response")?.descriptor.continuous).toBe(false);
  });

  it("skips malformed rows without fabricating records", () => {
    const claims = cmdbInventoryConnector.parse(input("# comment\n\nsite-only"));
    expect(claims).toHaveLength(0);
  });
});

describe("reconciliation protects consultant-verified facts", () => {
  const claims: ProposedClaim[] = carrierResponseConnector.parse(input("circuit-dc1-bt,routeVerification,verified"));

  it("flags a carrier claim over a consultant-verified fact as a conflict", () => {
    const classified = classifyClaim(claims[0], consultantVerified("circuit-dc1-bt.routeVerification"));
    expect(classified.reconciliationStatus).toBe("conflict");
  });

  it("stages a claim when no consultant-verified fact exists", () => {
    const classified = classifyClaim(claims[0], undefined);
    expect(classified.reconciliationStatus).toBe("staged");
  });

  it("does not auto-accept a conflict without a consultant supersede", () => {
    const conflict = classifyClaim(claims[0], consultantVerified("circuit-dc1-bt.routeVerification"));
    const accepted = reconcileClaim(conflict, "accept", "u1", "2026-07-20");
    expect(accepted.claim.reconciliationStatus).toBe("conflict"); // unchanged
    expect(accepted.provenance).toBeUndefined();
  });

  it("allows a consultant to supersede a conflict, producing consultant-verified provenance", () => {
    const conflict = classifyClaim(claims[0], consultantVerified("circuit-dc1-bt.routeVerification"));
    const superseded = reconcileClaim(conflict, "supersede", "u1", "2026-07-20");
    expect(superseded.claim.reconciliationStatus).toBe("superseded");
    expect(superseded.provenance?.verificationState).toBe("consultant-verified");
    expect(superseded.provenance?.authoritative).toBe(true);
  });
});

describe("reconciliation decisions", () => {
  const claim = cmdbInventoryConnector.parse(input("site-dc1-london,router,Cisco,ASR-9000"))[0];

  it("accepting a staged claim writes provider-claimed provenance", () => {
    const out = reconcileClaim(claim, "accept", "u1", "2026-07-20");
    expect(out.claim.reconciliationStatus).toBe("accepted");
    expect(out.provenance?.verificationState).toBe("provider-claimed");
    expect(out.provenance?.sourceType).toBe("CMDB-import");
  });

  it("rejecting and holding change status without provenance", () => {
    expect(reconcileClaim(claim, "reject", "u1", "t").claim.reconciliationStatus).toBe("rejected");
    expect(reconcileClaim(claim, "hold", "u1", "t").claim.reconciliationStatus).toBe("held");
    expect(reconcileClaim(claim, "reject", "u1", "t").provenance).toBeUndefined();
  });
});
