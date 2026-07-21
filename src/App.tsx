import { useEffect, useState } from "react";
import { RegistryProvider } from "./application/registryContext";
import { useInspectorLayout } from "./application/inspectorLayout";
import { usePersona } from "./application/persona";
import { useRegistryState, type WorkspacePage } from "./application/useRegistryState";
import { ProjectInventoryPage } from "./features/projects/ProjectInventoryPage";
import { SiteIntakeModal } from "./components/intake/SiteIntakeModal";
import type { SiteRecord } from "./domain";
import { AppFooter } from "./components/AppFooter";
import { DetailPane } from "./components/DetailPane";
import { LiteGatePage } from "./components/LiteGatePage";
import { PlaceholderPage } from "./components/PlaceholderPage";
import { Sidebar } from "./components/Sidebar";
import { SiteInventoryPage } from "./components/SiteInventoryPage";
import { TopNavigation } from "./components/TopNavigation";
import { LoaWorkspace } from "./features/loa/LoaWorkspace";
import { RequirementsPage } from "./features/requirements/RequirementsPage";
import { ConnectorsPage } from "./features/connectors/ConnectorsPage";
import { RegulatoryExportPage } from "./features/reports/RegulatoryExportPage";
import { BrandingSettingsPage } from "./features/branding/BrandingSettingsPage";

const pageTitles: Record<WorkspacePage, string> = {
  projects: "Projects",
  sites: "Sites",
  dashboard: "Dashboard",
  "critical-services": "Critical Services",
  dependencies: "Dependencies",
  assessments: "Assessments",
  "risk-register": "Risk Register",
  compliance: "Compliance Mapping",
  dora: "DORA",
  ict: "ICT (EU)",
  scenarios: "Resilience Scenarios",
  tests: "Tests & Exercises",
  remediation: "Remediation Plans",
  loa: "LOA Workspace",
  "carrier-engagements": "Carrier Engagements",
  documents: "Documents",
  configuration: "Configuration",
  users: "Users & Roles",
  audit: "Audit Log",
  network: "Network",
  resilience: "Resilience",
  requirements: "Requirements",
  reports: "Reports",
  administration: "Administration",
};

export default function App() {
  return (
    <RegistryProvider>
      <AppShell />
    </RegistryProvider>
  );
}

