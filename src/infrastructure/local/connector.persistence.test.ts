import { describe, expect, it } from "vitest";
import { LocalStore, createMemoryStorage } from "./localStore";
import { buildSeedDataset, CANONICAL_IDS } from "./seed";
import { createLocalRepositories } from "./localRepositories";
import { classifyClaim, cmdbInventoryConnector, reconcileClaim, type ImportBatch } from "../../domain";

function repos() {
  const store = new LocalStore(createMemoryStorage());
  store.initialize(buildSeedDataset);
  return createLocalRepositories(store);
}

const ENG = CANONICAL_IDS.ENGAGEMENT_ID;

async function stageOne(r: ReturnType<typeof repos>) {
  const parsed = cmdbInventoryConnector.parse({ batchId: "b1", engagementId: ENG, sourceName: "CMDB", receivedAt: "2026-07-20", payload: "site-dc1-london,router,Cisco,ASR-9000" });
  const claims = parsed.map((c) => classifyClaim(c, undefined));
  const batch: ImportBatch = { id: "b1", engagementId: ENG, connectorKind: "cmdb-inventory", sourceName: "CMDB", receivedAt: "2026-07-20", claimCount: claims.length, status: "staged" };
  await r.connectors.stageImport(batch, claims);
  return claims[0];
}

describe("connector persistence + reconciliation", () => {
  it("stages proposed claims without creating canonical records", async () => {
    const r = repos();
    const beforeComponents = await r.components.listByEngagement(ENG);
    await stageOne(r);
    const claims = await r.connectors.listClaims(ENG);
    const afterComponents = await r.components.listByEngagement(ENG);
    expect(claims.ok && claims.value.length).toBe(1);
    expect(claims.ok && claims.value[0].reconciliationStatus).toBe("staged");
    // No canonical component was created by staging.
    expect(afterComponents.ok && afterComponents.value.length).toBe(beforeComponents.ok ? beforeComponents.value.length : -1);
  });

  it("accepting a claim persists provenance and updates the claim", async () => {
    const r = repos();
    const claim = await stageOne(r);
    const outcome = reconcileClaim(claim, "accept", "u1", "2026-07-20");
    await r.connectors.updateClaim(outcome.claim);
    if (outcome.provenance) await r.connectors.saveProvenance(outcome.provenance);

    const claims = await r.connectors.listClaims(ENG);
    expect(claims.ok && claims.value[0].reconciliationStatus).toBe("accepted");
    const prov = await r.connectors.findProvenance(claim.entityType, claim.fieldPath);
    expect(prov.ok && prov.value?.verificationState).toBe("provider-claimed");
  });

  it("classifies a later carrier claim over a consultant-verified fact as a conflict", async () => {
    const r = repos();
    const claim = await stageOne(r);
    // Consultant supersedes -> writes consultant-verified provenance.
    const superseded = reconcileClaim({ ...claim, reconciliationStatus: "staged" }, "supersede", "u1", "2026-07-20");
    if (superseded.provenance) await r.connectors.saveProvenance(superseded.provenance);
    const existing = await r.connectors.findProvenance(claim.entityType, claim.fieldPath);
    const next = classifyClaim({ ...claim, id: "c2", sourceType: "carrier-response" }, existing.ok ? (existing.value ?? undefined) : undefined);
    expect(next.reconciliationStatus).toBe("conflict");
  });
});
