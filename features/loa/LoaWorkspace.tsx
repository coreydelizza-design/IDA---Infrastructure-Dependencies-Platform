import { CheckCircle2, Clock3, FileSignature, Plus, Search, Send, ShieldCheck } from "lucide-react";
import { canonicalCarrierRequests, canonicalLoas, canonicalSites } from "../../data/canonicalData";

export function LoaWorkspace() {
  return (
    <main className="secondary-workspace-page loa-workspace">
      <div className="secondary-page-heading">
        <div><span className="eyebrow">Authorized carrier collaboration</span><h1>LOA Workspace</h1><p>Control enterprise authorization, scope carrier requests, and preserve evidence lineage.</p></div>
        <button className="primary-button" type="button"><Plus size={16} /> New LOA</button>
      </div>
      <div className="secondary-kpi-grid">
        <section><FileSignature size={17} /><span>Active LOAs</span><strong>{canonicalLoas.filter((loa) => loa.status === "active").length}</strong><small>59 sites authorized</small></section>
        <section><Clock3 size={17} /><span>Pending signature</span><strong>{canonicalLoas.filter((loa) => loa.status === "pending-signature").length}</strong><small>Renewal attention</small></section>
        <section><Send size={17} /><span>Open carrier requests</span><strong>{canonicalCarrierRequests.filter((request) => !["verified", "closed"].includes(request.status)).length}</strong><small>Across 3 carriers</small></section>
        <section><ShieldCheck size={17} /><span>Verified evidence</span><strong>92%</strong><small>Current confidence</small></section>
      </div>
      <div className="secondary-content-grid">
        <section className="enterprise-table-panel">
          <div className="panel-heading"><div><h2>Letters of Authorization</h2><p>Versioned authority and permitted actions.</p></div><label className="mini-search"><Search size={14} /><input placeholder="Search LOAs..." /></label></div>
          <div className="enterprise-table loa-table">
            <div className="table-head"><span>Carrier</span><span>Status</span><span>Scope</span><span>Sites</span><span>Expiration</span></div>
            {canonicalLoas.map((loa) => (
              <button className="table-row" type="button" key={loa.id}>
                <span><strong>{loa.carrier}</strong><small>{loa.id}</small></span>
                <span><em className={`status-pill ${loa.status}`}>{loa.status.replaceAll("-", " ")}</em></span>
                <span>{loa.scope.slice(0, 2).join(" · ")}</span>
                <span>{loa.siteCount}</span>
                <span>{loa.expirationDate}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="enterprise-table-panel request-panel">
          <div className="panel-heading"><div><h2>Carrier Requests</h2><p>Requests are blocked without active scoped authority.</p></div></div>
          <div className="request-list">
            {canonicalCarrierRequests.map((request) => {
              const site = canonicalSites.find((candidate) => candidate.id === request.siteId);
              return (
                <button type="button" key={request.id}>
                  <span className="request-icon">{request.status === "verified" ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}</span>
                  <span><strong>{request.id} · {request.requestType.replaceAll("-", " ")}</strong><small>{site?.code} – {site?.name} · {request.carrier}</small></span>
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
