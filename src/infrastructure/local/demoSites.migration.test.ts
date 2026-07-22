import { describe, expect, it } from "vitest";
import { LocalStore, SCHEMA_VERSION, createMemoryStorage } from "./localStore";
import { buildSeedDataset, DEMO_ENGAGEMENTS, DEMO_SITES } from "./seed";
import { buildProjectSummaries } from "../../domain";

const STORAGE_KEY = "ida.registry.v1";
const CANONICAL_ENGAGEMENT = "eng-2026-001";

describe("demo-portfolio sites", () => {
  it("seeds every demo engagement with at least one site (and none onto the canonical estate)", () => {
    const engIds = new Set(DEMO_ENGAGEMENTS.map((e) => e.id));
    for (const s of DEMO_SITES) {
      expect(engIds.has(s.engagementId)).toBe(true);
      expect(s.engagementId).not.toBe(CANONICAL_ENGAGEMENT);
    }
    for (const eng of DEMO_ENGAGEMENTS) {
      expect(DEMO_SITES.some((s) => s.engagementId === eng.id)).toBe(true);
    }
  });

  it("gives every project in the inventory a non-empty site count", () => {
    const data = buildSeedDataset();
    const summaries = buildProjectSummaries({ engagements: data.engagements, enterprises: data.enterpriseClients, sites: data.sites });
    for (const p of summaries) {
      expect(p.siteCount).toBeGreaterThan(0);
    }
  });

  it("leaves the canonical estate's site count unchanged (locked default render)", () => {
    const data = buildSeedDataset();
    const canonical = data.sites.filter((s) => s.engagementId === CANONICAL_ENGAGEMENT);
    // The eight locked canonical sites; demo sites live on other engagements only.
    expect(canonical).toHaveLength(8);
    expect(canonical.some((s) => s.id === "site-dc1-london")).toBe(true);
  });
});

describe("demo-portfolio v6 migration", () => {
  it("injects demo sites + artifacts into a pre-v6 install", () => {
    const storage = createMemoryStorage();
    const data = buildSeedDataset();
    // Simulate a v5 install with only the canonical estate.
    data.sites = data.sites.filter((s) => s.engagementId === CANONICAL_ENGAGEMENT);
    data.assuranceSnapshots = data.assuranceSnapshots.filter((s) => data.sites.some((x) => x.id === s.siteId));
    data.controlResults = data.controlResults.filter((c) => data.sites.some((x) => x.id === c.siteId));
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 5, data }));

    const migrated = new LocalStore(storage).initialize(buildSeedDataset);

    for (const s of DEMO_SITES) expect(migrated.sites.some((x) => x.id === s.id)).toBe(true);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("does not duplicate demo sites already present", () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 5, data: buildSeedDataset() }));
    const migrated = new LocalStore(storage).initialize(buildSeedDataset);
    expect(migrated.sites.filter((s) => s.id === DEMO_SITES[0].id)).toHaveLength(1);
  });
});

describe("workloads v7 migration", () => {
  it("backfills workloads: canonical sites empty, demo sites get their presets", () => {
    const storage = createMemoryStorage();
    // Simulate a v6 install where sites have no workloads field.
    const data = buildSeedDataset();
    for (const s of data.sites) delete (s as { workloads?: unknown }).workloads;
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 6, data }));

    const migrated = new LocalStore(storage).initialize(buildSeedDataset);

    for (const s of migrated.sites) expect(Array.isArray(s.workloads)).toBe(true);
    // Canonical London stays empty; a demo site gets its preset back.
    expect(migrated.sites.find((s) => s.id === "site-dc1-london")?.workloads).toEqual([]);
    const demo = DEMO_SITES[0];
    expect(migrated.sites.find((s) => s.id === demo.id)?.workloads).toEqual(demo.workloads);
    expect(demo.workloads.length).toBeGreaterThan(0);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).schemaVersion).toBe(SCHEMA_VERSION);
  });
});
