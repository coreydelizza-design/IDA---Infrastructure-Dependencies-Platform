import type { PortfolioSummary as PortfolioSummaryModel } from "../domain/models";

export function PortfolioSummary({ summary }: { summary: PortfolioSummaryModel }) {
  return (
    <section className="portfolio-summary" aria-label="Portfolio resiliency summary">
      <div className="summary-cell total">
        <span>Total Sites</span>
        <strong>{summary.totalSites}</strong>
        <small>Across {summary.countries} Countries</small>
      </div>
      <div className="summary-cell">
        <span>Excellent (90–100)</span>
        <strong className="health-excellent">{summary.excellent.count}</strong>
        <small>{summary.excellent.percentage}%</small>
      </div>
      <div className="summary-cell">
        <span>Good (70–89)</span>
        <strong className="health-excellent">{summary.good.count}</strong>
        <small>{summary.good.percentage}%</small>
      </div>
      <div className="summary-cell">
        <span className="health-good">At Risk (40–69)</span>
        <strong className="health-good">{summary.atRisk.count}</strong>
        <small className="health-good">{summary.atRisk.percentage}%</small>
      </div>
      <div className="summary-cell">
        <span className="health-critical">Critical (0–39)</span>
        <strong className="health-critical">{summary.critical.count}</strong>
        <small className="health-critical">{summary.critical.percentage}%</small>
      </div>
      <div className="summary-cell average">
        <span>Avg. Resiliency Health</span>
        <div className="average-score-row">
          <strong className="health-excellent">{summary.averageScore}</strong>
          <svg viewBox="0 0 72 22" aria-hidden="true">
            <polyline points="0,12 8,10 14,12 22,11 29,13 37,12 44,14 52,13 60,16 68,15 72,16" />
          </svg>
        </div>
        <small className="health-good">{summary.averageLabel}</small>
      </div>
    </section>
  );
}
