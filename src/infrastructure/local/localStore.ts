import type {
  AssuranceSnapshot,
  AuditEvent,
  CarrierAcknowledgmentSummary,
  Circuit,
  CloudResource,
  ConsultancyOrganization,
  ControlResult,
  CriticalService,
  DataGap,
  Dependency,
  Engagement,
  EngagementMember,
  EnterpriseAuthorizationSummary,
  EnterpriseClient,
  EnterpriseContact,
  EvidenceItem,
  InfrastructureComponent,
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
  authorizations: EnterpriseAuthorizationSummary[];
  acknowledgments: CarrierAcknowledgmentSummary[];
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

export const SCHEMA_VERSION = 1;
const STORAGE_KEY = "ida.registry.v1";

interface PersistedEnvelope {
  schemaVersion: number;
  data: RegistryDataset;
}

/** Forward migrations by schema version. Preserves user records. */
function migrate(envelope: PersistedEnvelope): PersistedEnvelope {
  let current = envelope;
  // while (current.schemaVersion < SCHEMA_VERSION) { ...transform...; current.schemaVersion++ }
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
    const migrated = migrate(parsed);
    if (migrated.schemaVersion !== parsed.schemaVersion) this.persist(migrated);
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
