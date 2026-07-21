import {
  Activity,
  Archive,
  Blocks,
  BookOpenCheck,
  Boxes,
  Cable,
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  CloudCog,
  FileText,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Network,
  PanelsTopLeft,
  Route,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  TestTube2,
  UserRoundCog,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import { useRegistry } from "../application/registryContext";
import type { WorkspacePage } from "../application/useRegistryState";

interface SidebarProps {
  activePage: WorkspacePage;
  onNavigate: (page: WorkspacePage) => void;
}

interface SidebarItemModel {
  label: string;
  page: WorkspacePage;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  badge?: string;
  badgeTone?: "green" | "amber";
}

interface SidebarSectionModel {
  label: string;
  items: SidebarItemModel[];
}

const sections: SidebarSectionModel[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", page: "dashboard", icon: LayoutDashboard },
      { label: "Site Inventory", page: "sites", icon: PanelsTopLeft },
      { label: "Critical Services", page: "critical-services", icon: Gauge },
      { label: "Dependencies", page: "dependencies", icon: GitBranch },
      { label: "Assessments", page: "assessments", icon: ClipboardCheck },
    ],
  },
  {
    label: "Risk & Compliance",
    items: [
      { label: "Risk Register", page: "risk-register", icon: ShieldAlert, badge: "12", badgeTone: "amber" },
      { label: "Compliance Mapping", page: "compliance", icon: BookOpenCheck, badge: "New", badgeTone: "green" },
      { label: "DORA", page: "dora", icon: ShieldCheck },
      { label: "ICT (EU)", page: "ict", icon: Blocks, badge: "New", badgeTone: "green" },
    ],
  },
  {
    label: "Planning",
    items: [
      { label: "Resilience Scenarios", page: "scenarios", icon: Route },
      { label: "Tests & Exercises", page: "tests", icon: TestTube2 },
      { label: "Remediation Plans", page: "remediation", icon: ClipboardCheck, badge: "3", badgeTone: "amber" },
    ],
  },
  {
    label: "Collaboration",
    items: [
      { label: "LOA Workspace", page: "loa", icon: Users },
      { label: "Carrier Engagements", page: "carrier-engagements", icon: Cable, badge: "7", badgeTone: "amber" },
      { label: "Documents", page: "documents", icon: FileText },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Configuration", page: "configuration", icon: Settings },
      { label: "Users & Roles", page: "users", icon: UserRoundCog },
      { label: "Audit Log", page: "audit", icon: Activity },
    ],
  },
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { isPageAvailable } = useRegistry();
  const visibleSections = sections
    .map((section) => ({ ...section, items: section.items.filter((item) => isPageAvailable(item.page)) }))
    .filter((section) => section.items.length > 0);
  return (
    <aside className="sidebar" aria-label="Application navigation">
      <div className="sidebar-scroll">
        {visibleSections.map((section) => (
          <section className="sidebar-section" key={section.label}>
            <button className="sidebar-section-title" type="button">
              <span>{section.label}</span>
              <ChevronDown size={12} />
            </button>
            <div className="sidebar-section-items">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.page}
                    className={`sidebar-item ${activePage === item.page ? "active" : ""}`}
                    type="button"
                    onClick={() => onNavigate(item.page)}
                  >
                    <Icon size={16} strokeWidth={1.7} />
                    <span>{item.label}</span>
                    {item.badge ? <em className={`nav-badge ${item.badgeTone ?? "amber"}`}>{item.badge}</em> : null}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <button className="sidebar-collapse" type="button"><ChevronLeft size={14} /><span>Collapse</span></button>
    </aside>
  );
}
