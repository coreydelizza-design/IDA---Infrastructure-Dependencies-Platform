import { describe, expect, it } from "vitest";
import { LocalStore, SCHEMA_VERSION, createMemoryStorage } from "./localStore";
import { buildSeedDataset, CANONICAL_IDS } from "./seed";

const STORAGE_KEY = "ida.registry.v1";

describe("branding v2 migration", () => {
  it("backfills the locked wordmark for a pre-v2 seeded enterprise", () => {
    const storage = createMemoryStorage();
    // Simulate a v1 install: seeded data with the branding field stripped.
    const data = buildSeedDataset();
    for (const e of data.enterpriseClients) delete (e as { branding?: unknown }).branding;
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, data }));

    const store = new LocalStore(storage);
    const migrated = store.initialize(buildSeedDataset);

    const seeded = migrated.enterpriseClients.find((e) => e.id === CANONICAL_IDS.ENTERPRISE_ID);
    expect(seeded?.branding).toEqual({ brandName: "ResiliLink", productLabel: "Site Resiliency Registry", logoUrl: null, logoAlt: "" });
    // Version is persisted so the migration only runs once.
    const persisted = JSON.parse(storage.getItem(STORAGE_KEY)!);
    expect(persisted.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("does not overwrite branding a user already customised", () => {
    const storage = createMemoryStorage();
    const data = buildSeedDataset();
    const custom = { brandName: "Acme Bank", productLabel: "Dependency Assurance", logoUrl: null, logoAlt: "" };
    data.enterpriseClients[0].branding = { ...custom };
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, data }));

    const store = new LocalStore(storage);
    const migrated = store.initialize(buildSeedDataset);

    expect(migrated.enterpriseClients[0].branding).toEqual(custom);
  });
});
