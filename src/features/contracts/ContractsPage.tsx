import { FileSignature, FolderInput, Plus, ScrollText, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useRegistry } from "../../application/registryContext";
import { usePersona } from "../../application/persona";
import type { WorkspacePage } from "../../application/useRegistryState";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  contractStatusTone,
  summarizeContracts,
} from "../../domain";

interface ContractsPageProps {
  onNavigate: (page: WorkspacePage) => void;
}

const authStatusText = (v: string) => v.replaceAll("-", " ");

export function ContractsPage({ onNavigate }: ContractsPageProps) {
  const registry = useRegistry();
  const { capabilities } = usePersona();
  const [search, setSearch] = useState("");

  const contracts = registry.contracts;
  const authorizations = registry.authorizations;
  const summary = useMemo(() => summarizeContracts(contracts), [contracts]);
  const activeLoaCount = authorizations.filter((a) => a.status === "active").length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contracts;
    return contracts.filter((c) =>
      [c.title, c.reference, c.counterparty, CONTRACT_TYPE_LABELS[c.type], c.status].some((v) => v.toLowerCase().includes(q)),
    );
  }, [contracts, search]);

  return (
    <main className="secondary-workspace-page contracts-page">
      <div className="secondary-page-heading">
        <div>
          <span className="eyebrow">Document repository</span>
          <h1>Contracts &amp; Authorizations</h1>
          <p>Master service agreements and related instruments with {registry.currentEnterprise?.name ?? "the enterprise"}, plus the letters of authorization issued to carriers.</p>
        </div>
        <div className="contracts-heading-actions">
          <button type="button" className="secondary-button" onClick={() => onNavigate("imports")}><FolderInput size={13} /> Data imports</button>
          {capabilities.canOperate ? <button type="button" className="primary-button"><Plus size={15} /> New contract</button> : null}
        </div>
      </div>

      <div className="secondary-kpi-grid">
        <section><ScrollText size={17} /><span>Active MSAs</span><strong>{summary.activeMsaCount}</strong><small>Master agreements</small></section>
        <section><FileSignature size={17} /><span>Expiring</span><strong>{summary.expiringCount}</strong><small>Renewal due</small></section>
        <section><ScrollText size={17} /><span>Drafts / in review</span><strong>{summary.draftCount}</strong><small>Not yet active</small></section>
        <section><Users size={17} /><span>Active LOAs</span><strong>{activeLoaCount}</strong><small>Carrier authorizations</small></section>
      </div>

      <section className="enterprise-table-panel contracts-panel">
        <div className="panel-heading">
          <div><h2>Contracts</h2><p>MSAs, SOWs, and related instruments.</p></div>
          <label className="mini-search"><input placeholder="Search contracts…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search contracts" /></label>
        </div>
        <div className="enterprise-table contracts-table">
          <div className="table-head"><span>Type</span><span>Title</span><span>Reference</span><span>Status</span><span>Effective</span><span>Expires</span></div>
          {filtered.length > 0 ? filtered.map((c) => (
            <div className="table-row contracts-row" key={c.id}>
              <span><em className={`contract-type type-${c.type}`}>{CONTRACT_TYPE_LABELS[c.type]}</em></span>
              <span><strong>{c.title}</strong><small>{c.counterparty}{c.documentName ? ` · ${c.documentName}` : ""}</small></span>
              <span>{c.reference}</span>
              <span><em className={`status-pill tone-${contractStatusTone(c.status)}`}>{CONTRACT_STATUS_LABELS[c.status]}</em></span>
              <span>{c.effectiveDate ?? "—"}</span>
              <span>{c.expirationDate ?? "—"}</span>
            </div>
          )) : <div className="empty-results">No contracts match “{search}”.</div>}
        </div>
      </section>

      <section className="enterprise-table-panel contracts-loa-panel">
        <div className="panel-heading">
          <div><h2>Letters of Authorization</h2><p>Scoped carrier permissions for the current engagement.</p></div>
          <button type="button" className="secondary-button" onClick={() => onNavigate("loa")}>Open LOA workspace</button>
        </div>
        <div className="enterprise-table contracts-loa-table">
          <div className="table-head"><span>Carrier</span><span>Status</span><span>Scope</span><span>Expires</span></div>
          {authorizations.length > 0 ? authorizations.map((a) => (
            <div className="table-row" key={a.id}>
              <span><strong>{a.carrierIds.join(", ")}</strong><small>{a.id}</small></span>
              <span><em className={`status-pill ${a.status}`}>{authStatusText(a.status)}</em></span>
              <span>{a.scopeSummary}</span>
              <span>{a.expirationDate ?? "—"}</span>
            </div>
          )) : <div className="empty-results">No authorizations for this engagement yet.</div>}
        </div>
      </section>
    </main>
  );
}
