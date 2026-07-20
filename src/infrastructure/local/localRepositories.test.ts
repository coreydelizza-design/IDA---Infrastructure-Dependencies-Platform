import { beforeEach, describe, expect, it } from "vitest";
import { LocalStore, createMemoryStorage, type StorageLike } from "./localStore";
import { buildSeedDataset, CANONICAL_IDS } from "./seed";
import { createLocalRepositories } from "./localRepositories";
import type { SiteRecord } from "../../domain";

function freshStore(storage: StorageLike): LocalStore {
  const store = new LocalStore(storage);
  store.initialize(buildSeedDataset);
  return store;
}

function draftSite(id: string, engagementId = CANONICAL_IDS.ENGAGEMENT_ID): SiteRecord {
  const seed = buildSeedDataset().sites[0];
  return { ...seed, id, code: id.toUpperCase(), name: id, engagementId, favorite: false, archivedAt: null };
}

describe("LocalRegistryRepository — persistence", () => {
  let storage: StorageLike;

  beforeEach(() => {
    storage = createMemoryStorage();
  });

  it("seeds canonical data on first load", async () => {
    const store = freshStore(storage);
    const repos = createLocalRepositories(store);
    const sites = await repos.sites.listByEngagement(CANONICAL_IDS.ENGAGEMENT_ID);
    expect(sites.ok).toBe(true);
    if (sites.ok) {
      expect(sites.value.length).toBe(8);
      expect(sites.value[0].id).toBe("site-dc1-london"); // order + London retained
    }
  });

  it("persists a created site across repository re-instantiation", async () => {
    const repos = createLocalRepositories(freshStore(storage));
    const created = await repos.sites.create(draftSite("site-berlin"));
    expect(created.ok).toBe(true);

    // New store + repositories over the SAME storage backend.
    const reopened = createLocalRepositories(new LocalStore(storage));
    const fetched = await reopened.sites.getById("site-berlin");
    expect(fetched.ok).toBe(true);
  });

  it("does not overwrite user-created records when re-initialized", async () => {
    const store = freshStore(storage);
    const repos = createLocalRepositories(store);
    await repos.sites.create(draftSite("site-user-made"));

    // initialize() again must NOT reseed over existing data.
    const store2 = new LocalStore(storage);
    store2.initialize(buildSeedDataset);
    const repos2 = createLocalRepositories(store2);
    const fetched = await repos2.sites.getById("site-user-made");
    expect(fetched.ok).toBe(true);
  });

  it("archives a site (removed from active registry) and restores it", async () => {
    const repos = createLocalRepositories(freshStore(storage));
    await repos.sites.archive("site-dc1-london");
    const afterArchive = await repos.sites.listByEngagement(CANONICAL_IDS.ENGAGEMENT_ID);
    expect(afterArchive.ok && afterArchive.value.some((s) => s.id === "site-dc1-london")).toBe(false);

    await repos.sites.restore("site-dc1-london");
    const afterRestore = await repos.sites.listByEngagement(CANONICAL_IDS.ENGAGEMENT_ID);
    expect(afterRestore.ok && afterRestore.value.some((s) => s.id === "site-dc1-london")).toBe(true);
  });

  it("scopes sites by engagement", async () => {
    const store = freshStore(storage);
    const repos = createLocalRepositories(store);
    await repos.sites.create(draftSite("site-other-engagement", "eng-other"));
    const scoped = await repos.sites.listByEngagement(CANONICAL_IDS.ENGAGEMENT_ID);
    expect(scoped.ok && scoped.value.every((s) => s.engagementId === CANONICAL_IDS.ENGAGEMENT_ID)).toBe(true);
    expect(scoped.ok && scoped.value.some((s) => s.id === "site-other-engagement")).toBe(false);
  });

  it("switches engagements while scoping engagements to an enterprise", async () => {
    const repos = createLocalRepositories(freshStore(storage));
    const engagements = await repos.engagements.listByEnterprise(CANONICAL_IDS.ENTERPRISE_ID);
    expect(engagements.ok && engagements.value.every((e) => e.enterpriseClientId === CANONICAL_IDS.ENTERPRISE_ID)).toBe(true);
  });

  it("searches sites within an engagement", async () => {
    const repos = createLocalRepositories(freshStore(storage));
    const found = await repos.sites.search(CANONICAL_IDS.ENGAGEMENT_ID, "frankfurt");
    expect(found.ok && found.value.length).toBe(1);
  });

  it("records audit events", async () => {
    const repos = createLocalRepositories(freshStore(storage));
    await repos.audit.append({
      id: "audit-test", engagementId: CANONICAL_IDS.ENGAGEMENT_ID, actorUserId: "u1", actorRole: "consultant",
      entityType: "site", entityId: "site-dc1-london", action: "site-updated", timestamp: "2026-07-20T00:00:00Z",
      beforeSummary: null, afterSummary: "changed", source: "test",
    });
    const events = await repos.audit.listByEngagement(CANONICAL_IDS.ENGAGEMENT_ID);
    expect(events.ok && events.value.some((e) => e.id === "audit-test")).toBe(true);
  });

  it("resetDemoData reseeds after clearing", async () => {
    const store = freshStore(storage);
    const repos = createLocalRepositories(store);
    await repos.sites.create(draftSite("site-temp"));
    store.resetDemoData();
    store.initialize(buildSeedDataset);
    const reopened = createLocalRepositories(store);
    const temp = await reopened.sites.getById("site-temp");
    expect(temp.ok).toBe(false); // gone after reset
    const seeded = await reopened.sites.getById("site-dc1-london");
    expect(seeded.ok).toBe(true);
  });
});
