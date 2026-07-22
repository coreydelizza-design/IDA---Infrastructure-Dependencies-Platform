import { describe, expect, it } from "vitest";
import {
  ARCHETYPE_WORKLOAD_PRESETS,
  WORKLOADS,
  WORKLOAD_CATEGORIES,
  defaultWorkloadsForArchetype,
  groupWorkloadsByCategory,
  isWorkloadId,
  workloadLabel,
} from "./workloads";

describe("workload catalog", () => {
  it("has unique ids, each in a known category", () => {
    const ids = WORKLOADS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    const categories = new Set(WORKLOAD_CATEGORIES.map((c) => c.id));
    for (const w of WORKLOADS) expect(categories.has(w.category)).toBe(true);
  });

  it("isWorkloadId recognises catalog ids and rejects others", () => {
    expect(isWorkloadId("payment")).toBe(true);
    expect(isWorkloadId("ai-ml")).toBe(true);
    expect(isWorkloadId("nonsense")).toBe(false);
  });

  it("workloadLabel returns the label, or the id as a fallback", () => {
    expect(workloadLabel("voice")).toBe("Voice / VoIP");
    expect(workloadLabel("unknown-x")).toBe("unknown-x");
  });
});

describe("defaultWorkloadsForArchetype", () => {
  it("returns a valid preset for a known archetype", () => {
    const preset = defaultWorkloadsForArchetype("Branch Office");
    expect(preset.length).toBeGreaterThan(0);
    for (const id of preset) expect(isWorkloadId(id)).toBe(true);
    expect(preset).toContain("pos-store");
  });

  it("returns an empty array for an unknown archetype", () => {
    expect(defaultWorkloadsForArchetype("Space Station")).toEqual([]);
  });

  it("every preset references only catalog ids", () => {
    for (const ids of Object.values(ARCHETYPE_WORKLOAD_PRESETS)) {
      for (const id of ids) expect(isWorkloadId(id)).toBe(true);
    }
  });

  it("returns a fresh array (callers can mutate safely)", () => {
    const a = defaultWorkloadsForArchetype("Branch Office");
    a.push("ai-ml"); // not part of the Branch Office preset
    expect(defaultWorkloadsForArchetype("Branch Office")).not.toContain("ai-ml");
  });
});

describe("groupWorkloadsByCategory", () => {
  it("groups selected ids in category order, dropping unknowns and empty categories", () => {
    const groups = groupWorkloadsByCategory(["payment", "voice", "ai-ml", "nonsense"]);
    expect(groups.map((g) => g.category.id)).toEqual(["business", "transactional", "comms"]);
    const business = groups.find((g) => g.category.id === "business");
    expect(business?.items.map((i) => i.id)).toEqual(["ai-ml"]);
  });

  it("returns no groups for an empty selection", () => {
    expect(groupWorkloadsByCategory([])).toEqual([]);
  });
});
