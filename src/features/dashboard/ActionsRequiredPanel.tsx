import { CheckCircle2, ClipboardCheck, FileSignature, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useRegistry } from "../../application/registryContext";
import { CUSTOMER_ROLE_LABELS, usePersona } from "../../application/persona";
import type { DecisionOutcome, GovernedActionType, PendingApproval } from "../../domain";

const ACTION_ICON: Record<GovernedActionType, typeof FileSignature> = {
  "loa-signature": FileSignature,
  "risk-acceptance": ShieldAlert,
};

const OUTCOME_LABEL: Record<DecisionOutcome, string> = {
  approved: "Signed",
  accepted: "Risk accepted",
  declined: "Declined",
};

/** The primary and secondary governed outcomes offered per action type. The
 *  customer records a decision; canonical facts are unchanged until the
 *  consultant reconciles. */
const OUTCOMES: Record<GovernedActionType, { primary: DecisionOutcome; secondary: DecisionOutcome; primaryLabel: string; secondaryLabel: string }> = {
  "loa-signature": { primary: "approved", secondary: "declined", primaryLabel: "Sign", secondaryLabel: "Decline" },
  "risk-acceptance": { primary: "accepted", secondary: "declined", primaryLabel: "Accept risk", secondaryLabel: "Decline" },
};

/**
 * Governed customer actions on the Customer Dashboard. Read-only customers see
 * nothing; contributors see the queue read-only ("awaiting sponsor/approver");
 * sponsors/approvers can record a decision. A decision is an APPROVAL/INPUT
 * record for consultant reconciliation — it never edits the canonical LOA or
 * risk. Not a legal-compliance instrument.
 */
export function ActionsRequiredPanel() {
  const { pendingApprovals, submitCustomerDecision } = useRegistry();
  const { customerRole, capabilities } = usePersona();

  // Only the customer personas with a governed stake see the panel at all.
  if (!capabilities.canApprove && !capabilities.canContribute) return null;
  if (pendingApprovals.length === 0) return null;

  const outstanding = pendingApprovals.filter((i) => i.decision === null).length;

  return (
    <section className="dashboard-panel dashboard-actions">
      <div className="dashboard-panel-head">
        <h2><ClipboardCheck size={14} aria-hidden="true" /> Actions required</h2>
        <span>{outstanding} awaiting you</span>
      </div>
      {!capabilities.canApprove ? (
        <p className="dashboard-actions-note">
          Viewing as {CUSTOMER_ROLE_LABELS[customerRole]} — governed decisions are recorded by a Sponsor or Approver.
        </p>
      ) : null}
      <div className="dashboard-actions-list">
        {pendingApprovals.map((item) => (
          <ActionRow
            key={item.id}
            item={item}
            canDecide={capabilities.canApprove}
            onDecide={(outcome, note) => submitCustomerDecision({ item, outcome, note, actorRole: customerRole })}
          />
        ))}
      </div>
      <p className="dashboard-actions-foot">
        Recording a decision notifies your consultant for reconciliation. It does not alter the canonical registry or certify legal compliance.
      </p>
    </section>
  );
}

function ActionRow({
  item,
  canDecide,
  onDecide,
}: {
  item: PendingApproval;
  canDecide: boolean;
  onDecide: (outcome: DecisionOutcome, note: string) => void;
}) {
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const Icon = ACTION_ICON[item.actionType];
  const outcomes = OUTCOMES[item.actionType];
  const decided = item.decision;

  return (
    <div className={`dashboard-action-row${decided ? " is-decided" : ""}`}>
      <span className={`dashboard-action-icon action-${item.actionType}`}><Icon size={15} aria-hidden="true" /></span>
      <div className="dashboard-action-main">
        <strong>{item.title}</strong>
        <small>{item.detail} · {item.context}</small>
        {decided ? (
          <span className="dashboard-action-status">
            <CheckCircle2 size={12} aria-hidden="true" /> {OUTCOME_LABEL[decided.outcome]} · {decided.reconciliationState === "reconciled" ? "reconciled by consultant" : "awaiting consultant reconciliation"}
            {decided.note ? <em> — “{decided.note}”</em> : null}
          </span>
        ) : null}
      </div>
      {canDecide ? (
        decided ? (
          <button type="button" className="dashboard-action-change" onClick={() => setOpen((v) => !v)}>
            {open ? "Cancel" : "Revise"}
          </button>
        ) : null
      ) : (
        <span className="dashboard-action-await">Awaiting approver</span>
      )}
      {canDecide && (!decided || open) ? (
        <div className="dashboard-action-controls">
          <input
            type="text"
            className="dashboard-action-note"
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label="Decision note"
          />
          <button
            type="button"
            className="dashboard-action-decline"
            onClick={() => { onDecide(outcomes.secondary, note); setOpen(false); setNote(""); }}
          >
            {outcomes.secondaryLabel}
          </button>
          <button
            type="button"
            className="dashboard-action-approve"
            onClick={() => { onDecide(outcomes.primary, note); setOpen(false); setNote(""); }}
          >
            {outcomes.primaryLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
