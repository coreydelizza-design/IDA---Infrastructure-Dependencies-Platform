import { Filter, Grid2X2, List, Plus, Search } from "lucide-react";
import type { InventoryView, Site } from "../domain/models";

interface InventoryToolbarProps {
  sites: Site[];
  search: string;
  typeFilter: string;
  locationFilter: string;
  countryFilter: string;
  healthFilter: string;
  view: InventoryView;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onLocationFilterChange: (value: string) => void;
  onCountryFilterChange: (value: string) => void;
  onHealthFilterChange: (value: string) => void;
  onViewChange: (view: InventoryView) => void;
  onAddSite: () => void;
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function InventoryToolbar({
  sites,
  search,
  typeFilter,
  locationFilter,
  countryFilter,
  healthFilter,
  view,
  onSearchChange,
  onTypeFilterChange,
  onLocationFilterChange,
  onCountryFilterChange,
  onHealthFilterChange,
  onViewChange,
  onAddSite,
}: InventoryToolbarProps) {
  const types = unique(sites.map((site) => site.type));
  const locationTypes = unique(sites.map((site) => site.locationType));
  const countries = unique(sites.map((site) => site.countryCode));

  return (
    <div className="inventory-toolbar">
      <label className="search-field">
        <Search size={15} />
        <input
          aria-label="Search sites"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search sites, locations, tags..."
        />
        <span>⌘K</span>
      </label>

      <label className="filter-select">
        <span className="sr-only">Site type</span>
        <select value={typeFilter} onChange={(event) => onTypeFilterChange(event.target.value)}>
          <option value="all">All Site Types</option>
          {types.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </label>

      <label className="filter-select location-filter">
        <span className="sr-only">Location type</span>
        <select value={locationFilter} onChange={(event) => onLocationFilterChange(event.target.value)}>
          <option value="all">All Location Types</option>
          {locationTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </label>

      <label className="filter-select country-filter">
        <span className="sr-only">Country</span>
        <select value={countryFilter} onChange={(event) => onCountryFilterChange(event.target.value)}>
          <option value="all">All Countries</option>
          {countries.map((country) => <option key={country} value={country}>{country}</option>)}
        </select>
      </label>

      <label className="filter-select health-filter">
        <span className="sr-only">Resiliency score</span>
        <select value={healthFilter} onChange={(event) => onHealthFilterChange(event.target.value)}>
          <option value="all">Resiliency Score</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="at-risk">At Risk</option>
          <option value="critical">Critical</option>
        </select>
      </label>

      <button className="more-filters" type="button">
        <Filter size={14} />
        <span>More Filters</span>
        <em>2</em>
      </button>

      <div className="view-toggle" aria-label="Inventory view">
        <button type="button" className={view === "grid" ? "active" : ""} onClick={() => onViewChange("grid")} aria-label="Grid view"><Grid2X2 size={16} /></button>
        <button type="button" className={view === "list" ? "active" : ""} onClick={() => onViewChange("list")} aria-label="List view"><List size={17} /></button>
      </div>

      <button className="add-site-button" type="button" onClick={onAddSite}>
        <Plus size={17} />
        <span>Add Site</span>
      </button>
    </div>
  );
}
