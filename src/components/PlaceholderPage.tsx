import { ArrowLeft, Compass } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  onGoHome?: () => void;
  homeLabel?: string;
}

/**
 * Shown for workspaces that are on the roadmap but not yet built. Presents a
 * clear "planned" state (rather than an empty room) and a way back home, so the
 * navigation reads as intentional. The locked Site Inventory is never affected.
 */
export function PlaceholderPage({ title, onGoHome, homeLabel }: PlaceholderPageProps) {
  return (
    <main className="placeholder-page">
      <div className="placeholder-card">
        <span><Compass size={22} /></span>
        <span className="eyebrow">Planned workspace</span>
        <h1>{title}</h1>
        <p>This workspace is on the roadmap and isn’t available yet. The registry, project inventory, dashboard, contracts, and reports are the live surfaces today.</p>
        {onGoHome ? (
          <button type="button" className="primary-button" onClick={onGoHome}>
            <ArrowLeft size={14} /> Back to {homeLabel ?? "home"}
          </button>
        ) : null}
      </div>
    </main>
  );
}
