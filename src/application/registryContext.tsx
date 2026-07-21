import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { RegistryRepositories } from "./ports";
import { createLocalRepositories } from "../infrastructure/local/localRepositories";
import { LocalStore } from "../infrastructure/local/localStore";
import { buildSeedDataset, CANONICAL_IDS } from "../infrastructure/local/seed";
import { createSupabaseRepositories, resolveDataMode, type DataMode } from "../infrastructure/supabase/client";
import type {
  BrandingConfig,
  CarrierAcknowledgmentSummary,
  ConsultancyOrganization,
  DeliveryTier,
  Engagement,
  EnterpriseAuthorizationSummary,
  EnterpriseClient,
  PortfolioSummary,
  ResolvedBranding,
  Site,
  SiteRecord,
} from "../domain";
import { EMPTY_BRANDING, isPageAvailable as tierPageAvailable, presentSite, resolveBranding, resolveTier } from "../domain";

/** Fixed portfolio summary for the full estate (preserves the approved KPI strip). */
export const canonicalPortfolioSummary: PortfolioSummary = {
  totalSites: 128,
  countries: 23,
  excellent: { count: 62, percentage: 48 },
  good: { count: 45, percentage: 35 },
  atRisk: { count: 16, percentage: 12 },
  critical: { count: 5, percentage: 4 },
  averageScore: 82,
  averageLabel: "Good",
};

interface RegistryContextValue {
  dataMode: DataMode;
  supabaseConfigured: boolean;
  repositories: RegistryRepositories;
  organization: ConsultancyOrganization | null;
  enterprises: EnterpriseClient[];
  engagements: Engagement[];
  currentEnterprise: EnterpriseClient | null;
  currentEngagement: Engagement | null;
  /** Display-ready branding for the current enterprise (neutral defaults filled). */
  branding: ResolvedBranding;
  /** Raw stored branding for the current enterprise (empty strings = defaults). */
  brandingConfig: BrandingConfig;
  updateBranding: (patch: Partial<BrandingConfig>) => void;
  resetBranding: () => void;
  /** Resolved delivery tier for the current enterprise. */
  tier: DeliveryTier;
  setTier: (tier: DeliveryTier) => void;
  /** Whether a workspace route is reachable under the current tier. */
  isPageAvailable: (page: string) => boolean;
  sites: Site[];
  siteRecords: SiteRecord[];
  authorizations: EnterpriseAuthorizationSummary[];
  acknowledgments: CarrierAcknowledgmentSummary[];
  portfolioSummary: PortfolioSummary;
  selectEnterprise: (enterpriseId: string) => void;
  selectEngagement: (engagementId: string) => void;
  refresh: () => void;
  resetDemoData: () => void;
}

const RegistryContext = createContext<RegistryContextValue | null>(null);

function readParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

function persistSelection(enterpriseId: string, engagementId: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("enterprise", enterpriseId);
  url.searchParams.set("engagement", engagementId);
  window.history.replaceState({}, "", url);
  try {
    window.localStorage.setItem("ida.selection", JSON.stringify({ enterpriseId, engagementId }));
  } catch {
    /* ignore */
  }
}

