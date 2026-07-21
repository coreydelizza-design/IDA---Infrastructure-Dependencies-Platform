import { Bell, ChevronDown, CircleCheckBig, FolderKanban, Shield, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRegistry } from "../application/registryContext";
import { usePersona } from "../application/persona";
import type { WorkspacePage } from "../application/useRegistryState";

interface TopNavigationProps {
  activePage: WorkspacePage;
  onNavigate: (page: WorkspacePage) => void;
}

// Note: the primary nav mirrors the locked reference exactly. "Return to
// projects" is deliberately NOT a top-nav item (that would alter the locked
// Site Inventory header) — it lives on the brand (home) and in the tenant
// popover instead.
const topItems: Array<{ label: string; page: WorkspacePage }> = [
  { label: "Sites", page: "sites" },
  { label: "Network", page: "network" },
  { label: "Resilience", page: "resilience" },
  { label: "Risk Register", page: "risk-register" },
  { label: "Requirements", page: "requirements" },
  { label: "Reports", page: "reports" },
  { label: "Administration", page: "administration" },
];

const engagementStatusLabel = (status: string) => status.replaceAll("-", " ");

function TenantSelector({ onViewAllProjects }: { onViewAllProjects?: () => void }) {
  const registry = useRegistry();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const enterpriseName = registry.currentEnterprise?.name ?? "No enterprise";

  return (
    <div className="tenant-selector-wrap" ref={ref}>
      <button className="tenant-selector" type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="dialog" aria-expanded={open}>
        <span>{enterpriseName}</span>
        <ChevronDown size={14} />
      </button>
      {open ? (
        <div className="tenant-popover" role="dialog" aria-label="Engagement context">
          {onViewAllProjects ? (
            <button type="button" className="tenant-popover-projects" onClick={() => { setOpen(false); onViewAllProjects(); }}>
              <FolderKanban size={13} /> All projects
            </button>
          ) : null}
          <div className="tenant-popover-section">
            <label>Enterprise</label>
            <select value={registry.currentEnterprise?.id ?? ""} onChange={(event) => registry.selectEnterprise(event.target.value)}>
              {registry.enterprises.map((enterprise) => (
                <option key={enterprise.id} value={enterprise.id}>{enterprise.name}</option>
              ))}
            </select>
          </div>
          <div className="tenant-popover-section">
            <label>Engagement</label>
            <select value={registry.currentEngagement?.id ?? ""} onChange={(event) => registry.selectEngagement(event.target.value)}>
              {registry.engagements.map((engagement) => (
                <option key={engagement.id} value={engagement.id}>{engagement.name}</option>
              ))}
            </select>
          </div>
          <div className="tenant-popover-meta">
            <span>Status</span>
            <em className={`status-pill ${registry.currentEngagement?.status ?? ""}`}>
              {registry.currentEngagement ? engagementStatusLabel(registry.currentEngagement.status) : "—"}
            </em>
          </div>
          <p className="tenant-popover-note">Registry queries are scoped to this engagement. Create/edit/archive of engagements arrives in the next increment.</p>
        </div>
      ) : null}
    </div>
  );
}

export function TopNavigation({ activePage, onNavigate }: TopNavigationProps) {
  const registry = useRegistry();
  const { branding } = registry;
  const { persona, setPersona, capabilities } = usePersona();
  const home: WorkspacePage = capabilities.canSeeAllProjects ? "projects" : "sites";
  // The top-bar pills switch the operator between their Workspace and a read-only
  // preview of exactly what the selected client sees (their Customer Dashboard).
  // The client pill is labelled with the currently selected enterprise.
  const clientName = registry.currentEnterprise?.name ?? "Customer";
  const selectWorkspace = () => { if (persona !== "consultant") { setPersona("consultant"); onNavigate("projects"); } };
  const selectClientView = () => { if (persona !== "customer") { setPersona("customer"); onNavigate("dashboard"); } };
  return (
    <header className="top-navigation">
      <button
        className={`brand${branding.logoUrl ? " has-logo" : ""}`}
        type="button"
        onClick={() => onNavigate(home)}
        aria-label={`${branding.brandName} home`}
      >
        <span className="brand-mark">
          {branding.logoUrl ? (
            <img className="brand-logo" src={branding.logoUrl} alt={branding.logoAlt} />
          ) : (
            <Shield size={27} strokeWidth={2.25} />
          )}
        </span>
        <span className="brand-copy">
          <strong>{branding.brandName}</strong>
          <small>{branding.productLabel}</small>
        </span>
      </button>

      <div className="top-navigation-main">
        <TenantSelector onViewAllProjects={capabilities.canSeeAllProjects ? () => onNavigate("projects") : undefined} />

        <nav className="primary-nav" aria-label="Primary navigation">
          {topItems.filter((item) => registry.isPageAvailable(item.page)).map((item) => (
            <button
              key={item.page}
              type="button"
              className={activePage === item.page || (item.page === "sites" && activePage === "sites") ? "active" : ""}
              onClick={() => onNavigate(item.page)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="top-navigation-actions">
          {/* Workspace ↔ Customer view. The operator works in Workspace (registry,
              LOA, carrier, reconciliation) and can preview the read-only dashboard
              the selected client sees. The client pill tracks the chosen enterprise. */}
          {registry.currentEnterprise ? (
            <div className="role-mode-toggle view-mode-toggle" role="radiogroup" aria-label="View mode">
              <button role="radio" aria-checked={persona === "consultant"} className={persona === "consultant" ? "active" : ""} type="button" onClick={selectWorkspace}>Workspace</button>
              <button role="radio" aria-checked={persona === "customer"} className={persona === "customer" ? "active" : ""} type="button" onClick={selectClientView} title={`Preview ${clientName}'s dashboard`}>
                <span className="view-mode-client">{clientName}</span>
              </button>
            </div>
          ) : null}
          <button className="header-icon status-icon" type="button" aria-label="System status"><CircleCheckBig size={17} /></button>
          <button className="header-icon notification-icon" type="button" aria-label="Notifications">
            <Bell size={17} />
            <span>11</span>
          </button>
          <button className="avatar" type="button" aria-label="User menu"><UserRound size={12} /><span>AB</span></button>
        </div>
      </div>
    </header>
  );
}
