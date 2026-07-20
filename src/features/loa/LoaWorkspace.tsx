import { CheckCircle2, Clock3, FileSignature, Plus, Search, Send, ShieldCheck } from "lucide-react";
import {
  canonicalAuthorizations,
  canonicalCarrierAcknowledgments,
  canonicalConfirmationRequests,
  canonicalSites,
} from "../../data/canonicalData";

export function LoaWorkspace() {
  const acknowledgmentByCarrier = new Map(
    canonicalCarrierAcknowledgments.map((ack) => [ack.authorizationId, ack]),
  );

  return (
    <main className="secondary-workspace-page loa-workspace">
      <div className="secondary-page-heading">
        <div><span className="eyebrow">Authorized carrier collaboration</span><h1>Enterprise Authorizations</h1><p>Manage enterprise authorization, scope carrier confirmation requests, and preserve evidence lineage.</p></div>
        <button className="primary-button" type="button"><Plus size={16} /> New Authorization</button>
      </div>
      <div className="secondary-kpi-grid">
        <section><FileSignature size={17} /><span>Active authorizations</span><strong>{canonicalAuthorizations.filter((auth) => auth.status === "active").length}</strong><small>59 sites authorized</small></section>
        <section><Clock3 size={17} /><span>Pending signature</span><strong>{canonicalAuthorizations.filter((auth) => auth.signatureStatus === "pending-signature").length}</strong><small>Awaiting enterprise sign-off</small></section>
        <section><Send size={17} /><span>Open confirmation requests</span><strong>{canonicalConfirmationRequests.filter((request) => !["reconciled", "closed"].includes(request.status)).length}</strong><small>Across 3 carriers</small></section>
        <section><ShieldCheck size={17} /><span>Verified evidence</span><strong>92%</strong><small>Current confidence</small></section>
      </div>
      <div className="secondary-content-grid">
        <section className="enterprise-table-panel">
          <div className="panel-heading"><div><h2>Enterprise Authorizations</h2><p>Signature status, scope, and carrier acknowledgment.</p></div><label className="mini-search"><Search size={14} /><input placeholder="Search authorizations..." /></label></div>
          <div className="enterprise-table loa-table">
            <div className="table-head"><span>Carrier</span><span>Authorization</span><span>Acknowledgment</span><span>Sites</span><span>Expiration</span></div>
            {canonicalAuthorizations.map((auth) => {
              const ack = acknowledgmentByCarrier.get(auth.id);
              return (
                <button className="table-row" type="button" key={auth.id}>
                  <span><strong>{auth.carriers.join(", ")}</strong><small>{auth.id}</small></span>
                  <span><em className={`status-pill ${auth.status}`}>{auth.status.replaceAll("-", " ")}</em></span>
                  <span><em className={`status-pill ${ack?.acknowledgmentStatus ?? "not-sent"}`}>{(ack?.acknowledgmentStatus ?? "not-sent").replaceAll("-", " ")}</em></span>
                  <span>{auth.siteCount}</span>
                  <span>{auth.revokedAt ? `revoked ${auth.revokedAt}` : auth.expirationDate}</span>
                </button>
              );
            })}
          </div>
        </section>
        <section className="enterprise-table-panel request-panel">
          <div className="panel-heading"><div><h2>Confirmation Requests</h2><p>Requests are blocked without active scoped authorization.</p></div></div>
          <div className="request-list">
            {canonicalConfirmationRequests.map((request) => {
              const site = canonicalSites.find((candidate) => candidate.id === request.siteId);
              return (
                <button type="button" key={request.id}>
                  <span className="request-icon">{request.status === "reconciled" ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}</span>
                  <span><strong>{request.id} · {request.requestedFields.join(", ")}</strong><small>{site?.code} – {site?.name} · {request.carrier}</small></span>
                  <em>{request.status.replaceAll("-", " ")}</em>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
