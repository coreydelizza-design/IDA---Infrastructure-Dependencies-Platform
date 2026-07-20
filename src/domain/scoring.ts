import type { HealthBand, ScoreSnapshot, ScoringControlInput, ScoringProfile } from "./models";

const RESULT_FACTOR: Record<ScoringControlInput["result"], number> = {
  pass: 1,
  partial: 0.55,
  fail: 0,
  "not-applicable": 1,
};

export interface ScoreSiteInput {
  controls: ScoringControlInput[];
  profile: ScoringProfile;
  singleSiteApproved: boolean;
  assessedAt: string;
  /** Provisional unless derived from stored control results (see Phase 1). */
  provisional?: boolean;
}

export function bandForScore(score: number): { band: HealthBand; label: string } {
  if (score >= 85) return { band: "excellent", label: "Excellent" };
  if (score >= 70) return { band: "good", label: "Good" };
  if (score >= 40) return { band: "at-risk", label: "At Risk" };
  return { band: "critical", label: "Critical" };
}

export function computeResilienceScore(input: ScoreSiteInput): ScoreSnapshot {
  const normalizedControls = input.controls.map((control) => {
    const singleSiteExceptionApplies =
      control.isConnectivityDiversityControl === true &&
      input.profile.redundancyExpectation === "acceptable-single" &&
      input.singleSiteApproved;

    return singleSiteExceptionApplies
      ? { ...control, result: "not-applicable" as const }
      : control;
  });

  const totalWeight = normalizedControls.reduce((sum, control) => sum + control.weight, 0);
  const earnedWeight = normalizedControls.reduce(
    (sum, control) => sum + control.weight * RESULT_FACTOR[control.result],
    0,
  );

  let score = totalWeight === 0 ? 100 : Math.round((earnedWeight / totalWeight) * 100);

  for (const cap of input.profile.criticalCaps) {
    const control = normalizedControls.find((candidate) => candidate.id === cap.controlId);
    if (control?.result === "fail") score = Math.min(score, cap.maxScore);
  }

  const band = bandForScore(score);
  const technicalGapRetained = normalizedControls.some(
    (control) => control.result === "fail" && !control.isConnectivityDiversityControl,
  );

  return {
    score,
    ...band,
    profileVersion: input.profile.version,
    assessedAt: input.assessedAt,
    singleSiteApproved: input.singleSiteApproved,
    technicalGapRetained,
    provisional: input.provisional ?? true,
  };
}

export function scoreColorClass(band: HealthBand): string {
  return `health-${band}`;
}
