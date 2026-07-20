import type {
  AssessmentRepository,
  AuditRepository,
  ConnectorRepository,
  CircuitRepository,
  CloudResourceRepository,
  ComponentRepository,
  CriticalServiceRepository,
  DataGapRepository,
  DependencyRepository,
  EngagementRepository,
  EvidenceRepository,
  OrganizationRepository,
  ProviderRepository,
  RegistryRepositories,
  Result,
  SiteRepository,
  TaskRepository,
} from "../../application/ports";
import { err, ok } from "../../application/ports";
import type {
  AssuranceSnapshot,
  AuditEvent,
  ControlResult,
  Engagement,
  EnterpriseClient,
  FieldProvenance,
  ImportBatch,
  ProposedClaim,
  SiteRecord,
} from "../../domain";
import type { LocalStore, RegistryDataset } from "./localStore";

type Keyed = { id: string };
type ScopedCollections = Exclude<keyof RegistryDataset, "audit">;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Generic engagement/site-scoped repository backed by a dataset collection. */
function scopedRepo<T extends Keyed & { engagementId?: string; siteId?: string | null }>(
  store: LocalStore,
  key: ScopedCollections,
) {
  const read = () => store.read()[key] as unknown as T[];
  return {
    async list(): Promise<Result<T[]>> {
      return ok(clone(read()));
    },
    async getById(id: string): Promise<Result<T>> {
      const found = read().find((r) => r.id === id);
      return found ? ok(clone(found)) : err({ kind: "not-found", message: `${key} ${id} not found` });
    },
    async create(record: T): Promise<Result<T>> {
      if (read().some((r) => r.id === record.id)) return err({ kind: "conflict", message: `${key} ${record.id} exists` });
      store.write((data) => void (data[key] as unknown as T[]).push(clone(record)));
      return ok(clone(record));
    },
    async update(record: T): Promise<Result<T>> {
      let updated = false;
      store.write((data) => {
        const arr = data[key] as unknown as T[];
        const idx = arr.findIndex((r) => r.id === record.id);
        if (idx >= 0) {
          arr[idx] = clone(record);
          updated = true;
        }
      });
      return updated ? ok(clone(record)) : err({ kind: "not-found", message: `${key} ${record.id} not found` });
    },
    async archive(id: string): Promise<Result<T>> {
      let removed: T | undefined;
      store.write((data) => {
        const arr = data[key] as unknown as T[];
        const idx = arr.findIndex((r) => r.id === id);
        if (idx >= 0) removed = arr.splice(idx, 1)[0];
      });
      return removed ? ok(clone(removed)) : err({ kind: "not-found", message: `${key} ${id} not found` });
    },
    async batchCreate(records: T[]): Promise<Result<T[]>> {
      store.write((data) => void (data[key] as unknown as T[]).push(...clone(records)));
      return ok(clone(records));
    },
    async listByEngagement(engagementId: string): Promise<Result<T[]>> {
      return ok(clone(read().filter((r) => r.engagementId === engagementId)));
    },
    async listBySite(siteId: string): Promise<Result<T[]>> {
      return ok(clone(read().filter((r) => r.siteId === siteId)));
    },
  };
}

function makeOrganizationRepository(store: LocalStore): OrganizationRepository {
  const base = scopedRepo(store, "organizations");
  return {
    ...base,
    async listEnterpriseClients(consultancyOrganizationId): Promise<Result<EnterpriseClient[]>> {
      return ok(clone(store.read().enterpriseClients.filter((c) => c.consultancyOrganizationId === consultancyOrganizationId)));
    },
    async getEnterpriseClient(id): Promise<Result<EnterpriseClient>> {
      const found = store.read().enterpriseClients.find((c) => c.id === id);
      return found ? ok(clone(found)) : err({ kind: "not-found", message: `enterprise ${id} not found` });
    },
    async createEnterpriseClient(client): Promise<Result<EnterpriseClient>> {
      store.write((data) => void data.enterpriseClients.push(clone(client)));
      return ok(clone(client));
    },
  } as OrganizationRepository;
}

function makeEngagementRepository(store: LocalStore): EngagementRepository {
  const base = scopedRepo<Engagement>(store, "engagements");
  return {
    ...base,
    async archive(id): Promise<Result<Engagement>> {
      let updated: Engagement | undefined;
      store.write((data) => {
        const found = data.engagements.find((e) => e.id === id);
        if (found) {
          found.status = "archived";
          found.updatedAt = new Date().toISOString();
          updated = found;
        }
      });
      return updated ? ok(clone(updated)) : err({ kind: "not-found", message: `engagement ${id} not found` });
    },
    async restore(id): Promise<Result<Engagement>> {
      let updated: Engagement | undefined;
      store.write((data) => {
        const found = data.engagements.find((e) => e.id === id);
        if (found) {
          found.status = "data-collection";
          updated = found;
        }
      });
      return updated ? ok(clone(updated)) : err({ kind: "not-found", message: `engagement ${id} not found` });
    },
    async listByEnterprise(enterpriseClientId): Promise<Result<Engagement[]>> {
      return ok(clone(store.read().engagements.filter((e) => e.enterpriseClientId === enterpriseClientId)));
    },
    async listMembers(engagementId) {
      return ok(clone(store.read().engagementMembers.filter((m) => m.engagementId === engagementId)));
    },
    async listContacts(engagementId) {
      return ok(clone(store.read().enterpriseContacts.filter((c) => c.engagementId === engagementId)));
    },
  } as EngagementRepository;
}

