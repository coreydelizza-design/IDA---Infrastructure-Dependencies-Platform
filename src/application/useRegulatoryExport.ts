import { useCallback, useState } from "react";
import { useRegistry } from "./registryContext";
import {
  buildRegulatoryExport,
  getAssessmentProfile,
  serializeExportCsv,
  serializeExportJson,
  serializeExportMarkdown,
  type AuditEvent,
  type CategoryOutcome,
  type ControlCategory,
  type ControlOutcome,
  type ExportSiteInput,
  type RegulatoryExportPackage,
  type RegulatoryFramework,
} from "../domain";

const OUTCOME_MAP: Record<ControlOutcome, CategoryOutcome> = {
  pass: "pass",
  partial: "partial",
  fail: "fail",
  "not-applicable": "na",
  unassessed: "unknown",
};

function audit(engagementId: string, entityId: string, after: string): AuditEvent {
  return { id: `audit-export-${entityId}-${Date.now()}`, engagementId, actorUserId: "user-consultant-1", actorRole: "compliance-analyst", entityType: "regulatory-export", entityId, action: "assessment-status-changed", timestamp: new Date().toISOString(), beforeSummary: null, afterSummary: after, source: "regulatory-export" };
}

function download(filename: string, content: string, mime: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const EXPORT_FRAMEWORKS: RegulatoryFramework[] = ["DORA", "ICT (EU)", "NIS2", "ISO 22301"];

export function useRegulatoryExport() {
  const registry = useRegistry();
  const [pkg, setPkg] = useState<RegulatoryExportPackage | null>(null);
  const [busy, setBusy] = useState(false);

  const generate = useCallback(
    async (framework: RegulatoryFramework) => {
      if (busy) return;
      setBusy(true);
      try {
        const engagementId = registry.currentEngagement?.id ?? "";
        const inputs: ExportSiteInput[] = [];
        for (const site of registry.siteRecords) {
          const profile = getAssessmentProfile(site.archetypeId);
          const categoryById = new Map(profile.controls.map((c) => [c.id, c.category] as const));
          const res = await registry.repositories.assessments.listControlResults(site.id);
          const controlOutcomes: Partial<Record<ControlCategory, CategoryOutcome>> = {};
          if (res.ok) {
            for (const r of res.value) {
              const category = categoryById.get(r.controlId);
              if (category) controlOutcomes[category] = OUTCOME_MAP[r.outcome];
            }
          }
          inputs.push({
            siteId: site.id,
            code: site.code,
            name: site.name,
            archetype: site.archetypeId,
            score: site.score.score,
            band: site.score.band,
            publicationState: site.publicationState,
            provisional: site.score.provisional,
            coveragePercent: site.completenessPercent,
            evidenceConfidencePercent: site.evidenceConfidencePercent,
            registryState: site.registryState,
            openDataGapCount: site.openDataGapCount,
            controlOutcomes,
          });
        }
        const built = buildRegulatoryExport({
          framework,
          engagementId,
          engagementName: registry.currentEngagement?.name ?? "—",
          enterpriseName: registry.currentEnterprise?.name ?? "—",
          generatedAt: new Date().toISOString(),
          id: `export-${framework}-${Date.now()}`,
          sites: inputs,
        });
        await registry.repositories.audit.append(audit(engagementId, built.id, `${framework} mapping · ${built.scopeSiteCount} sites · ${built.summary.totalRequirementGaps} gaps`));
        setPkg(built);
      } finally {
        setBusy(false);
      }
    },
    [registry, busy],
  );

  const slug = (framework: string) => framework.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");

  const downloadMarkdown = useCallback(() => { if (pkg) download(`${slug(pkg.framework)}-mapping.md`, serializeExportMarkdown(pkg), "text/markdown"); }, [pkg]);
  const downloadJson = useCallback(() => { if (pkg) download(`${slug(pkg.framework)}-mapping.json`, serializeExportJson(pkg), "application/json"); }, [pkg]);
  const downloadCsv = useCallback(() => { if (pkg) download(`${slug(pkg.framework)}-mapping.csv`, serializeExportCsv(pkg), "text/csv"); }, [pkg]);

  return { frameworks: EXPORT_FRAMEWORKS, pkg, busy, generate, downloadMarkdown, downloadJson, downloadCsv };
}
