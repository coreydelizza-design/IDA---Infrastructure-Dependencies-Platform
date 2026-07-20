import { AlertTriangle, CheckCircle2, Database, Play, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useConnectors } from "../../application/useConnectors";
import type { ClaimReconciliationStatus, ConnectorKind } from "../../domain";

const statusText = (s: ClaimReconciliationStatus) => s.replaceAll("-", " ");

export function ConnectorsPage() {
  const { connectors, claims, busy, runImport, reconcile } = useConnectors();
  const [selected, setSelected] = useState<ConnectorKind>(connectors[0]?.kind ?? "cmdb-inventory");
  const [payload, setPayload] = useState("");

  const descriptor = connectors.find((c) => c.kind === selected);
  useEffect(() => { if (descriptor) setPayload(descriptor.samplePayload); }, [descriptor]);

  const staged = claims.filter((c) => c.reconciliationStatus === "staged");
  const conflicts = claims.filter((c) => c.reconciliationStatus === "conflict");
  const resolved = claims.filter((c) => ["accepted", "rejected", "superseded", "held"].includes(c.reconciliationStatus));

  return (
    <main className="secondary-workspace-page connectors-page">
      <div className="secondary-page-heading">
        <div><span className="eyebrow">Point-in-time imports · staged for reconciliation</span><h1>Connectors &amp; Imports</h1><p>Connector output is staged as proposed claims. Nothing becomes canonical without consultant reconciliation, and a consultant-verified fact is never silently overwritten.</p></div>
      </div>

      <div className="secondary-kpi-grid">
        <section><Database size={17} /><span>Staged claims</span><strong>{staged.length}</strong><small>Awaiting review</small></section>
        <section><ShieldAlert size={17} /><span>Conflicts</span><strong>{conflicts.length}</strong><small>Consultant-verified</small></section>
        <section><CheckCircle2 size={17} /><span>Reconciled</span><strong>{resolved.length}</strong><small>Accepted / rejected</small></section>
        <section><Play size={17} /><span>Connectors</span><strong>{connectors.length}</strong><small>Point-in-time only</small></section>
      </div>

      <div className="secondary-content-grid">
        <section className="enterprise-table-panel connector-run-panel">
          <div className="panel-heading"><div><h2>Run Import</h2><p>Select a connector and stage a point-in-time payload.</p></div></div>
          <div className="connector-picker">
            {connectors.map((c) => (
              <button key={c.kind} type="button" className={`connector-chip ${selected === c.kind ? "active" : ""}`} onClick={() => setSelected(c.kind)}>
                <strong>{c.label}</strong><small>{c.description}</small>
              </button>
            ))}
          </div>
          <label className="connector-payload">
            <span>Payload (point-in-time · one record per line)</span>
            <textarea value={payload} onChange={(e) => setPayload(e.target.value)} rows={5} spellCheck={false} />
          </label>
          <button type="button" className="primary-button" disabled={busy} onClick={() => void runImport(selected, payload)}><Play size={15} /> Stage Import</button>
        </section>

        <section className="enterprise-table-panel connector-queue-panel">
          <div className="panel-heading"><div><h2>Reconciliation Queue</h2><p>Accept, reject, hold, or (for conflicts) consultant-supersede.</p></div></div>
          <div className="claim-list">
            {claims.length === 0 ? <p className="intake-empty">No staged claims. Run an import to stage proposed claims.</p> : null}
            {claims.map((claim) => (
              <div className={`claim-row status-${claim.reconciliationStatus}`} key={claim.id}>
                <div className="claim-main">
                  <strong>{claim.fieldPath}</strong>
                  <small>{claim.proposedValue} · {claim.sourceName}</small>
                  {claim.conflictReason ? <em className="claim-conflict"><AlertTriangle size={11} /> {claim.conflictReason}</em> : null}
                </div>
                <em className={`status-pill ${claim.reconciliationStatus}`}>{statusText(claim.reconciliationStatus)}</em>
                <div className="claim-actions">
                  {claim.reconciliationStatus === "staged" ? (
                    <>
                      <button type="button" onClick={() => void reconcile(claim.id, "accept")}>Accept</button>
                      <button type="button" onClick={() => void reconcile(claim.id, "hold")}>Hold</button>
                      <button type="button" className="danger" onClick={() => void reconcile(claim.id, "reject")}>Reject</button>
                    </>
                  ) : claim.reconciliationStatus === "conflict" ? (
                    <>
                      <button type="button" onClick={() => void reconcile(claim.id, "supersede")}>Supersede</button>
                      <button type="button" className="danger" onClick={() => void reconcile(claim.id, "reject")}>Reject</button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
