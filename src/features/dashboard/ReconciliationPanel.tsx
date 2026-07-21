import { CheckCircle2, FileSignature, GitMerge, ShieldAlert } from "lucide-react";
import { useRegistry } from "../../application/registryContext";
import { usePersona } from "../../application/persona";
import { CUSTOMER_ROLE_LABELS } from "../../application/persona";
import type { GovernedActionType } from "../../domain";

const ACTION_ICON: Record<GovernedActionType, typeof FileSignature> = {
  "loa-signature": FileSignature,
  "risk-acceptance": ShieldAlert,
};

/**
 * Consultant reconciliation queue. The operator sees customer decisions awaiting
 * reconciliation and applies each to canonical state — an LOA signature activates
 * the authorization, an accepted risk flips the risk to accepted, and declines
 * make no canonical change. This is the ONLY path by which a customer decision
 * reaches canonical facts. Consultant-only (returns null otherwise).
 */
export function ReconciliationPanel() {
  const { reconciliationQueue, reconcileDecision } = useRegistry();
  const { capabilities } = usePersona();

  if (!capabilities.canOperate) return null;
  if (reconciliationQueue.length === 0) return null;

  return (
    <section className="dashboard-panel dashboard-reconcile">
      <div className="dashboard-panel-head">
        <h2><GitMerge size={14} aria-hidden="true" /> Reconciliation queue</h2>
        <span>{reconciliationQueue.length} awaiting reconciliation</span>
      </div>
      <p className="dashboard-actions-note">
        Customer decisions apply to canonical facts only when you reconcile them. Declines make no canonical change.
      </p>
      <div className="dashboard-actions-list">
        {reconciliationQueue.map((item) => {
          const Icon = ACTION_ICON[item.decision.actionType];
          const noChange = item.effect.kind === "none";
          return (
            <div key={item.decision.id} className="dashboard-reconcile-row">
              <span className={`dashboard-action-icon action-${item.decision.actionType}`}><Icon size={15} aria-hidden="true" /></span>
              <div className="dashboard-action-main">
                <strong>{item.title}</strong>
                <small>{item.context}</small>
                <span className="dashboard-reconcile-decision">
                  {CUSTOMER_ROLE_LABELS[item.decision.actorRole]} · {item.outcomeLabel}
                  {item.decision.note ? <em> — “{item.decision.note}”</em> : null}
                </span>
                <span className={`dashboard-reconcile-effect${noChange ? " is-none" : ""}`}>
                  <CheckCircle2 size={12} aria-hidden="true" /> {item.effect.summary}
                </span>
              </div>
              <button
                type="button"
                className="dashboard-action-approve"
                onClick={() => reconcileDecision(item.decision.id)}
              >
                Reconcile
              </button>
            </div>
          );
        })}
      </div>
      <p className="dashboard-actions-foot">
        Reconciling records an audit entry. Accepting a risk does not improve the technical score or erase the underlying gap.
      </p>
    </section>
  );
}
