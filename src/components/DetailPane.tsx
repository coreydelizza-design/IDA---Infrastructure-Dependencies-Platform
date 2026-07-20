import {
  Activity,
  Building2,
  Check,
  ChevronRight,
  Circle,
  GitBranch,
  MapPin,
  MoreVertical,
  Network,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import type { DetailTab, RoleMode, Site } from "../domain/models";
import type { ServiceAssuranceState } from "../domain/services";
import { registryStateLabels } from "../domain/siteStates";
import { ScoreRing } from "./ScoreRing";

const serviceAssuranceLabels: Record<ServiceAssuranceState, string> = {
  "not-assessed": "Not assessed",
  "partially-documented": "Partial",
  documented: "Documented",
  "confirmation-pending": "Pending",
  confirmed: "Confirmed",
  "consultant-verified": "Verified",
  disputed: "Disputed",
  "review-due": "Review due",
};

const assuredServiceStates: ServiceAssuranceState[] = ["confirmed", "consultant-verified", "documented"];

const publicationLabels: Record<Site["publicationState"], string> = {
  "insufficient-assessment": "Insufficient assessment",
  provisional: "Provisional assessment",
  publishable: "Assessed · Publishable",
  superseded: "Superseded",
};

interface DetailPaneProps {
  site: Site;
  activeTab: DetailTab;
  roleMode: RoleMode;
  onTabChange: (tab: DetailTab) => void;
  onClose: () => void;
  onToggleFavorite: () => void;
  onEditSite?: () => void;
  onArchiveSite?: () => void;
  onDuplicateSite?: () => void;
  onMarkReviewComplete?: () => void;
  onRunAssessment?: () => void;
}

const tabLabels: Array<{ id: DetailTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "resilience", label: "Resilience" },
  { id: "risks", label: "Risks" },
  { id: "dependencies", label: "Dependencies" },
  { id: "compliance", label: "Compliance" },
  { id: "history", label: "History" },
];

function riskCount(site: Site, severity: "critical" | "high" | "medium" | "low"): number {
  return site.risks.filter((risk) => risk.severity === severity && risk.status !== "closed").length;
}

