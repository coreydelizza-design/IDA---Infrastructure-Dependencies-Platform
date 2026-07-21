// Governed customer actions.
//
// The enterprise customer participates without editing canonical facts. Governed
// actions (signing an LOA, accepting/declining a risk) record a CustomerDecision
// — an APPROVAL/INPUT record — that flows to the consultant for reconciliation.
// The canonical authorization/risk is unchanged until the consultant reconciles.

import type { EnterpriseAuthorizationSummary } from "./authorization";
import type { SiteRecord } from "./sites";

/** The enterprise-side engagement roles that can take governed actions — a
 *  subset of EngagementRole (see engagements.ts). */
export type CustomerRole =
  | "enterprise-sponsor"
  | "enterprise-approver"
  | "enterprise-contributor"
  | "read-only-reviewer";

export type GovernedActionType = "loa-signature" | "risk-acceptance";

export type DecisionOutcome = "approved" | "declined" | "accepted";

export type ReconciliationState = "pending-reconciliation" | "reconciled";

export interface CustomerDecision {
  id: string;
  engagementId: string;
  /** Matches PendingApproval.id — the item this decision responds to. */
  itemId: string;
  actionType: GovernedActionType;
  outcome: DecisionOutcome;
  note: string;
  actorRole: CustomerRole;
  submittedAt: string;
  reconciliationState: ReconciliationState;
}

export interface PendingApproval {
  /** Stable id, e.g. `loa:${authId}` or `risk:${siteId}:${riskId}`. */
  id: string;
  actionType: GovernedActionType;
  title: string;
  detail: string;
  context: string;
  /** The customer's submitted decision, if any (null = still awaiting them). */
  decision: CustomerDecision | null;
}

export interface BuildApprovalsInput {
  engagementId: string;
  authorizations: EnterpriseAuthorizationSummary[];
  siteRecords: SiteRecord[];
  decisions: CustomerDecision[];
  /** Cap risk-acceptance items so the queue stays leadership-legible. */
  riskLimit?: number;
}

/** Build the customer's governed-action queue: LOAs awaiting signature and
 *  high/critical open risks awaiting an enterprise accept/decline decision. */
export function buildPendingApprovals(input: BuildApprovalsInput): PendingApproval[] {
  const byItem = new Map(input.decisions.map((d) => [d.itemId, d] as const));
  const items: PendingApproval[] = [];

  for (const auth of input.authorizations) {
    if (auth.status !== "pending-enterprise-signature") continue;
    const id = `loa:${auth.id}`;
    items.push({
      id,
      actionType: "loa-signature",
      title: `Sign LOA — ${auth.carrierIds.join(", ")}`,
      detail: auth.scopeSummary,
      context: `${auth.siteIds.length} site(s)`,
      decision: byItem.get(id) ?? null,
    });
  }

  const riskLimit = input.riskLimit ?? 6;
  let riskCount = 0;
  for (const site of input.siteRecords) {
    for (const risk of site.risks) {
      if (riskCount >= riskLimit) break;
      if (risk.status !== "open") continue;
      if (risk.severity !== "high" && risk.severity !== "critical") continue;
      const id = `risk:${site.id}:${risk.id}`;
      items.push({
        id,
        actionType: "risk-acceptance",
        title: `Risk decision — ${risk.title}`,
        detail: `${risk.severity} severity${risk.control ? ` · ${risk.control}` : ""}`,
        context: `${site.code} – ${site.name}`,
        decision: byItem.get(id) ?? null,
      });
      riskCount += 1;
    }
  }

  return items;
}

export function pendingCount(items: PendingApproval[]): number {
  return items.filter((i) => i.decision === null).length;
}

export interface NewDecisionInput {
  engagementId: string;
  item: PendingApproval;
  outcome: DecisionOutcome;
  note: string;
  actorRole: CustomerRole;
  submittedAt: string;
  id: string;
}

export function buildDecision(input: NewDecisionInput): CustomerDecision {
  return {
    id: input.id,
    engagementId: input.engagementId,
    itemId: input.item.id,
    actionType: input.item.actionType,
    outcome: input.outcome,
    note: input.note,
    actorRole: input.actorRole,
    submittedAt: input.submittedAt,
    reconciliationState: "pending-reconciliation",
  };
}
