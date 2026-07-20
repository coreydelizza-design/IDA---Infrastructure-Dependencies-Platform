// Regulatory export.
//
// Produces a POINT-IN-TIME control-to-requirement mapping package for a
// framework (DORA / ICT (EU) / NIS2 / ISO 22301). This is a MAPPING, not a
// legal-compliance determination — a site score never implies legal compliance
// (see AGENTS.md / docs). Every package carries an explicit disclaimer.

import type { ControlCategory } from "./assessment";
import type { HealthBand, PublicationState } from "./models";
import type { RegistryState } from "./siteStates";

export type RegulatoryFramework = "DORA" | "ICT (EU)" | "NIS2" | "ISO 22301";

export const EXPORT_DISCLAIMER =
  "This package is a point-in-time control-to-requirement MAPPING derived from the assurance registry. " +
  "It is NOT a legal-compliance determination and does not certify compliance with any framework. " +
  "Architecture assurance scores describe documented, evidenced architecture at a point in time and never " +
  "imply legal compliance. Legal compliance is determined by the enterprise and its advisors.";

export interface RequirementDefinition {
  framework: RegulatoryFramework;
  requirementId: string;
  title: string;
  /** Neutral control categories this requirement maps to. */
  neutralCategories: ControlCategory[];
}

const REQUIREMENTS: RequirementDefinition[] = [
  // DORA (Digital Operational Resilience Act) — illustrative articles.
  { framework: "DORA", requirementId: "DORA Art. 6", title: "ICT risk management framework", neutralCategories: ["cyber", "recovery"] },
  { framework: "DORA", requirementId: "DORA Art. 9", title: "Protection and prevention", neutralCategories: ["cyber", "security", "power"] },
  { framework: "DORA", requirementId: "DORA Art. 11", title: "Response and recovery", neutralCategories: ["recovery"] },
  { framework: "DORA", requirementId: "DORA Art. 12", title: "Backup, restoration and recovery", neutralCategories: ["recovery"] },
  { framework: "DORA", requirementId: "DORA Art. 28", title: "ICT third-party risk", neutralCategories: ["connectivity"] },
  // ICT (EU)
  { framework: "ICT (EU)", requirementId: "ICT R1", title: "ICT resilience and redundancy", neutralCategories: ["connectivity", "power"] },
  { framework: "ICT (EU)", requirementId: "ICT R2", title: "Facility and environmental controls", neutralCategories: ["facility", "environment"] },
  { framework: "ICT (EU)", requirementId: "ICT R3", title: "Recovery capability", neutralCategories: ["recovery"] },
  { framework: "ICT (EU)", requirementId: "ICT R4", title: "Third-party/provider assurance", neutralCategories: ["connectivity"] },
  // NIS2
  { framework: "NIS2", requirementId: "NIS2 Art. 21(2)(a)", title: "Risk analysis & security of systems", neutralCategories: ["cyber", "security"] },
  { framework: "NIS2", requirementId: "NIS2 Art. 21(2)(c)", title: "Business continuity & backup", neutralCategories: ["recovery"] },
  { framework: "NIS2", requirementId: "NIS2 Art. 21(2)(d)", title: "Supply chain security", neutralCategories: ["connectivity"] },
  { framework: "NIS2", requirementId: "NIS2 Art. 21(2)(f)", title: "Physical & environmental security", neutralCategories: ["facility", "environment", "security"] },
  // ISO 22301 (Business Continuity)
  { framework: "ISO 22301", requirementId: "ISO 22301 §8.4", title: "Business continuity strategies", neutralCategories: ["recovery", "connectivity"] },
  { framework: "ISO 22301", requirementId: "ISO 22301 §8.4.3", title: "Resource & infrastructure resilience", neutralCategories: ["power", "facility", "environment"] },
  { framework: "ISO 22301", requirementId: "ISO 22301 §8.5", title: "Exercising and testing (evidence)", neutralCategories: ["recovery"] },
];

export function requirementsForFramework(framework: RegulatoryFramework): RequirementDefinition[] {
  return REQUIREMENTS.filter((r) => r.framework === framework);
}

export type CategoryOutcome = "pass" | "partial" | "fail" | "na" | "unknown";
export type RequirementMappingState = "mapped" | "gap" | "not-applicable" | "unknown";

export interface ExportSiteInput {
  siteId: string;
  code: string;
  name: string;
  archetype: string;
  score: number;
  band: HealthBand;
  publicationState: PublicationState;
  provisional: boolean;
  coveragePercent: number;
  evidenceConfidencePercent: number;
  registryState: RegistryState;
  openDataGapCount: number;
  controlOutcomes: Partial<Record<ControlCategory, CategoryOutcome>>;
}

export interface RequirementResult {
  requirementId: string;
  title: string;
  state: RequirementMappingState;
  note: string;
}

export interface ExportSiteEntry extends RequirementResultCarrier {
  siteId: string;
  code: string;
  name: string;
  archetype: string;
  score: number;
  band: HealthBand;
  publicationState: PublicationState;
  provisional: boolean;
  coveragePercent: number;
  evidenceConfidencePercent: number;
  registryState: RegistryState;
  openDataGapCount: number;
}
interface RequirementResultCarrier {
  requirements: RequirementResult[];
}

export interface RegulatoryExportPackage {
  id: string;
  framework: RegulatoryFramework;
  engagementId: string;
  engagementName: string;
  enterpriseName: string;
  generatedAt: string;
  scopeSiteCount: number;
  disclaimer: string;
  summary: {
    averageScore: number;
    publishableSites: number;
    provisionalSites: number;
    sitesWithGaps: number;
    totalRequirementGaps: number;
  };
  sites: ExportSiteEntry[];
}

