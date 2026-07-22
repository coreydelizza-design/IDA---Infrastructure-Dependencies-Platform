import { DEMO_CONTRACTS, DEMO_ENGAGEMENTS, DEMO_ENTERPRISES, DEMO_SITES, DEMO_SITE_ARTIFACTS } from "./seed";
import type {
  AssuranceSnapshot,
  AuditEvent,
  CarrierAcknowledgmentSummary,
  Circuit,
  CloudResource,
  ConsultancyOrganization,
  Contract,
  ControlResult,
  CustomerDecision,
  CriticalService,
  DataGap,
  Dependency,
  Engagement,
  EngagementMember,
  EnterpriseAuthorizationSummary,
  EnterpriseClient,
  EnterpriseContact,
  EvidenceItem,
  FieldProvenance,
  ImportBatch,
  InfrastructureComponent,
  ProposedClaim,
  Provider,
  RegistryTask,
  SiteRecord,
} from "../../domain";

/** Full local dataset persisted as one versioned blob. */
export interface RegistryDataset {
  organizations: ConsultancyOrganization[];
  enterpriseClients: EnterpriseClient[];
  engagements: Engagement[];
  engagementMembers: EngagementMember[];
  enterpriseContacts: EnterpriseContact[];
  sites: SiteRecord[];
  criticalServices: CriticalService[];
  providers: Provider[];
  circuits: Circuit[];
  components: InfrastructureComponent[];
  cloudResources: CloudResource[];
  dependencies: Dependency[];
  evidence: EvidenceItem[];
  dataGaps: DataGap[];
  tasks: RegistryTask[];
  controlResults: ControlResult[];
  assuranceSnapshots: AssuranceSnapshot[];
  importBatches: ImportBatch[];
  proposedClaims: ProposedClaim[];
  fieldProvenance: FieldProvenance[];
  authorizations: EnterpriseAuthorizationSummary[];
  acknowledgments: CarrierAcknowledgmentSummary[];
  contracts: Contract[];
  customerDecisions: CustomerDecision[];
  audit: AuditEvent[];
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** In-memory Storage shim for tests / non-browser environments. */
export function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

export function resolveStorage(): StorageLike {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    /* access can throw in sandboxed contexts */
  }
  return createMemoryStorage();
}

export const SCHEMA_VERSION = 7;
const STORAGE_KEY = "ida.registry.v1";

// v2 backfill: the canonical seeded enterprise carries explicit branding that
// reproduces the approved locked wordmark. Installs seeded before v2 have no
// branding field, which would flip the wordmark to the enterprise name — this
// restores the exact locked baseline. Only the canonical seed record is touched;
// user-created enterprises keep their (neutral / own-name) white-label default.
const CANONICAL_ENTERPRISE_ID = "ent-enterprise-co";
const LOCKED_SEED_BRANDING = { brandName: "ResiliLink", productLabel: "Site Resiliency Registry", logoUrl: null, logoAlt: "" };

interface PersistedEnvelope {
  schemaVersion: number;
  data: RegistryDataset;
}

