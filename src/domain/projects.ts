// Project (engagement) summaries for the consultant's Project Inventory.
//
// A consultant works across many projects (engagements), each for one enterprise
// client. The Project Inventory presents them as cards — laid out like the Site
// Inventory — that the consultant clicks into to operate that engagement.

import type { Engagement, EngagementStatus } from "./engagements";
import type { EnterpriseClient } from "./organizations";
import type { SiteRecord } from "./sites";

export interface ProjectSummary {
  engagementId: string;
  enterpriseClientId: string;
  enterpriseName: string;
  name: string;
  code: string;
  status: EngagementStatus;
  scopeStatement: string;
  reviewCadence: string;
  targetCompletionDate: string | null;
  siteCount: number;
  countryCount: number;
  publishableCount: number;
  openRiskCount: number;
  /** 0..1 position along the engagement lifecycle (for a progress indicator). */
  progress: number;
}

/** Ordered engagement lifecycle (draft → closed). Drives the progress metric. */
const LIFECYCLE: EngagementStatus[] = [
  "draft",
  "scoping",
  "data-collection",
  "enterprise-validation",
  "carrier-confirmation",
  "consultant-reconciliation",
  "assessment",
  "published",
  "periodic-review",
  "closed",
];

export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, string> = {
  draft: "Draft",
  scoping: "Scoping",
  "data-collection": "Data Collection",
  "enterprise-validation": "Enterprise Validation",
  "carrier-confirmation": "Carrier Confirmation",
  "consultant-reconciliation": "Reconciliation",
  assessment: "Assessment",
  published: "Published",
  "periodic-review": "Periodic Review",
  closed: "Closed",
  archived: "Archived",
};

export function engagementProgress(status: EngagementStatus): number {
  if (status === "archived") return 1;
  const i = LIFECYCLE.indexOf(status);
  if (i < 0) return 0;
  // "published" and beyond read as complete for the delivery bar.
  const publishedIndex = LIFECYCLE.indexOf("published");
  return Math.min(1, i / publishedIndex);
}

export interface BuildProjectSummariesInput {
  engagements: Engagement[];
  enterprises: EnterpriseClient[];
  sites: SiteRecord[];
}

export function buildProjectSummaries(input: BuildProjectSummariesInput): ProjectSummary[] {
  const enterpriseName = new Map(input.enterprises.map((e) => [e.id, e.name] as const));
  const activeSites = input.sites.filter((s) => s.archivedAt === null);

  return input.engagements
    .filter((e) => e.status !== "archived")
    .map((e) => {
      const sites = activeSites.filter((s) => s.engagementId === e.id);
      const countries = new Set(sites.map((s) => s.countryCode));
      const publishableCount = sites.filter((s) => s.publicationState === "publishable").length;
      const openRiskCount = sites.reduce(
        (sum, s) => sum + (s.cardOpenRiskCount ?? s.risks.filter((r) => r.status !== "closed").length),
        0,
      );
      return {
        engagementId: e.id,
        enterpriseClientId: e.enterpriseClientId,
        enterpriseName: enterpriseName.get(e.enterpriseClientId) ?? "—",
        name: e.name,
        code: e.code,
        status: e.status,
        scopeStatement: e.scopeStatement,
        reviewCadence: e.reviewCadence,
        targetCompletionDate: e.targetCompletionDate,
        siteCount: sites.length,
        countryCount: countries.size,
        publishableCount,
        openRiskCount,
        progress: engagementProgress(e.status),
      };
    });
}
