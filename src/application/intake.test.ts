import { describe, expect, it } from "vitest";
import {
  buildIntakeRecords,
  emptyIntakeForm,
  formFromSite,
  newCircuitDraft,
  newDependencyDraft,
  newEvidenceDraft,
  SLIDER_SCALES,
  type IntakeContext,
} from "./intake";
import { buildSeedDataset } from "../infrastructure/local/seed";

const ctx: IntakeContext = {
  siteId: "site-berlin",
  tenantId: "org-ida-consulting",
  enterpriseClientId: "ent-enterprise-co",
  engagementId: "eng-2026-001",
  createdAt: "2026-07-20",
};

function baseForm() {
  const form = emptyIntakeForm();
  form.code = "BR-1002";
  form.name = "Berlin";
  form.city = "Berlin";
  form.countryCode = "DE";
  form.countryName = "Germany";
  form.address = "10 Beispielstrasse";
  form.timezone = "CET (UTC+1)";
  return form;
}

describe("workloads", () => {
  it("seeds the default archetype's workload preset on a blank form", () => {
    const form = emptyIntakeForm();
    expect(form.archetype).toBe("Branch Office");
    expect(form.workloads).toContain("pos-store");
  });

  it("carries workloads onto the site record, filtering unknown ids", () => {
    const form = baseForm();
    form.workloads = ["voice", "payment", "not-a-workload"];
    const out = buildIntakeRecords(form, ctx);
    expect(out.site.workloads).toEqual(["voice", "payment"]);
  });
});

describe("buildIntakeRecords", () => {
  it("creates a carrier data gap for an unknown circuit and no circuit record", () => {
    const form = baseForm();
    form.circuits = [{ ...newCircuitDraft("c1"), knownState: "unknown" }];
    const out = buildIntakeRecords(form, ctx);
    expect(out.circuits).toHaveLength(0);
    expect(out.dataGaps.some((g) => g.requestedFrom === "carrier" && g.fieldPath.includes("contractedProvider"))).toBe(true);
  });

  it("does not fabricate a circuit when a known circuit lacks a contracted provider", () => {
    const form = baseForm();
    form.circuits = [{ ...newCircuitDraft("c1"), knownState: "known", contractedProviderId: "" }];
    const out = buildIntakeRecords(form, ctx);
    expect(out.circuits).toHaveLength(0);
  });

  it("creates a circuit record only when a contracted provider is known", () => {
    const form = baseForm();
    form.circuits = [{ ...newCircuitDraft("c1"), knownState: "known", contractedProviderId: "provider-bt-global-services", underlyingProviderId: "provider-openreach", accessProviderId: "provider-openreach", serviceIdentifier: "BT-BER-1" }];
    const out = buildIntakeRecords(form, ctx);
    expect(out.circuits).toHaveLength(1);
    // contracted / underlying / access remain separate fields.
    expect(out.circuits[0].contractedProviderId).toBe("provider-bt-global-services");
    expect(out.circuits[0].underlyingProviderId).toBe("provider-openreach");
    expect(out.circuits[0].accessProviderId).toBe("provider-openreach");
  });

  it("skips not-applicable circuits without creating gaps or records", () => {
    const form = baseForm();
    form.circuits = [{ ...newCircuitDraft("c1"), knownState: "not-applicable" }];
    const out = buildIntakeRecords(form, ctx);
    expect(out.circuits).toHaveLength(0);
    expect(out.dataGaps.some((g) => g.fieldPath.includes("circuit"))).toBe(false);
  });

  it("raises an enterprise gap for a missing address", () => {
    const form = baseForm();
    form.address = "";
    const out = buildIntakeRecords(form, ctx);
    expect(out.dataGaps.some((g) => g.fieldPath === "address" && g.requestedFrom === "enterprise")).toBe(true);
  });

  it("records dependencies with controlled 1..5 slider values and gaps unknown targets", () => {
    const form = baseForm();
    form.dependencies = [{ ...newDependencyDraft("d1"), targetLabel: "", criticality: 5, substitutability: 4, failureImpact: 5 }];
    const out = buildIntakeRecords(form, ctx);
    expect(out.dependencies[0].criticality).toBe(5);
    expect([1, 2, 3, 4, 5]).toContain(out.dependencies[0].substitutability);
    expect(out.dataGaps.some((g) => g.gapType === "dependency-unknown")).toBe(true);
  });

  it("creates evidence records from evidence drafts", () => {
    const form = baseForm();
    form.evidence = [{ ...newEvidenceDraft("e1"), title: "BT circuit record", source: "BT" }];
    const out = buildIntakeRecords(form, ctx);
    expect(out.evidence).toHaveLength(1);
    expect(out.evidence[0].title).toBe("BT circuit record");
  });

  it("drops a gap classified not-required and accepts an accepted-unknown gap", () => {
    const form = baseForm();
    form.address = "";
    form.dependencies = [{ ...newDependencyDraft("d1"), targetLabel: "" }];
    form.gapDispositions = { address: "not-required", "dependency[0].target": "accepted-unknown" };
    const out = buildIntakeRecords(form, ctx);
    expect(out.dataGaps.some((g) => g.fieldPath === "address")).toBe(false);
    expect(out.dataGaps.find((g) => g.fieldPath === "dependency[0].target")?.status).toBe("accepted-unknown");
  });

  it("preserves id/createdAt and bumps version when editing an existing site", () => {
    const existing = buildSeedDataset().sites[0];
    const form = formFromSite(existing);
    form.name = "London (edited)";
    const out = buildIntakeRecords(form, { ...ctx, siteId: existing.id, existing });
    expect(out.site.id).toBe(existing.id);
    expect(out.site.createdAt).toBe(existing.createdAt);
    expect(out.site.version).toBe(existing.version + 1);
    expect(out.site.name).toBe("London (edited)");
  });

  it("exposes labeled 5-stop slider scales", () => {
    expect(SLIDER_SCALES.businessCriticality).toHaveLength(5);
    expect(SLIDER_SCALES.businessCriticality[4]).toBe("Severe");
    expect(SLIDER_SCALES.substitutability[4]).toBe("Not substitutable");
  });
});
