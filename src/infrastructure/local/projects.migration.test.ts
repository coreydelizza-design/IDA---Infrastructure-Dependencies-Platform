import { describe, expect, it } from "vitest";
import { LocalStore, SCHEMA_VERSION, createMemoryStorage } from "./localStore";
import { buildSeedDataset, DEMO_ENGAGEMENTS, DEMO_ENTERPRISES } from "./seed";

const STORAGE_KEY = "ida.registry.v1";

describe("demo-portfolio v3 migration", () => {
  it("injects the demo enterprises + engagements into a pre-v3 install", () => {
    const storage = createMemoryStorage();
    // Simulate a v2 install: canonical seed with the demo portfolio stripped out.
    const data = buildSeedDataset();
    data.enterpriseClients = data.enterpriseClients.filter((e) => !DEMO_ENTERPRISES.some((d) => d.id === e.id));
    data.engagements = data.engagements.filter((e) => !DEMO_ENGAGEMENTS.some((d) => d.id === e.id));
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 2, data }));

    const migrated = new LocalStore(storage).initialize(buildSeedDataset);

    for (const d of DEMO_ENTERPRISES) expect(migrated.enterpriseClients.some((e) => e.id === d.id)).toBe(true);
    for (const d of DEMO_ENGAGEMENTS) expect(migrated.engagements.some((e) => e.id === d.id)).toBe(true);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("does not duplicate demo records already present", () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 2, data: buildSeedDataset() }));
    const migrated = new LocalStore(storage).initialize(buildSeedDataset);
    const count = migrated.engagements.filter((e) => e.id === DEMO_ENGAGEMENTS[0].id).length;
    expect(count).toBe(1);
  });
});
