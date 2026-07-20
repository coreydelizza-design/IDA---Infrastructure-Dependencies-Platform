import type { RepositoryError } from "../../application/ports";

export function notConfiguredError(op: string): RepositoryError {
  return { kind: "not-configured", message: `Supabase is not configured (${op}). Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.` };
}

/** Map a Supabase/PostgREST error shape into a typed RepositoryError. */
export function mapSupabaseError(error: { code?: string; message?: string } | null): RepositoryError {
  if (!error) return { kind: "unknown", message: "Unknown Supabase error" };
  switch (error.code) {
    case "PGRST116":
      return { kind: "not-found", message: error.message ?? "Not found" };
    case "23505":
      return { kind: "conflict", message: error.message ?? "Unique violation" };
    case "42501":
      return { kind: "permission-denied", message: error.message ?? "Row-level security denied" };
    default:
      return { kind: "unknown", message: error.message ?? "Supabase error" };
  }
}
