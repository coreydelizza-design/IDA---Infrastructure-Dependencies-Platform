import { Lock } from "lucide-react";

interface LiteGatePageProps {
  title: string;
  onGoToInventory: () => void;
}

/** Shown when a full-tier workspace is reached while the enterprise is on the
 *  lite tier (e.g. a deep link). The core registry stays fully available. */
export function LiteGatePage({ title, onGoToInventory }: LiteGatePageProps) {
  return (
    <main className="secondary-workspace-page lite-gate-page">
      <div className="lite-gate-card">
        <span className="lite-gate-icon"><Lock size={22} /></span>
        <span className="eyebrow">Lite edition</span>
        <h1>{title} is part of the full edition</h1>
        <p>This deployment runs the core registry. Assessments, carrier collaboration, connectors, compliance mapping, and regulatory export are available in the full edition.</p>
        <button type="button" className="primary-button" onClick={onGoToInventory}>Go to Site Inventory</button>
      </div>
    </main>
  );
}
