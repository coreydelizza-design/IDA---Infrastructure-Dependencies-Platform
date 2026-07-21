import { describe, expect, it } from "vitest";
import { LocalStore, SCHEMA_VERSION, createMemoryStorage } from "./localStore";
import { buildSeedDataset } from "./seed";

const STORAGE_KEY = "ida.registry.v1";

describe("governance v5 migration", () => {
  it("adds the customerDecisions collection to a pre-v5 install", () => {
    const storage = createMemoryStorage();
    // Simulate a v4 install with no customerDecisions field at all.
    const data = buildSeedDataset();
    delete (data as { customerDecisions?: unknown }).customerDecisions;
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 4, data }));

    const migrated = new LocalStore(storage).initialize(buildSeedDataset);

    expect(Array.isArray(migrated.customerDecisions)).toBe(true);
    expect(migrated.customerDecisions).toHaveLength(0);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("preserves customer decisions already present", () => {
    const storage = createMemoryStorage();
    const data = buildSeedDataset();
    data.customerDecisions = [
      { id: "d1", engagementId: "eng-2026-001", itemId: "loa:auth-emea-gtt-2026", actionType: "loa-signature", outcome: "approved", note: "", actorRole: "enterprise-sponsor", submittedAt: "2026-07-21T00:00:00.000Z", reconciliationState: "pending-reconciliation" },
    ];
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 4, data }));

    const migrated = new LocalStore(storage).initialize(buildSeedDataset);
    expect(migrated.customerDecisions).toHaveLength(1);
    expect(migrated.customerDecisions[0].id).toBe("d1");
  });
});
