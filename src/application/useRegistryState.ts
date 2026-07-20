import { useCallback, useMemo, useState } from "react";
import { useRegistry } from "./registryContext";
import type { AuditEvent, DetailTab, InventoryView, RoleMode, Site, SiteRecord } from "../domain";

export type WorkspacePage =
  | "sites"
  | "dashboard"
  | "critical-services"
  | "dependencies"
  | "assessments"
  | "risk-register"
  | "compliance"
  | "dora"
  | "ict"
  | "scenarios"
  | "tests"
  | "remediation"
  | "loa"
  | "carrier-engagements"
  | "documents"
  | "configuration"
  | "users"
  | "audit"
  | "network"
  | "resilience"
  | "requirements"
  | "reports"
  | "administration";

function initialParam(name: string): string | null {
  return typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(name);
}

function auditEvent(partial: Omit<AuditEvent, "id" | "timestamp" | "actorUserId" | "actorRole" | "source">): AuditEvent {
  return {
    id: `audit-${partial.action}-${partial.entityId}-${Date.now()}`,
    actorUserId: "user-consultant-1",
    actorRole: "consultant",
    timestamp: new Date().toISOString(),
    source: "local",
    ...partial,
  };
}

export function useRegistryState() {
  const registry = useRegistry();
  const { repositories, refresh, currentEngagement } = registry;
  const sites = registry.sites;

  const [selectedSiteId, setSelectedSiteId] = useState(initialParam("site") ?? "site-dc1-london");
  const [detailsOpen, setDetailsOpen] = useState(initialParam("panel") !== "closed");
  const [activeTab, setActiveTab] = useState<DetailTab>((initialParam("tab") as DetailTab) ?? "overview");
  const [inventoryView, setInventoryView] = useState<InventoryView>((initialParam("view") as InventoryView) ?? "grid");
  const [roleMode, setRoleMode] = useState<RoleMode>((initialParam("mode") as RoleMode) ?? "loa");
  const [activePage, setActivePage] = useState<WorkspacePage>("sites");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");

  const updateUrl = useCallback((patch: Record<string, string | null>) => {
    const next = new URL(window.location.href);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.searchParams.delete(key);
      else next.searchParams.set(key, value);
    }
    window.history.replaceState({}, "", next);
  }, []);

  const selectSite = useCallback(
    (siteId: string) => {
      setSelectedSiteId(siteId);
      setDetailsOpen(true);
      setActivePage("sites");
      updateUrl({ site: siteId, panel: null });
    },
    [updateUrl],
  );

  const closeDetails = useCallback(() => {
    setDetailsOpen(false);
    updateUrl({ panel: "closed" });
  }, [updateUrl]);

  const changeTab = useCallback((tab: DetailTab) => { setActiveTab(tab); updateUrl({ tab }); }, [updateUrl]);
  const changeView = useCallback((view: InventoryView) => { setInventoryView(view); updateUrl({ view }); }, [updateUrl]);
  const changeRoleMode = useCallback((mode: RoleMode) => { setRoleMode(mode); updateUrl({ mode }); }, [updateUrl]);

  const toggleFavorite = useCallback(
    async (siteId: string) => {
      const found = await repositories.sites.getById(siteId);
      if (!found.ok) return;
      const updated = { ...found.value, favorite: !found.value.favorite, updatedAt: new Date().toISOString(), version: found.value.version + 1 };
      await repositories.sites.update(updated);
      await repositories.audit.append(auditEvent({ engagementId: updated.engagementId, entityType: "site", entityId: siteId, action: "site-updated", beforeSummary: `favorite=${found.value.favorite}`, afterSummary: `favorite=${updated.favorite}` }));
      refresh();
    },
    [repositories, refresh],
  );

  const addSite = useCallback(
    async (record: SiteRecord) => {
      const created = await repositories.sites.create(record);
      if (!created.ok) return;
      await repositories.audit.append(auditEvent({ engagementId: record.engagementId, entityType: "site", entityId: record.id, action: "site-created", beforeSummary: null, afterSummary: `${record.code} – ${record.name}` }));
      refresh();
      selectSite(record.id);
    },
    [repositories, refresh, selectSite],
  );

  const archiveSite = useCallback(
    async (siteId: string) => {
      const archived = await repositories.sites.archive(siteId);
      if (!archived.ok) return;
      await repositories.audit.append(auditEvent({ engagementId: archived.value.engagementId, entityType: "site", entityId: siteId, action: "site-archived", beforeSummary: null, afterSummary: "archived" }));
      refresh();
    },
    [repositories, refresh],
  );

  const markReviewComplete = useCallback(
    async (siteId: string) => {
      const found = await repositories.sites.getById(siteId);
      if (!found.ok) return;
      const before = found.value.registryState;
      const updated = { ...found.value, registryState: "consultant-verified" as const, lastVerifiedAt: "Just now", nextReviewAt: "in 90 days", updatedAt: new Date().toISOString(), version: found.value.version + 1 };
      await repositories.sites.update(updated);
      await repositories.audit.append(auditEvent({ engagementId: updated.engagementId, entityType: "site", entityId: siteId, action: "registry-state-changed", beforeSummary: before, afterSummary: "consultant-verified" }));
      refresh();
    },
    [repositories, refresh],
  );

  const duplicateAsDraft = useCallback(
    async (siteId: string) => {
      const found = await repositories.sites.getById(siteId);
      if (!found.ok) return;
      const src = found.value;
      const newId = `${src.id}-copy`;
      const copy = { ...src, id: newId, code: `${src.code}-COPY`, name: `${src.name} (Draft)`, registryState: "draft" as const, assessmentStatus: "data-collection" as const, favorite: false, archivedAt: null, version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const created = await repositories.sites.create(copy);
      if (!created.ok) return;
      await repositories.audit.append(auditEvent({ engagementId: copy.engagementId, entityType: "site", entityId: newId, action: "site-created", beforeSummary: `duplicated from ${src.id}`, afterSummary: copy.code }));
      refresh();
      selectSite(newId);
    },
    [repositories, refresh, selectSite],
  );

  const filteredSites = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return sites.filter((site) => {
      const searchText = [
        site.code, site.name, site.city, site.countryCode, site.countryName, site.type, site.locationType,
        ...site.tags,
        ...site.carrierConnections.flatMap((c) => [c.contractedCarrier, c.underlyingCarrier]),
      ].join(" ").toLowerCase();
      return (
        (!normalized || searchText.includes(normalized)) &&
        (typeFilter === "all" || site.type === typeFilter) &&
        (locationFilter === "all" || site.locationType === locationFilter) &&
        (countryFilter === "all" || site.countryCode === countryFilter) &&
        (healthFilter === "all" || site.score.band === healthFilter)
      );
    });
  }, [sites, search, typeFilter, locationFilter, countryFilter, healthFilter]);

  const selectedSite: Site | undefined = sites.find((site) => site.id === selectedSiteId) ?? sites[0];

  return {
    sites,
    siteRecords: registry.siteRecords,
    filteredSites,
    selectedSite,
    selectedSiteId,
    detailsOpen,
    activeTab,
    inventoryView,
    roleMode,
    activePage,
    search,
    typeFilter,
    locationFilter,
    countryFilter,
    healthFilter,
    portfolioSummary: registry.portfolioSummary,
    engagementId: currentEngagement?.id ?? null,
    setActivePage,
    setSearch,
    setTypeFilter,
    setLocationFilter,
    setCountryFilter,
    setHealthFilter,
    selectSite,
    closeDetails,
    changeTab,
    changeView,
    changeRoleMode,
    toggleFavorite,
    addSite,
    archiveSite,
    markReviewComplete,
    duplicateAsDraft,
  };
}
