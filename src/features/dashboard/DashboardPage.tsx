import { ArrowRight, FileText, PanelsTopLeft, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { useRegistry } from "../../application/registryContext";
import type { WorkspacePage } from "../../application/useRegistryState";
import { buildDashboard, ENGAGEMENT_STATUS_LABELS, type HealthBand } from "../../domain";

interface DashboardPageProps {
  onNavigate: (page: WorkspacePage) => void;
}

const BAND_ORDER: HealthBand[] = ["excellent", "good", "at-risk", "critical"];
const BAND_LABEL: Record<HealthBand, string> = { excellent: "Excellent", good: "Good", "at-risk": "At Risk", critical: "Critical" };

/**
 * Customer-facing resilience dashboard: a read-only, point-in-time, leadership
 * summary scoped to the current engagement and branded to the enterprise. Never
 * a live/operational reading — assurance describes documented, evidenced
 * architecture at a point in time.
 */
export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const registry = useRegistry();
  const metrics = useMemo(() => buildDashboard(registry.siteRecords), [registry.siteRecords]);
  const enterpriseName = registry.branding.brandName;
  const engagement = registry.currentEngagement;
  const total = metrics.siteCount || 1;

  return (
    <main className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">Point-in-time assurance · read only</span>
          <h1>Resilience Dashboard</h1>
          <p>{enterpriseName}{engagement ? ` · ${engagement.name} (${engagement.code})` : ""}{engagement ? ` · ${ENGAGEMENT_STATUS_LABELS[engagement.status]}` : ""}</p>
        </div>
        <div className="dashboard-heading-actions">
          <button type="button" className="secondary-button" onClick={() => onNavigate("sites")}><PanelsTopLeft size={13} /> Site registry</button>
          <button type="button" className="secondary-button" onClick={() => onNavigate("reports")}><FileText size={13} /> Reports</button>
        </div>
      </div>

      <div className="dashboard-kpis">
        <section className="dashboard-kpi kpi-hero">
          <span>Portfolio assurance</span>
          <strong className={`health-${metrics.averageBand}`}>{metrics.averageAssurance}</strong>
          <small className={`health-${metrics.averageBand}`}>{metrics.averageLabel}</small>
        </section>
        <section className="dashboard-kpi"><span>Sites assessed</span><strong>{metrics.siteCount}</strong><small>{metrics.countryCount} countries</small></section>
        <section className="dashboard-kpi"><span>Publishable</span><strong>{metrics.publishableCount}</strong><small>{metrics.provisionalCount} provisional</small></section>
        <section className="dashboard-kpi"><span>Evidence confidence</span><strong>{metrics.averageEvidenceConfidence}%</strong><small>{metrics.assessmentCoveragePercent}% coverage</small></section>
        <section className="dashboard-kpi"><span>Open critical risks</span><strong className={metrics.openCriticalRiskCount > 0 ? "risk-text" : "no-risk-text"}>{metrics.openCriticalRiskCount}</strong><small>{metrics.totalOpenRiskCount} open total</small></section>
      </div>

      <div className="dashboard-body">
        <section className="dashboard-panel dashboard-distribution">
          <div className="dashboard-panel-head"><h2>Assurance distribution</h2><span>{metrics.siteCount} assessed sites</span></div>
          <div className="dashboard-bar" role="img" aria-label="Assurance band distribution">
            {BAND_ORDER.map((band) => metrics.bands[band] > 0 ? (
              <span key={band} className={`dashboard-bar-seg band-fill-${band}`} style={{ flexGrow: metrics.bands[band] }} title={`${BAND_LABEL[band]}: ${metrics.bands[band]}`} />
            ) : null)}
          </div>
          <div className="dashboard-legend">
            {BAND_ORDER.map((band) => (
              <div key={band} className="dashboard-legend-item">
                <span className={`dashboard-dot band-fill-${band}`} aria-hidden="true" />
                <strong>{metrics.bands[band]}</strong>
                <span>{BAND_LABEL[band]}</span>
                <em>{Math.round((metrics.bands[band] / total) * 100)}%</em>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-panel dashboard-attention">
          <div className="dashboard-panel-head"><h2>Sites needing attention</h2><span>{metrics.attention.length}</span></div>
          {metrics.attention.length > 0 ? (
            <div className="dashboard-attention-list">
              {metrics.attention.map((s) => (
                <button key={s.id} type="button" className="dashboard-attention-row" onClick={() => onNavigate("sites")}>
                  <span className={`dashboard-score health-${s.band}`}>{s.score}</span>
                  <span className="dashboard-attention-main">
                    <strong>{s.code} – {s.name}</strong>
                    <small>{s.location} · {s.reason}</small>
                  </span>
                  <span className={s.openRiskCount > 0 ? "risk-text" : "no-risk-text"}>{s.openRiskCount > 0 ? `${s.openRiskCount} open` : "—"}</span>
                  <ArrowRight size={13} />
                </button>
              ))}
            </div>
          ) : (
            <div className="dashboard-clear"><ShieldCheck size={20} /><p>No sites currently flagged — all assessed sites are within tolerance.</p></div>
          )}
        </section>
      </div>

      <p className="dashboard-footnote">Architecture assurance describes documented, evidenced architecture at a point in time. It is not a live operational reading and does not certify legal compliance.</p>
    </main>
  );
}
