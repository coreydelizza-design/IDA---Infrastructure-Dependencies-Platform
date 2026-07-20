// Repository ports. Visual components must depend on these interfaces, never on
// canonical fixture data or a concrete persistence implementation.

import type {
  AuditEvent,
  CloudResource,
  ConsultancyOrganization,
  Circuit,
  CriticalService,
  DataGap,
  Dependency,
  Engagement,
  EngagementMember,
  EnterpriseClient,
  EnterpriseContact,
  EvidenceItem,
  InfrastructureComponent,
  Provider,
  RegistryTask,
  SiteRecord,
} from "../domain";

export type RepositoryError =
  | { kind: "not-found"; message: string }
  | { kind: "conflict"; message: string }
  | { kind: "validation"; message: string }
  | { kind: "not-configured"; message: string }
  | { kind: "permission-denied"; message: string }
  | { kind: "unknown"; message: string };

export type Result<T> = { ok: true; value: T } | { ok: false; error: RepositoryError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}
export function err<T = never>(error: RepositoryError): Result<T> {
  return { ok: false, error };
}

/** Common CRUD surface shared by all registry repositories. */
export interface CrudRepository<T> {
  list(): Promise<Result<T[]>>;
  getById(id: string): Promise<Result<T>>;
  create(record: T): Promise<Result<T>>;
  update(record: T): Promise<Result<T>>;
  archive(id: string): Promise<Result<T>>;
  batchCreate(records: T[]): Promise<Result<T[]>>;
}

export interface EngagementScopedRepository<T> extends CrudRepository<T> {
  listByEngagement(engagementId: string): Promise<Result<T[]>>;
}

export interface SiteScopedRepository<T> extends EngagementScopedRepository<T> {
  listBySite(siteId: string): Promise<Result<T[]>>;
}

export interface OrganizationRepository extends CrudRepository<ConsultancyOrganization> {
  listEnterpriseClients(consultancyOrganizationId: string): Promise<Result<EnterpriseClient[]>>;
  createEnterpriseClient(client: EnterpriseClient): Promise<Result<EnterpriseClient>>;
  getEnterpriseClient(id: string): Promise<Result<EnterpriseClient>>;
}

export interface EngagementRepository extends CrudRepository<Engagement> {
  listByEnterprise(enterpriseClientId: string): Promise<Result<Engagement[]>>;
  restore(id: string): Promise<Result<Engagement>>;
  listMembers(engagementId: string): Promise<Result<EngagementMember[]>>;
  listContacts(engagementId: string): Promise<Result<EnterpriseContact[]>>;
}

export interface SiteRepository extends EngagementScopedRepository<SiteRecord> {
  restore(id: string): Promise<Result<SiteRecord>>;
  search(engagementId: string, query: string): Promise<Result<SiteRecord[]>>;
}

export type CriticalServiceRepository = SiteScopedRepository<CriticalService>;
export type ProviderRepository = EngagementScopedRepository<Provider>;
export type CircuitRepository = SiteScopedRepository<Circuit>;
export type ComponentRepository = SiteScopedRepository<InfrastructureComponent>;
export type CloudResourceRepository = SiteScopedRepository<CloudResource>;
export type DependencyRepository = EngagementScopedRepository<Dependency>;
export type EvidenceRepository = SiteScopedRepository<EvidenceItem>;
export type DataGapRepository = SiteScopedRepository<DataGap>;
export type TaskRepository = EngagementScopedRepository<RegistryTask>;

export interface AuditRepository {
  listByEngagement(engagementId: string): Promise<Result<AuditEvent[]>>;
  append(event: AuditEvent): Promise<Result<AuditEvent>>;
}

/** The full set of registry repositories, resolved per data mode. */
export interface RegistryRepositories {
  organizations: OrganizationRepository;
  engagements: EngagementRepository;
  sites: SiteRepository;
  criticalServices: CriticalServiceRepository;
  providers: ProviderRepository;
  circuits: CircuitRepository;
  components: ComponentRepository;
  cloudResources: CloudResourceRepository;
  dependencies: DependencyRepository;
  evidence: EvidenceRepository;
  dataGaps: DataGapRepository;
  tasks: TaskRepository;
  audit: AuditRepository;
}