function initialSelection(): { enterpriseId: string; engagementId: string } {
  const fromUrl = { enterpriseId: readParam("enterprise"), engagementId: readParam("engagement") };
  if (fromUrl.enterpriseId && fromUrl.engagementId) return fromUrl as { enterpriseId: string; engagementId: string };
  try {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("ida.selection") : null;
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  return { enterpriseId: CANONICAL_IDS.ENTERPRISE_ID, engagementId: CANONICAL_IDS.ENGAGEMENT_ID };
}

export function RegistryProvider({ children }: { children: ReactNode }) {
  const [{ store, repositories, dataMode, supabaseConfigured }] = useState(() => {
    const mode = resolveDataMode();
    if (mode === "supabase") {
      const supa = createSupabaseRepositories();
      // Fall back to a seeded local store for rendering when Supabase is not configured.
      const localStore = new LocalStore();
      localStore.initialize(buildSeedDataset);
      return {
        store: localStore,
        repositories: supa.configured ? supa.repositories : createLocalRepositories(localStore),
        dataMode: mode,
        supabaseConfigured: supa.configured,
      };
    }
    const localStore = new LocalStore();
    localStore.initialize(buildSeedDataset);
    return { store: localStore, repositories: createLocalRepositories(localStore), dataMode: mode, supabaseConfigured: false };
  });

  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((r) => r + 1), []);

  const [selection, setSelection] = useState(initialSelection);

  const dataset = useMemo(() => store.read(), [store, revision]);

  const currentEnterprise = useMemo(
    () => dataset.enterpriseClients.find((e) => e.id === selection.enterpriseId) ?? dataset.enterpriseClients[0] ?? null,
    [dataset, selection.enterpriseId],
  );
  const engagements = useMemo(
    () => dataset.engagements.filter((e) => e.enterpriseClientId === currentEnterprise?.id && e.status !== "archived"),
    [dataset, currentEnterprise],
  );
  const currentEngagement = useMemo(
    () => engagements.find((e) => e.id === selection.engagementId) ?? engagements[0] ?? null,
    [engagements, selection.engagementId],
  );

  const brandingConfig = useMemo<BrandingConfig>(
    () => currentEnterprise?.branding ?? EMPTY_BRANDING,
    [currentEnterprise],
  );
  const branding = useMemo<ResolvedBranding>(
    () => resolveBranding({ branding: brandingConfig, enterpriseName: currentEnterprise?.name ?? null }),
    [brandingConfig, currentEnterprise],
  );

  const updateBranding = useCallback(
    (patch: Partial<BrandingConfig>) => {
      const enterpriseId = currentEnterprise?.id;
      if (!enterpriseId) return;
      store.write((data) => {
        const enterprise = data.enterpriseClients.find((e) => e.id === enterpriseId);
        if (!enterprise) return;
        const base = enterprise.branding ?? EMPTY_BRANDING;
        enterprise.branding = { ...base, ...patch };
        enterprise.updatedAt = new Date().toISOString();
      });
      refresh();
    },
    [store, currentEnterprise, refresh],
  );

  const resetBranding = useCallback(() => {
    const enterpriseId = currentEnterprise?.id;
    if (!enterpriseId) return;
    store.write((data) => {
      const enterprise = data.enterpriseClients.find((e) => e.id === enterpriseId);
      if (!enterprise) return;
      enterprise.branding = null;
      enterprise.updatedAt = new Date().toISOString();
    });
    refresh();
  }, [store, currentEnterprise, refresh]);

  const tier = useMemo<DeliveryTier>(() => resolveTier(currentEnterprise?.tier), [currentEnterprise]);

  const setTier = useCallback(
    (next: DeliveryTier) => {
      const enterpriseId = currentEnterprise?.id;
      if (!enterpriseId) return;
      store.write((data) => {
        const enterprise = data.enterpriseClients.find((e) => e.id === enterpriseId);
        if (!enterprise) return;
        enterprise.tier = next;
        enterprise.updatedAt = new Date().toISOString();
      });
      refresh();
    },
    [store, currentEnterprise, refresh],
  );

  const isPageAvailable = useCallback((page: string) => tierPageAvailable(page, tier), [tier]);

  const siteRecords = useMemo(
    () => dataset.sites.filter((s) => s.engagementId === currentEngagement?.id && s.archivedAt === null),
    [dataset, currentEngagement],
  );
  const sites = useMemo(() => siteRecords.map(presentSite), [siteRecords]);

  const selectEnterprise = useCallback(
    (enterpriseId: string) => {
      const firstEngagement = dataset.engagements.find((e) => e.enterpriseClientId === enterpriseId && e.status !== "archived");
      const engagementId = firstEngagement?.id ?? "";
      setSelection({ enterpriseId, engagementId });
      persistSelection(enterpriseId, engagementId);
    },
    [dataset],
  );
  const selectEngagement = useCallback(
    (engagementId: string) => {
      setSelection((prev) => {
        persistSelection(prev.enterpriseId, engagementId);
        return { ...prev, engagementId };
      });
    },
    [],
  );

  const resetDemoData = useCallback(() => {
    store.resetDemoData();
    store.initialize(buildSeedDataset);
    refresh();
  }, [store, refresh]);

  const value: RegistryContextValue = {
    dataMode,
    supabaseConfigured,
    repositories,
    organization: dataset.organizations[0] ?? null,
    enterprises: dataset.enterpriseClients,
    engagements,
    currentEnterprise,
    currentEngagement,
    branding,
    brandingConfig,
    updateBranding,
    resetBranding,
    tier,
    setTier,
    isPageAvailable,
    sites,
    siteRecords,
    authorizations: dataset.authorizations.filter((a) => a.engagementId === currentEngagement?.id),
    acknowledgments: dataset.acknowledgments,
    portfolioSummary: canonicalPortfolioSummary,
    selectEnterprise,
    selectEngagement,
    refresh,
    resetDemoData,
  };

  return <RegistryContext.Provider value={value}>{children}</RegistryContext.Provider>;
}

export function useRegistry(): RegistryContextValue {
  const ctx = useContext(RegistryContext);
  if (!ctx) throw new Error("useRegistry must be used within a RegistryProvider");
  return ctx;
}
