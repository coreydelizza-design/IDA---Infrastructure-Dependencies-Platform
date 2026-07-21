import { describe, expect, it } from "vitest";
import { LocalStore, SCHEMA_VERSION, createMemoryStorage } from "./localStore";
import { buildSeedDataset, DEMO_CONTRACTS } from "./seed";

const STORAGE_KEY = "ida.registry.v1";

describe("contracts v4 migration", () => {
  it("adds the contracts collection + demo contracts to a pre-v4 install", () => {
    const storage = createMemoryStorage();
    // Simulate a v3 install with no contracts field at all.
    const data = buildSeedDataset();
    delete (data as { contracts?: unknown }).contracts;
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 3, data }));

    const migrated = new LocalStore(storage).initialize(buildSeedDataset);

    expect(Array.isArray(migrated.contracts)).toBe(true);
    for (const c of DEMO_CONTRACTS) expect(migrated.contracts.some((x) => x.id === c.id)).toBe(true);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("does not duplicate contracts already present", () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 3, data: buildSeedDataset() }));
    const migrated = new LocalStore(storage).initialize(buildSeedDataset);
    expect(migrated.contracts.filter((c) => c.id === DEMO_CONTRACTS[0].id).length).toBe(1);
  });
});
