# Supabase Mode (scaffolded)

Supabase mode is **scaffolded** in this phase: the schema, client resolution,
error mapping, and mapper helpers exist; the concrete repositories are wired in a
follow-up increment. Until then, selecting Supabase mode without configuration
falls back to seeded local mode so the app always runs.

## Environment variables

Copy `.env.example` to `.env.local`:

```
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<public-anon-key>
```

Only the **anon** key is used in the browser. **Never** place a service-role key
in any `VITE_*` variable or in the repository.

## Migrations

`supabase/migrations/0001_init.sql` creates the registry schema:

`organizations`, `enterprise_clients`, `engagements`, `engagement_members`,
`enterprise_contacts`, `sites`, `site_roles`, `critical_services`,
`site_service_links`, `providers`, `circuits`, `components`, `dependencies`,
`evidence_items`, `field_provenance`, `data_gaps`, `tasks`,
`assurance_snapshots`, `audit_events`.

Every business table includes tenant/engagement scoping, `created_at`,
`updated_at`, `created_by`, `updated_by`, a `version` column for optimistic
concurrency, soft-archive fields, foreign keys, indexes, check constraints, and
`updated_at` triggers.

Apply with the Supabase CLI:

```
supabase db push        # or: supabase migration up
```

## Row-level security (RLS)

RLS is enabled on tenant-scoped tables. Policies compare `tenant_id` to the
caller's JWT claim (`auth.jwt() ->> 'tenant_id'`). Policies are refined when the
concrete repositories are implemented; scope enforcement must live at the
row-security layer so carrier-visible sites and fields cannot leak beyond scope.

## Remaining to complete Supabase mode

1. `npm install @supabase/supabase-js`.
2. Implement `src/infrastructure/supabase/client.ts` real client + the
   repositories in `src/infrastructure/supabase/repositories/` using the mappers
   in `src/infrastructure/supabase/mappers/`.
3. Finalize RLS policies per role and add a mapper round-trip test per aggregate.

The application continues to run in local mode without any Supabase
configuration.
