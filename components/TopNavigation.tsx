import { Bell, ChevronDown, CircleCheckBig, Shield, UserRound } from "lucide-react";
import type { RoleMode } from "../domain/models";
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

export function TopNavigation({ activePage, roleMode, onNavigate, onRoleModeChange }: TopNavigationProps) {
  return (
    <header className="top-navigation">
      <button className="brand" type="button" onClick={() => onNavigate("sites")} aria-label="ResiliLink home">
        <span className="brand-mark"><Shield size={27} strokeWidth={2.25} /></span>
        <span className="brand-copy">
          <strong>ResiliLink</strong>
          <small>Site Resiliency Registry</small>
        </span>
      </button>

      <div className="top-navigation-main">
        <button className="tenant-selector" type="button">
          <span>Enterprise Co.</span>
          <ChevronDown size={14} />
        </button>

        <nav className="primary-nav" aria-label="Primary navigation">
          {topItems.map((item) => (
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
          <div className="role-mode-toggle" aria-label="Workspace role mode">
            <button className={roleMode === "loa" ? "active" : ""} type="button" onClick={() => onRoleModeChange("loa")}>LOA View</button>
            <button className={roleMode === "carrier" ? "active" : ""} type="button" onClick={() => onRoleModeChange("carrier")}>Carrier View</button>
          </div>
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
