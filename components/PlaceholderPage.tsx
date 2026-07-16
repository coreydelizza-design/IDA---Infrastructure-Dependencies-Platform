import { Blocks, Construction, ShieldCheck } from "lucide-react";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="placeholder-page">
      <div className="placeholder-card">
        <span><Construction size={22} /></span>
        <h1>{title}</h1>
        <p>The enterprise code spine and navigation boundary are active. This module is ready for its domain-specific workflow without changing the locked Site Inventory screen.</p>
        <div><span><Blocks size={14} /> Modular domain boundary</span><span><ShieldCheck size={14} /> Tenant-ready policy layer</span></div>
      </div>
    </main>
  );
}
