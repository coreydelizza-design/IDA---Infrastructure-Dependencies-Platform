import { describe, expect, it } from "vitest";
import { contractStatusTone, summarizeContracts, type Contract } from "./contracts";

const NOW = "2026-07-21T00:00:00.000Z";
function contract(over: Partial<Contract>): Contract {
  return { id: "c", enterpriseClientId: "e", engagementId: null, type: "msa", title: "MSA", reference: "R", status: "active", counterparty: "Co", effectiveDate: null, expirationDate: null, documentName: null, notes: "", createdAt: NOW, updatedAt: NOW, ...over };
}

describe("summarizeContracts", () => {
  it("counts active MSAs, expiring, and drafts/in-review", () => {
    const s = summarizeContracts([
      contract({ id: "1", type: "msa", status: "active" }),
      contract({ id: "2", type: "msa", status: "expiring" }),
      contract({ id: "3", type: "sow", status: "active" }),
      contract({ id: "4", type: "nda", status: "draft" }),
      contract({ id: "5", type: "dpa", status: "in-review" }),
    ]);
    expect(s.total).toBe(5);
    expect(s.activeMsaCount).toBe(1); // only the active MSA (not the SOW, not the expiring MSA)
    expect(s.expiringCount).toBe(1);
    expect(s.draftCount).toBe(2);
  });
});

describe("contractStatusTone", () => {
  it("maps status to a tone bucket", () => {
    expect(contractStatusTone("active")).toBe("green");
    expect(contractStatusTone("expiring")).toBe("amber");
    expect(contractStatusTone("draft")).toBe("amber");
    expect(contractStatusTone("expired")).toBe("red");
    expect(contractStatusTone("terminated")).toBe("red");
  });
});
