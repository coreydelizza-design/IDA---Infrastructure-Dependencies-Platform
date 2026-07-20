// SCAFFOLD: row <-> domain mappers for Supabase mode.
//
// Each domain aggregate maps to a snake_case table row (see supabase/migrations).
// Implemented alongside the concrete Supabase repositories in a later step. The
// mapper round-trip is covered by a Vitest contract test placeholder.

export interface RowMapper<TDomain, TRow> {
  toRow(record: TDomain): TRow;
  fromRow(row: TRow): TDomain;
}

/** Generic camelCase<->snake_case field-name helpers used by the mappers. */
export function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

export function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}
