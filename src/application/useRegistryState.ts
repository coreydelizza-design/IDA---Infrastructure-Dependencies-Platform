import { useCallback, useMemo, useState } from "react";
import { canonicalPortfolioSummary, canonicalSites } from "../data/canonicalData";
import type { DetailTab, InventoryView, RoleMode, Site } from "../domain/models";

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

export function useRegistryState() {
  const [sites, setSites] = useState<Site[]>(canonicalSites);
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

  const changeTab = useCallback(
    (tab: DetailTab) => {
      setActiveTab(tab);
      updateUrl({ tab });
    },
    [updateUrl],
  );

  const changeView = useCallback(
    (view: InventoryView) => {
      setInventoryView(view);
      updateUrl({ view });
    },
    [updateUrl],
  );

  const changeRoleMode = useCallback(
    (mode: RoleMode) => {
      setRoleMode(mode);
      updateUrl({ mode });
    },
    [updateUrl],
  );

  const toggleFavorite = useCallback((siteId: string) => {
    setSites((current) =>
      current.map((site) => (site.id === siteId ? { ...site, favorite: !site.favorite } : site)),
    );
  }, []);

  const addSite = useCallback((site: Site) => {
    setSites((current) => [...current, site]);
    setSelectedSiteId(site.id);
    setDetailsOpen(true);
  }, []);

  const filteredSites = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return sites.filter((site) => {
      const searchText = [
        site.code,
        site.name,
        site.city,
        site.countryCode,
        site.countryName,
        site.type,
        site.locationType,
        ...site.tags,
        ...site.carrierConnections.flatMap((connection) => [
          connection.contractedCarrier,
          connection.underlyingCarrier,
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!normalized || searchText.includes(normalized)) &&
        (typeFilter === "all" || site.type === typeFilter) &&
        (locationFilter === "all" || site.locationType === locationFilter) &&
        (countryFilter === "all" || site.countryCode === countryFilter) &&
        (healthFilter === "all" || site.score.band === healthFilter)
      );
    });
  }, [sites, search, typeFilter, locationFilter, countryFilter, healthFilter]);

  const selectedSite = sites.find((site) => site.id === selectedSiteId) ?? sites[0];

  return {
    sites,
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
    portfolioSummary: canonicalPortfolioSummary,
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
  };
}
