import {
  Building2,
  Cloud,
  GitBranch,
  HardDrive,
  Link2,
  Network,
  Server,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import type { Site } from "../domain/models";
import { ScoreRing } from "./ScoreRing";
import { StatusBadge } from "./StatusBadge";

interface SiteCardProps {
  site: Site;
  selected: boolean;
  compact?: boolean;
  listMode?: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

function typeClass(type: string): string {
  if (type.includes("Data Center")) return "type-green";
  if (type.includes("Trading")) return "type-green";
  if (type.includes("Branch") || type.includes("Regional")) return "type-amber";
  if (type.includes("Edge")) return "type-red";
  if (type.includes("Cloud")) return "type-green";
  return "type-slate";
}

const indicatorIcons = [Users, Server, Network, Cloud, ShieldCheck, GitBranch];

export function SiteCard({ site, selected, compact = false, listMode = false, onSelect, onToggleFavorite }: SiteCardProps) {
  const displayRiskCount = site.cardOpenRiskCount ?? site.risks.length;
  const carrierLabel = site.carrierConnections.length === 1 && site.type === "Cloud Region"
    ? "1 Provider"
    : `${site.carrierConnections.length} ${site.carrierConnections.length === 1 ? "Carrier" : "Carriers"}`;

  if (listMode) {
    return (
      <button className={`site-list-row ${selected ? "selected" : ""}`} type="button" onClick={onSelect}>
        <span className={`site-list-type ${typeClass(site.type)}`}>{site.type}</span>
        <strong>{site.code} – {site.name}</strong>
        <span>{site.city}, {site.countryCode}</span>
        <span className={`site-list-score health-${site.score.band}`}>{site.score.score}</span>
        <span>{carrierLabel}</span>
        <span className={displayRiskCount > 0 ? "risk-text" : "no-risk-text"}>{displayRiskCount > 0 ? `${displayRiskCount} open risks` : "No open risks"}</span>
      </button>
    );
  }

  return (
    <article
      className={`site-card ${selected ? "selected" : ""} ${compact ? "compact" : ""}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${site.code} ${site.name}`}
    >
      <img src={site.imageAsset} alt="" className="site-card-image" draggable={false} />
      <div className="site-card-overlay" />
      <div className="site-card-content">
        <div className="site-card-topline">
          <span className={`site-type-chip ${typeClass(site.type)}`}>{site.type}</span>
          <button
            type="button"
            className={`favorite-button ${site.favorite ? "active" : ""}`}
            aria-label={site.favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Star size={17} fill={site.favorite ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="site-card-title-block">
          <h3>{site.code} – {site.name}</h3>
          <p>{site.city}, {site.countryCode}</p>
        </div>

        <div className="site-card-score-row">
          <ScoreRing score={site.score.score} band={site.score.band} />
          <div className="site-card-health-label">
            <span>Architecture Assurance</span>
            <strong className={`health-${site.score.band}`}>{site.score.label}</strong>
          </div>
        </div>

        <div className="site-card-indicators" aria-label="Site resilience dimensions">
          {indicatorIcons.map((Icon, index) => <Icon key={index} size={13} strokeWidth={1.6} />)}
        </div>

        <div className="site-card-badge-row">
          <StatusBadge status={site.evidenceBadge} />
        </div>

        <div className="site-card-footer">
          <span>{carrierLabel}</span>
          <span className={displayRiskCount > 0 ? "risk-text" : "no-risk-text"}>
            {displayRiskCount > 0 ? `${displayRiskCount} Open risk${displayRiskCount === 1 ? "" : "s"}` : "No open risks"}
            <span aria-hidden="true">›</span>
          </span>
        </div>
      </div>
    </article>
  );
}
