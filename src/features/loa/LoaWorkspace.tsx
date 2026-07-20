import { CheckCircle2, Clock3, FileSignature, Plus, Search, Send, ShieldCheck } from "lucide-react";
import { useRegistry } from "../../application/registryContext";

const statusText = (value: string) => value.replaceAll("-", " ");

export function LoaWorkspace() {
  const registry = useRegistry();
  const authorizations = registry.authorizations;
  const acknowledgments = registry.acknowledgments;
  const activeCount = authorizations.filter((a) => a.status === "active").length;
  const pendingSignature = authorizations.filter((a) => a.status === "pending-enterprise-signature").length;
  const openAcks = acknowledgments.filter((a) => !["accepted", "rejected", "expired"].includes(a.status)).length;

  return (
    <main className="secondary-workspace-page loa-workspace">
      <div className="secondary-page-heading">
        <div><span className="eyebrow">Authorized carrier collaboration</span><h1>Enterprise Authorizations</h1><p>Enterprise authorization and carrier acknowledgment are tracked separately. Full LOA workflow arrives in a later phase.</p></div>
        <button className="primary-button" type="button"><Plus size={16} /> New Authorization</button>
      </div>
      <div className="secondary-kpi-grid">
        <section><FileSignature size={17} /><span>Active authorizations</span><strong>{activeCount}</strong><small>Enterprise-signed</small></section>
        <section><Clock3 size={17} /><span>Pending signature</span><strong>{pendingSignature}</strong><small>Awaiting enterprise sign-off</small></section>
        <section><Send size={17} /><span>Open acknowledgments</span><strong>{openAcks}</strong><small>Carrier response outstanding</small></section>
        <section><ShieldCheck size={17} /><span>Verified evidence</span><strong>92%</strong><small>Current confidence</small></section>
      </div>
      <div className="secondary-content-grid">
        <section className="enterprise-table-panel">
          <div className="panel-heading"><div><h2>Enterprise Authorizations</h2><p>Authorization status, scope, and expiration.</p></div><label className="mini-search"><Search size={14} /><input placeholder="Search authorizations..." /></label></div>
          <div className="enterprise-table loa-table">
            <div className="table-head"><span>Carrier</span><span>Status</span><span>Scope</span><span>Sites</span><span>Expiration</span></div>
            {authorizations.map((auth) => (
              <button className="table-row" type="button" key={auth.id}>
                <span><strong>{auth.carrierIds.join(", ")}</strong><small>{auth.id}</small></span>
                <span><em className={`status-pill ${auth.status}`}>{statusText(auth.status)}</em></span>
                <span>{auth.scopeSummary}</span>
                <span>{auth.siteIds.length}</span>
                <span>{auth.expirationDate ?? "—"}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="enterprise-table-panel request-panel">
          <div className="panel-heading"><div><h2>Carrier Acknowledgments</h2><p>Separate from enterprise authorization; carrier view is read-only in this phase.</p></div></div>
          <div className="request-list">
            {acknowledgments.map((ack) => (
              <button type="button" key={ack.id}>
                <span className="request-icon">{ack.status === "accepted" ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}</span>
                <span><strong>{ack.carrierId}</strong><small>{ack.authorizationId}</small></span>
                <em>{statusText(ack.status)}</em>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
