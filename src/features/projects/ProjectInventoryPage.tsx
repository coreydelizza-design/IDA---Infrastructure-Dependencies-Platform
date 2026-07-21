import { FolderKanban, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useRegistry } from "../../application/registryContext";
import { ProjectCard } from "../../components/ProjectCard";

interface ProjectInventoryPageProps {
  onOpenProject: (engagementId: string) => void;
}

/**
 * The consultant's home: a portfolio of projects (engagements) across all
 * enterprise clients, laid out like the Site Inventory. Clicking a project
 * enters that engagement's operator workspace.
 */
export function ProjectInventoryPage({ onOpenProject }: ProjectInventoryPageProps) {
  const registry = useRegistry();
  const [search, setSearch] = useState("");

  const projects = registry.projects;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) =>
      [p.name, p.enterpriseName, p.code, p.status].some((v) => v.toLowerCase().includes(q)),
    );
  }, [projects, search]);

  const enterpriseCount = new Set(projects.map((p) => p.enterpriseClientId)).size;
  const activeId = registry.currentEngagement?.id ?? null;

  return (
    <main className="project-inventory-page">
      <div className="project-inventory-heading">
        <div>
          <span className="eyebrow">Portfolio</span>
          <h1>Project Inventory</h1>
          <p>{projects.length} engagements across {enterpriseCount} enterprise clients. Open a project to operate its registry.</p>
        </div>
        <div className="project-search">
          <Search size={14} />
          <input
            type="text"
            value={search}
            placeholder="Search projects, clients, status…"
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search projects"
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="project-grid-frame">
          <div className="project-grid">
            {filtered.map((p) => (
              <ProjectCard key={p.engagementId} project={p} active={p.engagementId === activeId} onOpen={() => onOpenProject(p.engagementId)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="project-empty">
          <FolderKanban size={22} />
          <p>No projects match “{search}”.</p>
        </div>
      )}
    </main>
  );
}
