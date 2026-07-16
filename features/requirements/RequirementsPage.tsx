import { BookOpenCheck, CheckCircle2, FileDown, ShieldCheck } from "lucide-react";

const frameworks = [
  { name: "DORA", scope: "ICT third-party risk and resilience", controls: 42, coverage: 88 },
  { name: "ICT (EU)", scope: "ICT service dependency registry", controls: 31, coverage: 84 },
  { name: "NIS2", scope: "Cybersecurity risk measures", controls: 29, coverage: 79 },
  { name: "ISO 22301", scope: "Business continuity management", controls: 24, coverage: 91 },
];

export function RequirementsPage() {
  return (
    <main className="secondary-workspace-page requirements-page">
      <div className="secondary-page-heading"><div><span className="eyebrow">Requirement-aware registry</span><h1>Requirements</h1><p>Map neutral infrastructure controls to jurisdictional and contractual obligations.</p></div><button className="secondary-button" type="button"><FileDown size={15} /> Export mapping</button></div>
      <div className="framework-grid">
        {frameworks.map((framework) => (
          <section key={framework.name}>
            <div className="framework-icon"><ShieldCheck size={19} /></div>
            <span>{framework.name}</span>
            <h2>{framework.scope}</h2>
            <div className="coverage-row"><strong>{framework.coverage}%</strong><div><i style={{ width: `${framework.coverage}%` }} /></div></div>
            <small>{framework.controls} controls mapped</small>
          </section>
        ))}
      </div>
      <section className="requirements-matrix-panel">
        <div className="panel-heading"><div><h2>Control-to-evidence matrix</h2><p>Site health, risk acceptance, evidence confidence, and compliance mapping remain separate facts.</p></div><BookOpenCheck size={19} /></div>
        <div className="requirements-matrix">
          <div className="table-head"><span>Neutral control</span><span>DORA</span><span>ICT (EU)</span><span>NIS2</span><span>Evidence</span></div>
          {["Carrier and underlying-provider inventory", "Physical and logical route diversity", "Critical service dependency mapping", "Third-party concentration monitoring", "Resilience testing and remediation"].map((control, index) => (
            <div className="matrix-row" key={control}><strong>{control}</strong><span><CheckCircle2 size={14} /></span><span><CheckCircle2 size={14} /></span><span>{index === 1 ? "—" : <CheckCircle2 size={14} />}</span><em>{index < 3 ? "High" : "Medium"}</em></div>
          ))}
        </div>
      </section>
    </main>
  );
}
