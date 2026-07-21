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

// ---------------------------------------------------------------------------
// Consultant reconciliation.
//
// A customer decision is an input, not an edit. The consultant reconciles it:
// only then does the canonical authorization/risk change. `resolveDecisionEffect`
// is the single source of truth for what a reconcile applies; the context uses it
// to mutate canonical state and to write the audit trail. Declined outcomes make
// no canonical change (the LOA stays pending, the risk stays open).
// ---------------------------------------------------------------------------

/** What reconciling a decision will apply to canonical state. `kind: "none"`
 *  means acknowledge-only (no canonical mutation). */
export interface ReconciliationEffect {
  kind: "authorization" | "risk" | "none";
  /** Authorization id (kind "authorization") or risk id (kind "risk"). */
  targetId: string;
  /** Owning site id, present only for kind "risk". */
  siteId?: string;
  /** The canonical status a reconcile will set, or null for no change. */
  nextStatus: string | null;
  /** Human-readable summary of the applied effect (for UI + audit). */
  summary: string;
}

/** Parse a decision's itemId back to its canonical target ids. Mirrors the id
 *  shapes minted by buildPendingApprovals (`loa:${authId}`, `risk:${siteId}:${riskId}`). */
export function parseDecisionTarget(decision: CustomerDecision): { authId?: string; siteId?: string; riskId?: string } {
  if (decision.actionType === "loa-signature") {
    return { authId: decision.itemId.slice("loa:".length) };
  }
  const rest = decision.itemId.slice("risk:".length);
  const [siteId, ...riskParts] = rest.split(":");
  return { siteId, riskId: riskParts.join(":") };
}

/** The single source of truth for what reconciling a decision does. */
export function resolveDecisionEffect(decision: CustomerDecision): ReconciliationEffect {
  const target = parseDecisionTarget(decision);
  if (decision.actionType === "loa-signature") {
    if (decision.outcome === "approved") {
      return { kind: "authorization", targetId: target.authId ?? "", nextStatus: "active", summary: "Activate LOA (status → active)" };
    }
    return { kind: "none", targetId: target.authId ?? "", nextStatus: null, summary: "No canonical change — LOA remains pending signature" };
  }
  // risk-acceptance
  if (decision.outcome === "accepted") {
    return { kind: "risk", targetId: target.riskId ?? "", siteId: target.siteId, nextStatus: "accepted", summary: "Accept risk (status → accepted)" };
  }
  return { kind: "none", targetId: target.riskId ?? "", siteId: target.siteId, nextStatus: null, summary: "No canonical change — risk remains open" };
}

export interface ReconciliationItem {
  decision: CustomerDecision;
  title: string;
  context: string;
  /** Presentation label for the customer's outcome (Signed / Risk accepted / Declined). */
  outcomeLabel: string;
  effect: ReconciliationEffect;
}

const OUTCOME_LABELS: Record<DecisionOutcome, string> = {
  approved: "Signed",
  accepted: "Risk accepted",
  declined: "Declined",
};

export interface BuildReconciliationInput {
  engagementId: string;
  decisions: CustomerDecision[];
  authorizations: EnterpriseAuthorizationSummary[];
  siteRecords: SiteRecord[];
}

/** The consultant's reconciliation queue: customer decisions still awaiting
 *  reconciliation, resolved to a readable title + the canonical effect. */
export function buildReconciliationQueue(input: BuildReconciliationInput): ReconciliationItem[] {
  const authById = new Map(input.authorizations.map((a) => [a.id, a] as const));
  const siteById = new Map(input.siteRecords.map((s) => [s.id, s] as const));
  const items: ReconciliationItem[] = [];

  for (const decision of input.decisions) {
    if (decision.engagementId !== input.engagementId) continue;
    if (decision.reconciliationState !== "pending-reconciliation") continue;
    const effect = resolveDecisionEffect(decision);
    const target = parseDecisionTarget(decision);

    let title = "";
    let context = "";
    if (decision.actionType === "loa-signature") {
      const auth = target.authId ? authById.get(target.authId) : undefined;
      title = auth ? `LOA — ${auth.carrierIds.join(", ")}` : `LOA — ${target.authId}`;
      context = auth ? auth.scopeSummary : "authorization";
    } else {
      const site = target.siteId ? siteById.get(target.siteId) : undefined;
      const risk = site?.risks.find((r) => r.id === target.riskId);
      title = risk ? `Risk — ${risk.title}` : `Risk — ${target.riskId}`;
      context = site ? `${site.code} – ${site.name}` : "site risk";
    }

    items.push({ decision, title, context, outcomeLabel: OUTCOME_LABELS[decision.outcome], effect });
  }

  return items;
}

export function reconciliationCount(items: ReconciliationItem[]): number {
  return items.length;
}