function makeSiteRepository(store: LocalStore): SiteRepository {
  const base = scopedRepo<SiteRecord>(store, "sites");
  return {
    ...base,
    async list(): Promise<Result<SiteRecord[]>> {
      return ok(clone(store.read().sites.filter((s) => s.archivedAt === null)));
    },
    async listByEngagement(engagementId): Promise<Result<SiteRecord[]>> {
      return ok(clone(store.read().sites.filter((s) => s.engagementId === engagementId && s.archivedAt === null)));
    },
    async archive(id): Promise<Result<SiteRecord>> {
      let updated: SiteRecord | undefined;
      store.write((data) => {
        const found = data.sites.find((s) => s.id === id);
        if (found) {
          found.archivedAt = new Date().toISOString();
          found.registryState = "archived";
          updated = found;
        }
      });
      return updated ? ok(clone(updated)) : err({ kind: "not-found", message: `site ${id} not found` });
    },
    async restore(id): Promise<Result<SiteRecord>> {
      let updated: SiteRecord | undefined;
      store.write((data) => {
        const found = data.sites.find((s) => s.id === id);
        if (found) {
          found.archivedAt = null;
          found.registryState = "consultant-review";
          updated = found;
        }
      });
      return updated ? ok(clone(updated)) : err({ kind: "not-found", message: `site ${id} not found` });
    },
    async search(engagementId, query): Promise<Result<SiteRecord[]>> {
      const q = query.trim().toLowerCase();
      return ok(clone(store.read().sites.filter((s) =>
        s.engagementId === engagementId && s.archivedAt === null &&
        (!q || [s.code, s.name, s.city, s.countryCode, s.archetypeId, ...s.tags].join(" ").toLowerCase().includes(q)),
      )));
    },
  } as SiteRepository;
}

function makeAuditRepository(store: LocalStore): AuditRepository {
  return {
    async listByEngagement(engagementId): Promise<Result<AuditEvent[]>> {
      return ok(clone(store.read().audit.filter((a) => a.engagementId === engagementId)));
    },
    async append(event): Promise<Result<AuditEvent>> {
      store.write((data) => void data.audit.push(clone(event)));
      return ok(clone(event));
    },
  };
}

function makeAssessmentRepository(store: LocalStore): AssessmentRepository {
  return {
    async listControlResults(siteId) {
      return ok(clone(store.read().controlResults.filter((r) => r.siteId === siteId)));
    },
    async saveControlResults(siteId, results) {
      store.write((data) => {
        data.controlResults = data.controlResults.filter((r) => r.siteId !== siteId).concat(clone(results));
      });
      return ok(clone(results));
    },
    async listSnapshots(siteId) {
      return ok(clone(store.read().assuranceSnapshots.filter((s) => s.siteId === siteId)));
    },
    async latestSnapshot(siteId) {
      const list = store.read().assuranceSnapshots.filter((s) => s.siteId === siteId);
      return ok(list.length ? clone(list[list.length - 1]) : null);
    },
    async saveSnapshot(snapshot) {
      store.write((data) => void data.assuranceSnapshots.push(clone(snapshot)));
      return ok(clone(snapshot));
    },
  };
}

function makeConnectorRepository(store: LocalStore): ConnectorRepository {
  return {
    async stageImport(batch, claims) {
      store.write((data) => {
        data.importBatches.push(clone(batch));
        data.proposedClaims.push(...clone(claims));
      });
      return ok(clone(batch));
    },
    async listBatches(engagementId) {
      return ok(clone(store.read().importBatches.filter((b) => b.engagementId === engagementId)));
    },
    async listClaims(engagementId) {
      return ok(clone(store.read().proposedClaims.filter((c) => c.engagementId === engagementId)));
    },
    async updateClaim(claim) {
      let updated = false;
      store.write((data) => {
        const idx = data.proposedClaims.findIndex((c) => c.id === claim.id);
        if (idx >= 0) { data.proposedClaims[idx] = clone(claim); updated = true; }
      });
      return updated ? ok(clone(claim)) : err({ kind: "not-found", message: `claim ${claim.id} not found` });
    },
    async saveProvenance(provenance) {
      store.write((data) => void data.fieldProvenance.push(clone(provenance)));
      return ok(clone(provenance));
    },
    async findProvenance(entityType, fieldPath) {
      const matches = store.read().fieldProvenance.filter((p) => p.entityType === entityType && p.fieldPath === fieldPath && !p.supersededAt);
      return ok(matches.length ? clone(matches[matches.length - 1]) : null);
    },
  };
}

export function createLocalRepositories(store: LocalStore): RegistryRepositories {
  return {
    organizations: makeOrganizationRepository(store),
    engagements: makeEngagementRepository(store),
    sites: makeSiteRepository(store),
    criticalServices: scopedRepo(store, "criticalServices") as unknown as CriticalServiceRepository,
    providers: scopedRepo(store, "providers") as unknown as ProviderRepository,
    circuits: scopedRepo(store, "circuits") as unknown as CircuitRepository,
    components: scopedRepo(store, "components") as unknown as ComponentRepository,
    cloudResources: scopedRepo(store, "cloudResources") as unknown as CloudResourceRepository,
    dependencies: scopedRepo(store, "dependencies") as unknown as DependencyRepository,
    evidence: scopedRepo(store, "evidence") as unknown as EvidenceRepository,
    dataGaps: scopedRepo(store, "dataGaps") as unknown as DataGapRepository,
    tasks: scopedRepo(store, "tasks") as unknown as TaskRepository,
    audit: makeAuditRepository(store),
    assessments: makeAssessmentRepository(store),
    connectors: makeConnectorRepository(store),
  };
}
