import type { RegistryRepositories } from "../../application/ports";
import { err } from "../../application/ports";
import { notConfiguredError } from "./errors";

export type DataMode = "local" | "supabase";

/** Resolve the data mode from the build-time env. Defaults to local. */
export function resolveDataMode(): DataMode {
  const mode = (import.meta.env.VITE_DATA_MODE as string | undefined)?.toLowerCase();
  return mode === "supabase" ? "supabase" : "local";
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function readSupabaseConfig(): SupabaseConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * SCAFFOLD: the Supabase repositories are wired in a later step (install
 * @supabase/supabase-js, implement src/infrastructure/supabase/repositories and
 * mappers against supabase/migrations). Until then this returns a not-configured
 * repository set and the provider falls back to seeded local mode so the app
 * always runs without Supabase configuration.
 */
export function createSupabaseRepositories(): { configured: boolean; repositories: RegistryRepositories } {
  const config = readSupabaseConfig();
  return { configured: config !== null && false, repositories: notConfiguredRepositories() };
}

function notConfiguredRepositories(): RegistryRepositories {
  const fail = (op: string) => async () => err(notConfiguredError(op));
  const scoped = (name: string) => ({
    list: fail(`${name}.list`),
    getById: fail(`${name}.getById`),
    create: fail(`${name}.create`),
    update: fail(`${name}.update`),
    archive: fail(`${name}.archive`),
    batchCreate: fail(`${name}.batchCreate`),
    listByEngagement: fail(`${name}.listByEngagement`),
    listBySite: fail(`${name}.listBySite`),
    restore: fail(`${name}.restore`),
    search: fail(`${name}.search`),
  });
  return {
    organizations: { ...scoped("organizations"), listEnterpriseClients: fail("organizations.listEnterpriseClients"), createEnterpriseClient: fail("organizations.createEnterpriseClient"), getEnterpriseClient: fail("organizations.getEnterpriseClient") },
    engagements: { ...scoped("engagements"), listByEnterprise: fail("engagements.listByEnterprise"), restore: fail("engagements.restore"), listMembers: fail("engagements.listMembers"), listContacts: fail("engagements.listContacts") },
    sites: scoped("sites"),
    criticalServices: scoped("criticalServices"),
    providers: scoped("providers"),
    circuits: scoped("circuits"),
    components: scoped("components"),
    cloudResources: scoped("cloudResources"),
    dependencies: scoped("dependencies"),
    evidence: scoped("evidence"),
    dataGaps: scoped("dataGaps"),
    tasks: scoped("tasks"),
    audit: { listByEngagement: fail("audit.listByEngagement"), append: fail("audit.append") },
    assessments: { listControlResults: fail("assessments.listControlResults"), saveControlResults: fail("assessments.saveControlResults"), listSnapshots: fail("assessments.listSnapshots"), latestSnapshot: fail("assessments.latestSnapshot"), saveSnapshot: fail("assessments.saveSnapshot") },
  } as unknown as RegistryRepositories;
}