/** Forward migrations by schema version. Preserves user records. */
function migrate(envelope: PersistedEnvelope): PersistedEnvelope {
  const current = envelope;
  if (current.schemaVersion < 2) {
    const seededEnterprise = current.data.enterpriseClients?.find((e) => e.id === CANONICAL_ENTERPRISE_ID);
    if (seededEnterprise && (seededEnterprise.branding === undefined || seededEnterprise.branding === null)) {
      seededEnterprise.branding = { ...LOCKED_SEED_BRANDING };
    }
    current.schemaVersion = 2;
  }
  if (current.schemaVersion < 3) {
    // v3: add the demo portfolio (extra enterprises + engagements) so the
    // Project Inventory has a realistic multi-project view. Injected by id only
    // if absent, so user-created records and prior demo edits are preserved.
    const entIds = new Set((current.data.enterpriseClients ?? []).map((e) => e.id));
    for (const e of DEMO_ENTERPRISES) if (!entIds.has(e.id)) current.data.enterpriseClients.push({ ...e });
    const engIds = new Set((current.data.engagements ?? []).map((e) => e.id));
    for (const g of DEMO_ENGAGEMENTS) if (!engIds.has(g.id)) current.data.engagements.push({ ...g });
    current.schemaVersion = 3;
  }
  if (current.schemaVersion < 4) {
    // v4: contract repository. Add the collection (absent before v4) and seed the
    // demo MSAs/contracts by id if missing.
    if (!Array.isArray(current.data.contracts)) current.data.contracts = [];
    const ids = new Set(current.data.contracts.map((c) => c.id));
    for (const c of DEMO_CONTRACTS) if (!ids.has(c.id)) current.data.contracts.push({ ...c });
    current.schemaVersion = 4;
  }
  if (current.schemaVersion < 5) {
    // v5: governed customer actions. Add the decisions collection (absent before
    // v5). It starts empty — decisions are authored by customers at runtime, never
    // seeded. Canonical authorizations/risks are untouched.
    if (!Array.isArray(current.data.customerDecisions)) current.data.customerDecisions = [];
    current.schemaVersion = 5;
  }
  if (current.schemaVersion < 6) {
    // v6: demo-portfolio sites. Inject representative sites (+ their assessment
    // artifacts) for the demo engagements so every project in the Project
    // Inventory opens to a populated Site Inventory. Injected by id only if
    // absent — user-created sites and the canonical ENG-2026-001 estate are
    // untouched, so the locked default render is unchanged.
    const siteIds = new Set((current.data.sites ?? []).map((s) => s.id));
    for (const s of DEMO_SITES) if (!siteIds.has(s.id)) current.data.sites.push({ ...s });
    if (!Array.isArray(current.data.controlResults)) current.data.controlResults = [];
    const crKey = (c: { siteId: string; controlId: string }) => `${c.siteId}:${c.controlId}`;
    const crKeys = new Set(current.data.controlResults.map(crKey));
    for (const c of DEMO_SITE_ARTIFACTS.controlResults) if (!crKeys.has(crKey(c))) current.data.controlResults.push({ ...c });
    if (!Array.isArray(current.data.assuranceSnapshots)) current.data.assuranceSnapshots = [];
    const snapIds = new Set(current.data.assuranceSnapshots.map((s) => s.id));
    for (const s of DEMO_SITE_ARTIFACTS.snapshots) if (!snapIds.has(s.id)) current.data.assuranceSnapshots.push({ ...s });
    current.schemaVersion = 6;
  }
  if (current.schemaVersion < 7) {
    // v7: site workloads. Backfill the `workloads` field (absent before v7) as an
    // empty array so existing/canonical sites are unchanged, and restore the demo
    // portfolio's workloads for demo sites that were injected by an earlier v6
    // migration (before workloads existed).
    const demoWorkloads = new Map(DEMO_SITES.map((s) => [s.id, s.workloads] as const));
    for (const site of current.data.sites ?? []) {
      if (!Array.isArray(site.workloads)) site.workloads = demoWorkloads.get(site.id) ?? [];
    }
    current.schemaVersion = 7;
  }
  return current;
}

/**
 * localStorage-backed registry store. Seeds canonical data only on first load
 * and never reseeds over user-created records.
 */
export class LocalStore {
  private readonly storage: StorageLike;

  constructor(storage: StorageLike = resolveStorage()) {
    this.storage = storage;
  }

  hasData(): boolean {
    return this.storage.getItem(STORAGE_KEY) !== null;
  }

  /** Seed once. If data already exists, it is migrated and returned unchanged. */
  initialize(seedFactory: () => RegistryDataset): RegistryDataset {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw === null) {
      const data = seedFactory();
      this.persist({ schemaVersion: SCHEMA_VERSION, data });
      return data;
    }
    const parsed = JSON.parse(raw) as PersistedEnvelope;
    const priorVersion = parsed.schemaVersion;
    const migrated = migrate(parsed);
    if (migrated.schemaVersion !== priorVersion) this.persist(migrated);
    return migrated.data;
  }

  read(): RegistryDataset {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw === null) throw new Error("LocalStore not initialized");
    return (JSON.parse(raw) as PersistedEnvelope).data;
  }

  write(mutator: (data: RegistryDataset) => void): RegistryDataset {
    const data = this.read();
    mutator(data);
    this.persist({ schemaVersion: SCHEMA_VERSION, data });
    return data;
  }

  /** Development utility — clears storage so the canonical seed is re-created. */
  resetDemoData(): void {
    this.storage.removeItem(STORAGE_KEY);
  }

  private persist(envelope: PersistedEnvelope): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  }
}
