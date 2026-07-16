import { Plus, RefreshCw } from "lucide-react";
import type { InventoryView, PortfolioSummary as PortfolioSummaryModel, Site } from "../domain/models";
import { AddSiteCard } from "./AddSiteCard";
import { InventoryToolbar } from "./InventoryToolbar";
import { PortfolioSummary } from "./PortfolioSummary";
import { SiteCard } from "./SiteCard";

interface SiteInventoryPageProps {
  allSites: Site[];
  sites: Site[];
  selectedSiteId: string;
  search: string;
  typeFilter: string;
  locationFilter: string;
  countryFilter: string;
  healthFilter: string;
  view: InventoryView;
  summary: PortfolioSummaryModel;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onLocationFilterChange: (value: string) => void;
  onCountryFilterChange: (value: string) => void;
  onHealthFilterChange: (value: string) => void;
  onViewChange: (view: InventoryView) => void;
  onSelectSite: (siteId: string) => void;
  onToggleFavorite: (siteId: string) => void;
  onAddSite: () => void;
}

export function SiteInventoryPage({
  allSites,
  sites,
  selectedSiteId,
  search,
  typeFilter,
  locationFilter,
  countryFilter,
  healthFilter,
  view,
  summary,
  onSearchChange,
  onTypeFilterChange,
  onLocationFilterChange,
  onCountryFilterChange,
  onHealthFilterChange,
  onViewChange,
  onSelectSite,
  onToggleFavorite,
  onAddSite,
}: SiteInventoryPageProps) {
  const filtersActive = search || typeFilter !== "all" || locationFilter !== "all" || countryFilter !== "all" || healthFilter !== "all";

  return (
    <main className="site-inventory-page">
      <div className="inventory-page-heading">
        <div><h1>Site Inventory</h1><p>Enterprise sites and locations registry</p></div>
        <div className="last-updated"><span>Last updated: 2 min ago</span><button type="button" aria-label="Refresh site inventory"><RefreshCw size={15} /></button></div>
      </div>

      <InventoryToolbar
        sites={allSites}
        search={search}
        typeFilter={typeFilter}
        locationFilter={locationFilter}
        countryFilter={countryFilter}
        healthFilter={healthFilter}
        view={view}
        onSearchChange={onSearchChange}
        onTypeFilterChange={onTypeFilterChange}
        onLocationFilterChange={onLocationFilterChange}
        onCountryFilterChange={onCountryFilterChange}
        onHealthFilterChange={onHealthFilterChange}
        onViewChange={onViewChange}
        onAddSite={onAddSite}
      />

      <div className="inventory-count-row">
        <strong>{filtersActive ? sites.length : summary.totalSites}</strong>
        <span>{filtersActive ? " matching sites" : ` Sites across ${summary.countries} Countries`}</span>
      </div>

      <div className={`site-collection-frame ${view === "list" ? "list-mode" : "grid-mode"}`}>
        {view === "grid" ? (
          <div className="site-grid">
            {sites.slice(0, 8).map((site, index) => (
              <SiteCard
                key={site.id}
                site={site}
                selected={selectedSiteId === site.id}
                compact={index >= 6}
                onSelect={() => onSelectSite(site.id)}
                onToggleFavorite={() => onToggleFavorite(site.id)}
              />
            ))}
            <AddSiteCard onClick={onAddSite} />
          </div>
        ) : (
          <div className="site-list">
            <div className="site-list-head"><span>Type</span><span>Site</span><span>Location</span><span>Score</span><span>Connectivity</span><span>Risk</span></div>
            {sites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                selected={selectedSiteId === site.id}
                listMode
                onSelect={() => onSelectSite(site.id)}
                onToggleFavorite={() => onToggleFavorite(site.id)}
              />
            ))}
            {sites.length === 0 ? <div className="empty-results">No sites match the current filters.</div> : null}
          </div>
        )}
      </div>

      <PortfolioSummary summary={summary} />
    </main>
  );
}