function AppShell() {
  const registry = useRegistryState();
  const { layout: inspectorLayout } = useInspectorLayout();
  const { capabilities } = usePersona();
  const [intake, setIntake] = useState<{ open: boolean; mode: "create" | "edit"; editingSite: SiteRecord | null }>({ open: false, mode: "create", editingSite: null });

  const openCreate = () => setIntake({ open: true, mode: "create", editingSite: null });
  const openEdit = (siteId: string) => setIntake({ open: true, mode: "edit", editingSite: registry.siteRecords.find((s) => s.id === siteId) ?? null });
  const closeIntake = () => setIntake((s) => ({ ...s, open: false }));
  const openProject = (engagementId: string) => { registry.selectProject(engagementId); registry.setActivePage("sites"); };

  // Uniformly scale the locked 1672x941 console to fit the viewport while
  // preserving its exact aspect ratio (see docs/UI_LOCK.md). At the canonical
  // 1672x941 viewport the factor is 1, so the visual baseline is unchanged.
  useEffect(() => {
    const APP_WIDTH = 1672;
    const APP_HEIGHT = 941;
    const root = document.documentElement;
    const applyScale = () => {
      const scale = Math.min(window.innerWidth / APP_WIDTH, window.innerHeight / APP_HEIGHT);
      root.style.setProperty("--ui-scale", String(scale));
    };
    applyScale();
    window.addEventListener("resize", applyScale);
    window.addEventListener("orientationchange", applyScale);
    return () => {
      window.removeEventListener("resize", applyScale);
      window.removeEventListener("orientationchange", applyScale);
    };
  }, []);

  const pageGated = !registry.isPageAvailable(registry.activePage);
  // Consultant-only Project Inventory; a customer landing here is redirected to the registry.
  const showProjects = registry.activePage === "projects" && capabilities.canSeeAllProjects;
  const showSiteWorkspace = (registry.activePage === "sites" || (registry.activePage === "projects" && !capabilities.canSeeAllProjects)) && !pageGated;

  return (
    <div className="app-shell">
      <TopNavigation
        activePage={registry.activePage}
        roleMode={registry.roleMode}
        onNavigate={registry.setActivePage}
        onRoleModeChange={registry.changeRoleMode}
      />
      <Sidebar activePage={registry.activePage} onNavigate={registry.setActivePage} />

      <div className={`workspace ${showSiteWorkspace && registry.detailsOpen ? "with-detail" : "without-detail"}${showSiteWorkspace && registry.detailsOpen && inspectorLayout === "overlay" ? " overlay-inspector" : ""}`}>
        {showProjects ? (
          <ProjectInventoryPage onOpenProject={openProject} />
        ) : showSiteWorkspace ? (
          <>
            <SiteInventoryPage
              allSites={registry.sites}
              sites={registry.filteredSites}
              selectedSiteId={registry.selectedSiteId}
              search={registry.search}
              typeFilter={registry.typeFilter}
              locationFilter={registry.locationFilter}
              countryFilter={registry.countryFilter}
              healthFilter={registry.healthFilter}
              view={registry.inventoryView}
              summary={registry.portfolioSummary}
              onSearchChange={registry.setSearch}
              onTypeFilterChange={registry.setTypeFilter}
              onLocationFilterChange={registry.setLocationFilter}
              onCountryFilterChange={registry.setCountryFilter}
              onHealthFilterChange={registry.setHealthFilter}
              onViewChange={registry.changeView}
              onSelectSite={registry.selectSite}
              onToggleFavorite={registry.toggleFavorite}
              onAddSite={capabilities.canOperate ? openCreate : undefined}
            />
            {registry.detailsOpen && registry.selectedSite ? (
              <DetailPane
                site={registry.selectedSite}
                activeTab={registry.activeTab}
                roleMode={registry.roleMode}
                onTabChange={registry.changeTab}
                onClose={registry.closeDetails}
                onToggleFavorite={() => registry.selectedSite && registry.toggleFavorite(registry.selectedSite.id)}
                onEditSite={() => registry.selectedSite && openEdit(registry.selectedSite.id)}
                onArchiveSite={() => registry.selectedSite && registry.archiveSite(registry.selectedSite.id)}
                onDuplicateSite={() => registry.selectedSite && registry.duplicateAsDraft(registry.selectedSite.id)}
                onMarkReviewComplete={() => registry.selectedSite && registry.markReviewComplete(registry.selectedSite.id)}
                onRunAssessment={() => registry.selectedSite && registry.runAssessment(registry.selectedSite.id)}
              />
            ) : null}
          </>
        ) : pageGated ? (
          <LiteGatePage title={pageTitles[registry.activePage]} onGoToInventory={() => registry.setActivePage("sites")} />
        ) : registry.activePage === "loa" || registry.activePage === "carrier-engagements" ? (
          <LoaWorkspace />
        ) : registry.activePage === "documents" ? (
          <ConnectorsPage />
        ) : registry.activePage === "reports" ? (
          <RegulatoryExportPage />
        ) : registry.activePage === "administration" || registry.activePage === "configuration" ? (
          <BrandingSettingsPage />
        ) : registry.activePage === "requirements" || registry.activePage === "dora" || registry.activePage === "ict" || registry.activePage === "compliance" ? (
          <RequirementsPage />
        ) : (
          <PlaceholderPage title={pageTitles[registry.activePage]} />
        )}
      </div>

      <AppFooter />
      <SiteIntakeModal
        open={intake.open}
        mode={intake.mode}
        editingSite={intake.editingSite}
        onClose={closeIntake}
        onComplete={(siteId) => { registry.selectSite(siteId); closeIntake(); }}
      />
    </div>
  );
}
