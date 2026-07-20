import { describe, expect, it } from "vitest";
import {
  EXPORT_DISCLAIMER,
  buildRegulatoryExport,
  requirementsForFramework,
  serializeExportCsv,
  serializeExportJson,
  serializeExportMarkdown,
  type BuildExportInput,
  type ExportSiteInput,
} from "./regulatoryExport";

function site(overrides: Partial<ExportSiteInput> = {}): ExportSiteInput {
  return {
    siteId: "site-dc1-london", code: "DC1", name: "London", archetype: "Primary Data Center",
    score: 95, band: "excellent", publicationState: "publishable", provisional: false,
    coveragePercent: 100, evidenceConfidencePercent: 92, registryState: "consultant-verified", openDataGapCount: 0,
    controlOutcomes: { connectivity: "pass", power: "pass", facility: "pass", environment: "pass", security: "pass", workforce: "pass", cyber: "pass", recovery: "pass" },
    ...overrides,
  };
}

function input(sites: ExportSiteInput[], framework: BuildExportInput["framework"] = "DORA"): BuildExportInput {
  return { framework, engagementId: "eng-1", engagementName: "Engagement", enterpriseName: "Enterprise Co.", generatedAt: "2026-07-20", id: "export-1", sites };
}

describe("buildRegulatoryExport", () => {
  it("maps requirements and always carries the not-legal-compliance disclaimer", () => {
    const pkg = buildRegulatoryExport(input([site()]));
    expect(pkg.disclaimer).toBe(EXPORT_DISCLAIMER);
    expect(pkg.disclaimer.toLowerCase()).toContain("not a legal-compliance");
    expect(pkg.sites[0].requirements.length).toBe(requirementsForFramework("DORA").length);
    expect(pkg.sites[0].requirements.every((r) => r.state === "mapped")).toBe(true);
  });

  it("flags a requirement as a gap when a mapped control fails", () => {
    const pkg = buildRegulatoryExport(input([site({ controlOutcomes: { ...site().controlOutcomes, recovery: "fail" } })]));
    const recoveryReq = pkg.sites[0].requirements.find((r) => r.requirementId === "DORA Art. 11");
    expect(recoveryReq?.state).toBe("gap");
    expect(pkg.summary.totalRequirementGaps).toBeGreaterThan(0);
    expect(pkg.summary.sitesWithGaps).toBe(1);
  });

  it("marks a requirement not-applicable when all mapped categories are N/A", () => {
    const pkg = buildRegulatoryExport(input([site({ controlOutcomes: { connectivity: "na" } })], "DORA"));
    const thirdParty = pkg.sites[0].requirements.find((r) => r.requirementId === "DORA Art. 28");
    expect(thirdParty?.state).toBe("not-applicable");
  });

  it("counts provisional sites separately (no legal-compliance claim from a score)", () => {
    const pkg = buildRegulatoryExport(input([site({ provisional: true, publicationState: "provisional" })]));
    expect(pkg.summary.provisionalSites).toBe(1);
    expect(pkg.summary.publishableSites).toBe(0);
  });

  it("supports each framework with its own requirement set", () => {
    for (const fw of ["DORA", "ICT (EU)", "NIS2", "ISO 22301"] as const) {
      expect(requirementsForFramework(fw).length).toBeGreaterThan(0);
      const pkg = buildRegulatoryExport(input([site()], fw));
      expect(pkg.framework).toBe(fw);
    }
  });
});

describe("serializers", () => {
  const pkg = buildRegulatoryExport(input([site()]));

  it("JSON round-trips", () => {
    expect(JSON.parse(serializeExportJson(pkg)).framework).toBe("DORA");
  });

  it("CSV has a header row and one row per site×requirement", () => {
    const csv = serializeExportCsv(pkg).split("\n");
    expect(csv[0]).toContain("requirement_id");
    expect(csv.length).toBe(1 + requirementsForFramework("DORA").length);
  });

  it("Markdown includes the disclaimer and a requirement table", () => {
    const md = serializeExportMarkdown(pkg);
    expect(md).toContain("Control-to-Requirement Mapping");
    expect(md).toContain("NOT a legal-compliance");
    expect(md).toContain("| Requirement | Mapping | Note |");
  });
});