function OverviewPanel({ site }: { site: Site }) {
  const dora = site.compliance.find((item) => item.framework === "DORA");
  const ict = site.compliance.find((item) => item.framework === "ICT (EU)");
  const criticalRiskCount = riskCount(site, "critical");

  return (
    <div className="overview-panel">
      <div className="overview-top-grid">
        <section className="detail-info-card site-details-card">
          <h4>Site Details</h4>
          <dl className="detail-definition-list">
            <div><dt>Site Type</dt><dd>{site.type}</dd></div>
            <div><dt>Location Type</dt><dd>{site.locationType}</dd></div>
            <div><dt>Country / Region</dt><dd>{site.countryName} / {site.region}</dd></div>
            <div><dt>Address</dt><dd>{site.address.split("\n").map((line) => <span key={line}>{line}</span>)}</dd></div>
            <div><dt>Time Zone</dt><dd>{site.timezone}</dd></div>
            <div><dt>Owner</dt><dd>{site.owner}</dd></div>
          </dl>
        </section>

        <section className="detail-info-card resilience-indicator-card">
          <h4>Resilience Indicators</h4>
          <ul className="indicator-list">
            {site.resilienceIndicators.map((indicator) => (
              <li key={indicator.id}>
                <span className={`indicator-dot indicator-${indicator.state}`} />
                <span>{indicator.label}</span>
                <strong>{indicator.value}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="detail-info-card scoring-basis-card">
          <h4>Scoring Basis</h4>
          <span>Archetype</span>
          <strong>{site.type}</strong>
          <em>{site.criticality}</em>
          <p>
            Site is scored against its approved archetype.
            {site.score.singleSiteApproved ? " Single-path design is approved and is not penalized." : ""}
          </p>
          <div className="evidence-confirmation"><ShieldCheck size={13} /> {publicationLabels[site.publicationState]} · {site.completenessPercent}% coverage</div>
        </section>
      </div>

      <div className="overview-middle-grid">
        <section className="detail-info-card connectivity-card">
          <h4>Connectivity</h4>
          <dl className="compact-kv-list">
            <div><dt>Carrier Count</dt><dd>{site.carrierConnections.length}</dd></div>
            <div><dt>Underlying Diversity</dt><dd className="positive">{site.score.singleSiteApproved ? "Approved" : site.carrierConnections.length > 1 ? "Diverse" : "Single"}</dd></div>
            <div><dt>Entrance Diversity</dt><dd className={site.carrierConnections.length > 1 ? "positive" : "warning"}>{site.carrierConnections.length > 1 ? "Diverse" : "Unknown"}</dd></div>
            <div><dt>Last Verified</dt><dd>{site.score.assessedAt}</dd></div>
          </dl>
        </section>

        <section className="detail-info-card service-card">
          <h4>Critical Service Dependencies</h4>
          <ul className="service-list">
            {site.criticalServices.slice(0, 3).map((service) => (
              <li key={service.id}><span>{service.name}</span><strong className={assuredServiceStates.includes(service.assuranceState) ? "positive" : "warning"}>{serviceAssuranceLabels[service.assuranceState]}</strong></li>
            ))}
          </ul>
          <button type="button" className="text-link">View all ({site.criticalServices.length + 3})</button>
        </section>

        <section className="detail-info-card risk-card">
          <h4>Open Risks <span>{site.risks.length}</span></h4>
          <dl className="risk-count-list">
            <div><dt>High</dt><dd>{riskCount(site, "high")}</dd></div>
            <div><dt>Medium</dt><dd>{riskCount(site, "medium")}</dd></div>
            <div><dt>Low</dt><dd>{riskCount(site, "low")}</dd></div>
          </dl>
          <button type="button" className="text-link">View all</button>
        </section>
      </div>

      <div className="overview-status-grid">
        <section className="detail-status-cell">
          <span>DORA Status</span>
          <strong><Check size={12} /> {dora?.state === "gap" ? "Gap" : "Compliant"}</strong>
          <small>Last assessment:<br />{dora?.lastAssessed ?? "—"}</small>
        </section>
        <section className="detail-status-cell">
          <span>ICT (EU) Status</span>
          <strong><Check size={12} /> {ict?.state === "gap" ? "Gap" : "Compliant"}</strong>
          <small>Last assessment:<br />{ict?.lastAssessed ?? "—"}</small>
        </section>
        <section className="detail-status-cell confidence-cell">
          <span>Evidence Confidence</span>
          <strong>{site.evidenceConfidence[0].toUpperCase() + site.evidenceConfidence.slice(1)}</strong>
          <div className="confidence-bars" aria-label={`${site.evidenceConfidencePercent}% evidence confidence`}>
            {Array.from({ length: 10 }, (_, index) => <i key={index} className={index < Math.round(site.evidenceConfidencePercent / 10) ? "active" : ""} />)}
            <em>{site.evidenceConfidencePercent}%</em>
          </div>
        </section>
        <section className="detail-status-cell date-cell">
          <span>Last Assessed</span>
          <strong>{site.score.assessedAt}</strong>
          <small>May 12, 2024</small>
        </section>
        <section className="detail-status-cell date-cell">
          <span>Next Review</span>
          <strong>{site.nextReviewAt}</strong>
          <small>Jun 11, 2024</small>
        </section>
      </div>

      <section className="detail-info-card recent-activity-card">
        <div className="activity-heading"><h4>Recent Activity</h4><button type="button" className="text-link">View full history</button></div>
        <ul>
          {site.activity.map((item) => (
            <li key={item.id}>
              <Activity size={12} />
              <span>{item.action}</span>
              <em>by {item.actor}</em>
              <time>{item.relativeTime}</time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ResiliencePanel({ site }: { site: Site }) {
  return (
    <div className="detail-tab-panel generic-tab-panel">
      <div className="generic-panel-heading"><Network size={16} /><div><h4>Resilience controls</h4><p>Versioned assessment profile {site.score.profileVersion}</p></div></div>
      {site.resilienceIndicators.map((indicator) => (
        <div className="control-row" key={indicator.id}>
          <span className={`indicator-dot indicator-${indicator.state}`} />
          <div><strong>{indicator.label}</strong><small>{indicator.verification}</small></div>
          <em>{indicator.value}</em>
        </div>
      ))}
    </div>
  );
}

function RisksPanel({ site }: { site: Site }) {
  return (
    <div className="detail-tab-panel generic-tab-panel">
      <div className="generic-panel-heading"><ShieldCheck size={16} /><div><h4>Risk register</h4><p>Accepted risk retains the underlying technical gap.</p></div></div>
      {site.risks.length === 0 ? <div className="empty-tab-state">No open site risks.</div> : site.risks.map((risk) => (
        <div className="risk-record" key={risk.id}>
          <span className={`risk-severity ${risk.severity}`}>{risk.severity}</span>
          <div><strong>{risk.id} · {risk.title}</strong><small>{risk.status} {risk.control ? `· ${risk.control}` : ""}</small></div>
          <ChevronRight size={14} />
        </div>
      ))}
    </div>
  );
}

function DependenciesPanel({ site }: { site: Site }) {
  return (
    <div className="detail-tab-panel generic-tab-panel">
      <div className="generic-panel-heading"><GitBranch size={16} /><div><h4>{site.dependencyCount} registered dependencies</h4><p>Physical, logical, provider, power and control-plane relationships.</p></div></div>
      {site.carrierConnections.map((connection) => (
        <div className="dependency-record" key={connection.id}>
          <Network size={14} />
          <div><strong>{connection.contractedCarrier}</strong><small>{connection.serviceType} · {connection.circuitId}</small></div>
          <em>{connection.role}</em>
        </div>
      ))}
      <div className="dependency-record"><Building2 size={14} /><div><strong>Facility and power chain</strong><small>Demarc · MMR · UPS · generator · cooling</small></div><em>verified</em></div>
    </div>
  );
}

function CompliancePanel({ site }: { site: Site }) {
  return (
    <div className="detail-tab-panel generic-tab-panel">
      <div className="generic-panel-heading"><ShieldCheck size={16} /><div><h4>Requirement mappings</h4><p>Neutral controls mapped to framework-specific evidence.</p></div></div>
      {site.compliance.map((mapping) => (
        <div className="compliance-record" key={mapping.framework}>
          <strong>{mapping.framework}</strong>
          <span>{mapping.mappedControls} controls mapped</span>
          <em>{mapping.state}</em>
        </div>
      ))}
    </div>
  );
}

function HistoryPanel({ site }: { site: Site }) {
  return (
    <div className="detail-tab-panel generic-tab-panel">
      <div className="generic-panel-heading"><Activity size={16} /><div><h4>Immutable audit history</h4><p>Assessment, evidence and carrier-workflow events.</p></div></div>
      {site.activity.map((activity) => (
        <div className="history-record" key={activity.id}><Circle size={8} fill="currentColor" /><div><strong>{activity.action}</strong><small>{activity.actor}</small></div><time>{activity.relativeTime}</time></div>
      ))}
    </div>
  );
}

export function DetailPane({ site, activeTab, roleMode, onTabChange, onClose, onToggleFavorite, onEditSite, onArchiveSite, onDuplicateSite, onMarkReviewComplete, onRunAssessment }: DetailPaneProps) {
  const criticalRisks = site.risks.filter((risk) => risk.severity === "critical" && risk.status !== "closed").length;
  const servicesAssuredPercent = Math.round((site.criticalServices.filter((service) => assuredServiceStates.includes(service.assuranceState)).length / Math.max(site.criticalServices.length, 1)) * 100);
  const [menuOpen, setMenuOpen] = useState(false);

  const runAction = (action?: () => void) => {
    setMenuOpen(false);
    action?.();
  };

  return (
    <aside className="detail-pane" aria-label={`${site.code} ${site.name} details`}>
      <div className="detail-header">
        <div className="detail-header-actions">
          <span className={`site-type-chip ${site.type.includes("Branch") ? "type-amber" : site.type.includes("Edge") ? "type-red" : "type-green"}`}>{site.type}</span>
          <div>
            <button type="button" className={site.favorite ? "active" : ""} onClick={onToggleFavorite} aria-label="Toggle favorite"><Star size={17} fill={site.favorite ? "currentColor" : "none"} /></button>
            <div className="detail-action-menu">
              <button type="button" aria-label="More site actions" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}><MoreVertical size={17} /></button>
              {menuOpen ? (
                <div className="detail-action-dropdown" role="menu">
                  <button type="button" role="menuitem" onClick={() => runAction(onRunAssessment)}>Run Assessment</button>
                  <button type="button" role="menuitem" onClick={() => runAction(onEditSite)}>Edit Site</button>
                  <button type="button" role="menuitem" onClick={() => runAction(onDuplicateSite)}>Duplicate as Draft</button>
                  <button type="button" role="menuitem" onClick={() => runAction(onMarkReviewComplete)}>Mark Review Complete</button>
                  <button type="button" role="menuitem" onClick={() => runAction(() => onTabChange("history"))}>View Audit History</button>
                  <button type="button" role="menuitem" className="danger" onClick={() => runAction(onArchiveSite)}>Archive Site</button>
                </div>
              ) : null}
            </div>
            <button type="button" onClick={onClose} aria-label="Close detail pane"><X size={17} /></button>
          </div>
        </div>
        <h2>{site.code} – {site.name}</h2>
        <p className="detail-location"><MapPin size={13} /> {site.city}, {site.countryName}<span className="registry-chip"><i /> {registryStateLabels[site.registryState]}</span></p>
        <div className="detail-score-row">
          <ScoreRing score={site.score.score} band={site.score.band} size="detail" />
          <div>
            <span>Architecture Assurance</span>
            <strong className={`health-${site.score.band}`}>{site.score.label}{site.score.provisional ? " (Provisional)" : ""}</strong>
            <small>Assessment snapshot: {site.score.assessedAt}</small>
          </div>
          {roleMode === "carrier" ? <em className="carrier-scope-chip">Scoped carrier view</em> : null}
        </div>
      </div>

      <div className="detail-metric-strip">
        <div><strong><Network size={13} /> {site.carrierConnections.length}</strong><span>Carriers</span></div>
        <div><strong><GitBranch size={13} /> {site.dependencyCount}</strong><span>Dependencies</span></div>
        <div><strong><ShieldCheck size={13} /> {criticalRisks}</strong><span>Open Critical Risks</span></div>
        <div><strong><Circle size={11} /> {servicesAssuredPercent}%</strong><span>Services Assured</span></div>
      </div>

      <div className="detail-tabs" role="tablist">
        {tabLabels.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
            {tab.id === "risks" ? <em>{site.risks.length}</em> : null}
            {tab.id === "dependencies" ? <em>{site.dependencyCount}</em> : null}
          </button>
        ))}
      </div>

      <div className="detail-body">
        {activeTab === "overview" ? <OverviewPanel site={site} /> : null}
        {activeTab === "resilience" ? <ResiliencePanel site={site} /> : null}
        {activeTab === "risks" ? <RisksPanel site={site} /> : null}
        {activeTab === "dependencies" ? <DependenciesPanel site={site} /> : null}
        {activeTab === "compliance" ? <CompliancePanel site={site} /> : null}
        {activeTab === "history" ? <HistoryPanel site={site} /> : null}
      </div>
    </aside>
  );
}