function evaluateRequirement(def: RequirementDefinition, outcomes: ExportSiteInput["controlOutcomes"]): RequirementResult {
  const cats = def.neutralCategories.map((c) => outcomes[c] ?? "unknown");
  let state: RequirementMappingState;
  let note: string;
  if (cats.length > 0 && cats.every((o) => o === "na")) {
    state = "not-applicable";
    note = "Not applicable to this archetype.";
  } else if (cats.includes("fail")) {
    state = "gap";
    note = "One or more mapped controls are not satisfied.";
  } else if (cats.includes("unknown")) {
    state = "unknown";
    note = "Mapped controls not yet assessed.";
  } else {
    state = "mapped";
    note = "Mapped controls satisfied (partial credit where applicable).";
  }
  return { requirementId: def.requirementId, title: def.title, state, note };
}

export interface BuildExportInput {
  framework: RegulatoryFramework;
  engagementId: string;
  engagementName: string;
  enterpriseName: string;
  generatedAt: string;
  id: string;
  sites: ExportSiteInput[];
}

export function buildRegulatoryExport(input: BuildExportInput): RegulatoryExportPackage {
  const defs = requirementsForFramework(input.framework);
  const sites: ExportSiteEntry[] = input.sites.map((site) => ({
    siteId: site.siteId,
    code: site.code,
    name: site.name,
    archetype: site.archetype,
    score: site.score,
    band: site.band,
    publicationState: site.publicationState,
    provisional: site.provisional,
    coveragePercent: site.coveragePercent,
    evidenceConfidencePercent: site.evidenceConfidencePercent,
    registryState: site.registryState,
    openDataGapCount: site.openDataGapCount,
    requirements: defs.map((def) => evaluateRequirement(def, site.controlOutcomes)),
  }));

  const totalRequirementGaps = sites.reduce((sum, s) => sum + s.requirements.filter((r) => r.state === "gap").length, 0);
  const averageScore = sites.length ? Math.round(sites.reduce((sum, s) => sum + s.score, 0) / sites.length) : 0;

  return {
    id: input.id,
    framework: input.framework,
    engagementId: input.engagementId,
    engagementName: input.engagementName,
    enterpriseName: input.enterpriseName,
    generatedAt: input.generatedAt,
    scopeSiteCount: sites.length,
    disclaimer: EXPORT_DISCLAIMER,
    summary: {
      averageScore,
      publishableSites: sites.filter((s) => s.publicationState === "publishable" && !s.provisional).length,
      provisionalSites: sites.filter((s) => s.provisional || s.publicationState !== "publishable").length,
      sitesWithGaps: sites.filter((s) => s.requirements.some((r) => r.state === "gap")).length,
      totalRequirementGaps,
    },
    sites,
  };
}

// --- Serializers ------------------------------------------------------------

export function serializeExportJson(pkg: RegulatoryExportPackage): string {
  return JSON.stringify(pkg, null, 2);
}

export function serializeExportCsv(pkg: RegulatoryExportPackage): string {
  const header = ["site_code", "site_name", "archetype", "assurance_score", "publication_state", "requirement_id", "requirement_title", "mapping_state"];
  const lines = [header.join(",")];
  for (const site of pkg.sites) {
    for (const req of site.requirements) {
      lines.push([
        site.code, csv(site.name), csv(site.archetype), String(site.score), site.publicationState,
        req.requirementId, csv(req.title), req.state,
      ].join(","));
    }
  }
  return lines.join("\n");
}

function csv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function serializeExportMarkdown(pkg: RegulatoryExportPackage): string {
  const lines: string[] = [];
  lines.push(`# ${pkg.framework} — Control-to-Requirement Mapping`);
  lines.push("");
  lines.push(`**Enterprise:** ${pkg.enterpriseName}  `);
  lines.push(`**Engagement:** ${pkg.engagementName}  `);
  lines.push(`**Generated:** ${pkg.generatedAt}  `);
  lines.push(`**Scope:** ${pkg.scopeSiteCount} site(s)`);
  lines.push("");
  lines.push(`> ⚠️ ${pkg.disclaimer}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Average architecture assurance: **${pkg.summary.averageScore}**`);
  lines.push(`- Publishable (assessed) sites: **${pkg.summary.publishableSites}**`);
  lines.push(`- Provisional / not-yet-publishable sites: **${pkg.summary.provisionalSites}**`);
  lines.push(`- Sites with requirement gaps: **${pkg.summary.sitesWithGaps}**`);
  lines.push(`- Total requirement gaps: **${pkg.summary.totalRequirementGaps}**`);
  lines.push("");
  for (const site of pkg.sites) {
    lines.push(`## ${site.code} — ${site.name}`);
    lines.push("");
    lines.push(`Archetype: ${site.archetype} · Assurance: ${site.score} (${site.band})${site.provisional ? " · **provisional**" : ""} · Coverage: ${site.coveragePercent}% · Evidence: ${site.evidenceConfidencePercent}% · Open data gaps: ${site.openDataGapCount}`);
    lines.push("");
    lines.push("| Requirement | Mapping | Note |");
    lines.push("| --- | --- | --- |");
    for (const req of site.requirements) {
      lines.push(`| ${req.requirementId} — ${req.title} | ${req.state} | ${req.note} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
