import type { Site } from "../domain/models";

export interface SiteQuery {
  search?: string;
  type?: string;
  locationType?: string;
  countryCode?: string;
  healthBand?: string;
  cursor?: string;
  limit?: number;
}

export interface SitePage {
  items: Site[];
  nextCursor: string | null;
  total: number;
}

export interface SiteRepository {
  list(query: SiteQuery): Promise<SitePage>;
  getById(id: string): Promise<Site | null>;
  save(site: Site): Promise<Site>;
}

export class InMemorySiteRepository implements SiteRepository {
  private readonly records = new Map<string, Site>();

  constructor(seed: Site[]) {
    for (const site of seed) this.records.set(site.id, structuredClone(site));
  }

  async list(query: SiteQuery): Promise<SitePage> {
    const normalizedSearch = query.search?.trim().toLowerCase() ?? "";
    const limit = Math.max(1, Math.min(query.limit ?? 100, 250));
    const offset = query.cursor ? Number.parseInt(query.cursor, 10) : 0;

    const matches = [...this.records.values()].filter((site) => {
      const searchable = [
        site.code,
        site.name,
        site.city,
        site.countryCode,
        site.countryName,
        site.type,
        site.locationType,
        ...site.tags,
        ...site.carrierConnections.flatMap((carrier) => [
          carrier.contractedCarrier,
          carrier.underlyingCarrier,
          carrier.circuitId,
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!normalizedSearch || searchable.includes(normalizedSearch)) &&
        (!query.type || query.type === "all" || site.type === query.type) &&
        (!query.locationType || query.locationType === "all" || site.locationType === query.locationType) &&
        (!query.countryCode || query.countryCode === "all" || site.countryCode === query.countryCode) &&
        (!query.healthBand || query.healthBand === "all" || site.score.band === query.healthBand)
      );
    });

    const items = matches.slice(offset, offset + limit).map((site) => structuredClone(site));
    const nextOffset = offset + items.length;

    return {
      items,
      nextCursor: nextOffset < matches.length ? String(nextOffset) : null,
      total: matches.length,
    };
  }

  async getById(id: string): Promise<Site | null> {
    const site = this.records.get(id);
    return site ? structuredClone(site) : null;
  }

  async save(site: Site): Promise<Site> {
    const clone = structuredClone(site);
    this.records.set(site.id, clone);
    return structuredClone(clone);
  }
}
