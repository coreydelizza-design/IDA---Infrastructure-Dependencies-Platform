import { Bell, ChevronDown, CircleCheckBig, Shield, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RoleMode } from "../domain/models";
import { useRegistry } from "../application/registryContext";
import type { WorkspacePage } from "../application/useRegistryState";

interface TopNavigationProps {
  activePage: WorkspacePage;
  roleMode: RoleMode;
  onNavigate: (page: WorkspacePage) => void;
  onRoleModeChange: (mode: RoleMode) => void;
}

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

function TenantSelector() {
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

export function TopNavigation({ activePage, roleMode, onNavigate, onRoleModeChange }: TopNavigationProps) {
  const registry = useRegistry();
  const { branding } = registry;
  return (
    <header className="top-navigation">
      <button
        className={`brand${branding.logoUrl ? " has-logo" : ""}`}
        type="button"
        onClick={() => onNavigate("sites")}
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
        <TenantSelector />

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
          {/* Role modes drive carrier/LOA collaboration, which is a full-tier feature. */}
          {registry.isPageAvailable("loa") ? (
            <div className="role-mode-toggle" aria-label="Workspace role mode">
              <button className={roleMode === "loa" ? "active" : ""} type="button" onClick={() => onRoleModeChange("loa")}>LOA View</button>
              <button className={roleMode === "carrier" ? "active" : ""} type="button" onClick={() => onRoleModeChange("carrier")}>Carrier View</button>
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
