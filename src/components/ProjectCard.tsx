import { ArrowRight } from "lucide-react";
import { ENGAGEMENT_STATUS_LABELS, type ProjectSummary } from "../domain";

interface ProjectCardProps {
  project: ProjectSummary;
  active: boolean;
  onOpen: () => void;
}

/** Status → tone bucket for the pill (matches the registry's status semantics). */
function statusTone(status: ProjectSummary["status"]): string {
  switch (status) {
    case "published":
    case "periodic-review":
      return "tone-green";
    case "assessment":
    case "consultant-reconciliation":
    case "carrier-confirmation":
    case "enterprise-validation":
      return "tone-blue";
    case "data-collection":
    case "scoping":
      return "tone-amber";
    case "closed":
      return "tone-slate";
    default:
      return "tone-slate";
  }
}

export function ProjectCard({ project, active, onOpen }: ProjectCardProps) {
  return (
    <article
      className={`project-card ${active ? "active" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={`Open project ${project.name} for ${project.enterpriseName}`}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
    >
      <div className="project-card-top">
        <span className={`project-status ${statusTone(project.status)}`}>{ENGAGEMENT_STATUS_LABELS[project.status]}</span>
        <span className="project-card-code">{project.code}</span>
      </div>

      <div className="project-card-title">
        <h3>{project.name}</h3>
        <p>{project.enterpriseName}</p>
      </div>

      <div className="project-card-metrics">
        <div><strong>{project.siteCount}</strong><span>Sites</span></div>
        <div><strong>{project.countryCount}</strong><span>Countries</span></div>
        <div><strong>{project.publishableCount}</strong><span>Publishable</span></div>
        <div className={project.openRiskCount > 0 ? "metric-risk" : ""}><strong>{project.openRiskCount}</strong><span>Open risks</span></div>
      </div>

      <div className="project-progress" aria-hidden="true">
        <span style={{ width: `${Math.round(project.progress * 100)}%` }} />
      </div>

      <div className="project-card-footer">
        <span className="project-scope">{project.scopeStatement}</span>
        <ArrowRight size={14} />
      </div>
    </article>
  );
}
