// Customer dashboard metrics — a point-in-time, leadership-facing summary of the
// engagement's registry. Read-only, computed from the assessed sites (never a
// live/operational reading; see AGENTS.md).

import type { HealthBand } from "./models";
import { bandForScore } from "./scoring";
import type { SiteRecord } from "./sites";

export interface AttentionSite {
  id: string;
  code: string;
  name: string;
  location: string;
  band: HealthBand;
  score: number;
  openRiskCount: number;
  reason: string;
}

export interface DashboardMetrics {
  siteCount: number;
  countryCount: number;
  averageAssurance: number;
  averageBand: HealthBand;
  averageLabel: string;
  bands: Record<HealthBand, number>;
  publishableCount: number;
  provisionalCount: number;
  openCriticalRiskCount: number;
  totalOpenRiskCount: number;
  averageEvidenceConfidence: number;
  assessmentCoveragePercent: number;
  attention: AttentionSite[];
}

const BAND_SEVERITY: Record<HealthBand, number> = { critical: 0, "at-risk": 1, good: 2, excellent: 3 };

function openRiskCount(site: SiteRecord): number {
  return site.cardOpenRiskCount ?? site.risks.filter((r) => r.status !== "closed").length;
}

export function buildDashboard(sites: SiteRecord[]): DashboardMetrics {
  const bands: Record<HealthBand, number> = { excellent: 0, good: 0, "at-risk": 0, critical: 0 };
  const countries = new Set<string>();
  let scoreSum = 0;
  let evidenceSum = 0;
  let coverageSum = 0;
  let publishableCount = 0;
  let provisionalCount = 0;
  let openCriticalRiskCount = 0;
  let totalOpenRiskCount = 0;

  for (const site of sites) {
    bands[site.score.band] += 1;
    countries.add(site.countryCode);
    scoreSum += site.score.score;
    evidenceSum += site.evidenceConfidencePercent;
    coverageSum += site.completenessPercent;
    if (site.publicationState === "publishable" && !site.score.provisional) publishableCount += 1;
    else provisionalCount += 1;
    totalOpenRiskCount += openRiskCount(site);
    openCriticalRiskCount += site.risks.filter((r) => r.status !== "closed" && (r.severity === "critical" || r.severity === "high")).length;
  }

  const n = sites.length || 1;
  const averageAssurance = sites.length ? Math.round(scoreSum / sites.length) : 0;
  const avgBand = bandForScore(averageAssurance);

  const attention: AttentionSite[] = sites
    .filter((s) => s.score.band === "critical" || s.score.band === "at-risk" || openRiskCount(s) > 0)
    .sort((a, b) => BAND_SEVERITY[a.score.band] - BAND_SEVERITY[b.score.band] || openRiskCount(b) - openRiskCount(a))
    .slice(0, 6)
    .map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      location: [s.city, s.countryCode].filter(Boolean).join(", "),
      band: s.score.band,
      score: s.score.score,
      openRiskCount: openRiskCount(s),
      reason: s.score.band === "critical" || s.score.band === "at-risk" ? `${s.score.label} assurance` : "Open risks",
    }));

  return {
    siteCount: sites.length,
    countryCount: countries.size,
    averageAssurance,
    averageBand: avgBand.band,
    averageLabel: avgBand.label,
    bands,
    publishableCount,
    provisionalCount,
    openCriticalRiskCount,
    totalOpenRiskCount,
    averageEvidenceConfidence: Math.round(evidenceSum / n),
    assessmentCoveragePercent: Math.round(coverageSum / n),
    attention,
  };
}
