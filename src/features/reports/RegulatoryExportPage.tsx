import { AlertTriangle, Download, FileText, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRegulatoryExport } from "../../application/useRegulatoryExport";
import type { RegulatoryFramework } from "../../domain";

const stateClass: Record<string, string> = { mapped: "positive", gap: "risk-text", "not-applicable": "no-risk-text", unknown: "warning" };

export function RegulatoryExportPage() {
  const { frameworks, pkg, busy, generate, downloadMarkdown, downloadJson, downloadCsv } = useRegulatoryExport();
  const [framework, setFramework] = useState<RegulatoryFramework>(frameworks[0]);

  return (
    <main className="secondary-workspace-page export-page">
      <div className="secondary-page-heading">
        <div><span className="eyebrow">Point-in-time regulatory mapping</span><h1>Regulatory Export</h1><p>Generate a control-to-requirement mapping package. This is a mapping, not a legal-compliance determination.</p></div>
        <div className="export-framework-picker">
          {frameworks.map((f) => (
            <button key={f} type="button" className={framework === f ? "active" : ""} onClick={() => setFramework(f)}>{f}</button>
          ))}
          <button type="button" className="primary-button" disabled={busy} onClick={() => void generate(framework)}><FileText size={15} /> Generate {framework}</button>
        </div>
      </div>

      {!pkg ? (
        <div className="export-empty"><ShieldCheck size={22} /><p>Select a framework and generate a point-in-time mapping for the current engagement.</p></div>
      ) : (
        <>
          <div className="export-disclaimer"><AlertTriangle size={15} /><p>{pkg.disclaimer}</p></div>

          <div className="secondary-kpi-grid">
            <section><span>Scope</span><strong>{pkg.scopeSiteCount}</strong><small>sites · {pkg.framework}</small></section>
            <section><span>Publishable</span><strong>{pkg.summary.publishableSites}</strong><small>assessed</small></section>
            <section><span>Provisional</span><strong>{pkg.summary.provisionalSites}</strong><small>not yet publishable</small></section>
            <section><span>Requirement gaps</span><strong>{pkg.summary.totalRequirementGaps}</strong><small>{pkg.summary.sitesWithGaps} sites</small></section>
          </div>

          <div className="export-toolbar">
            <span>Generated {new Date(pkg.generatedAt).toLocaleString?.() ?? pkg.generatedAt}</span>
            <div>
              <button type="button" onClick={downloadMarkdown}><Download size={13} /> Markdown</button>
              <button type="button" onClick={downloadJson}><Download size={13} /> JSON</button>
              <button type="button" onClick={downloadCsv}><Download size={13} /> CSV</button>
            </div>
          </div>

          <div className="export-sites">
            {pkg.sites.map((site) => (
              <section className="export-site" key={site.siteId}>
                <div className="export-site-head">
                  <strong>{site.code} – {site.name}</strong>
                  <span>{site.archetype} · assurance {site.score} ({site.band}){site.provisional ? " · provisional" : ""} · coverage {site.coveragePercent}%</span>
                </div>
                <div className="export-req-table">
                  {site.requirements.map((req) => (
                    <div className="export-req-row" key={req.requirementId}>
                      <strong>{req.requirementId}</strong>
                      <span>{req.title}</span>
                      <em className={stateClass[req.state]}>{req.state}</em>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
