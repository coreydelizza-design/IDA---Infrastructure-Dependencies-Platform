import { Plus } from "lucide-react";

export function AddSiteCard({ compact = true, onClick }: { compact?: boolean; onClick: () => void }) {
  return (
    <button className={`add-site-card ${compact ? "compact" : ""}`} type="button" onClick={onClick}>
      <span className="add-site-icon"><Plus size={19} /></span>
      <span className="add-site-copy">
        <strong>Add New Site</strong>
        <small>Register a new site or location</small>
      </span>
    </button>
  );
}
