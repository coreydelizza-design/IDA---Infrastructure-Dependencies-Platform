import { describe, expect, it } from "vitest";
import { LocalStore, createMemoryStorage } from "./localStore";
import { buildSeedDataset, CANONICAL_IDS } from "./seed";
import { createLocalRepositories } from "./localRepositories";
import { assessSite, getAssessmentProfile, snapshotFromResult } from "../../domain";

function repos() {
  const store = new LocalStore(createMemoryStorage());
  store.initialize(buildSeedDataset);
  return createLocalRepositories(store);
}

describe("assessment persistence + seed artifacts", () => {
  it("seeds stored control results and a published snapshot per site", async () => {
    const r = repos();
    const results = await r.assessments.listControlResults("site-dc1-london");
    expect(results.ok && results.value.length).toBe(8);
    const snapshot = await r.assessments.latestSnapshot("site-dc1-london");
    expect(snapshot.ok && snapshot.value?.architectureAssuranceScore).toBe(95);
  });

  it("marks seeded scores as non-provisional (assessment-backed)", () => {
    const site = buildSeedDataset().sites.find((s) => s.id === "site-dc1-london")!;
    expect(site.score.provisional).toBe(false);
    expect(site.assessmentStatus).toBe("published");
  });

  it("re-running the engine on stored control results persists a new snapshot", async () => {
    const r = repos();
    const site = (await r.sites.getById("site-edge-25-madrid"));
    expect(site.ok).toBe(true);
    if (!site.ok) return;
    const controls = await r.assessments.listControlResults(site.value.id);
    const profile = getAssessmentProfile(site.value.archetypeId);
    const result = assessSite(profile, controls.ok ? controls.value : [], { singleSiteApproved: false, assessedAt: "now" });
    const snap = snapshotFromResult("snap-x", site.value.engagementId, site.value.id, result, "2026-07-20T00:00:00Z");
    await r.assessments.saveSnapshot(snap);
    const all = await r.assessments.listSnapshots(site.value.id);
    expect(all.ok && all.value.length).toBe(2); // seeded + new
    // engine produced a real, non-provisional result
    expect(result.provisional).toBe(false);
    expect(typeof result.architectureAssuranceScore).toBe("number");
  });
});
