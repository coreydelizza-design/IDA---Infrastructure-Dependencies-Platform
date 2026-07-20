-- IDA — Phase 1 registry foundation schema (Supabase / Postgres).
-- Tenant-scoped, engagement-aware, soft-archive, optimistic concurrency, RLS.
-- NOTE: authored in this phase; concrete Supabase repositories are wired later.

create extension if not exists "pgcrypto";

-- Reusable updated_at trigger --------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Organizations & clients ------------------------------------------------------
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  consultancy_organization_id uuid not null,
  name text not null,
  legal_name text not null,
  status text not null default 'active',
  primary_contact_id uuid,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint organizations_status_chk check (status in ('active','suspended','archived'))
);

create table if not exists enterprise_clients (
  id uuid primary key default gen_random_uuid(),
  consultancy_organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  legal_name text not null,
  industry text,
  headquarters_country text,
  status text not null default 'active',
  external_reference text,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,
  constraint enterprise_clients_status_chk check (status in ('prospect','active','on-hold','archived'))
);
create index if not exists enterprise_clients_org_idx on enterprise_clients(consultancy_organization_id);

-- Engagements ------------------------------------------------------------------
create table if not exists engagements (
  id uuid primary key default gen_random_uuid(),
  consultancy_organization_id uuid not null references organizations(id) on delete cascade,
  enterprise_client_id uuid not null references enterprise_clients(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  status text not null default 'draft',
  scope_statement text,
  start_date date,
  target_completion_date date,
  review_cadence text,
  lead_consultant_user_id uuid,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);
create index if not exists engagements_enterprise_idx on engagements(enterprise_client_id);

create table if not exists engagement_members (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists engagement_members_engagement_idx on engagement_members(engagement_id);

create table if not exists enterprise_contacts (
  id uuid primary key default gen_random_uuid(),
  enterprise_client_id uuid not null references enterprise_clients(id) on delete cascade,
  engagement_id uuid references engagements(id) on delete set null,
  name text not null,
  title text,
  department text,
  email text,
  phone text,
  responsibility text,
  approval_authority boolean not null default false,
  role text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sites & roles ----------------------------------------------------------------
create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  enterprise_client_id uuid not null references enterprise_clients(id) on delete cascade,
  engagement_id uuid not null references engagements(id) on delete cascade,
  code text not null,
  name text not null,
  archetype_id text,
  primary_location_type text,
  address text,
  city text,
  state_province text,
  postal_code text,
  country_code text,
  country_name text,
  latitude double precision,
  longitude double precision,
  timezone text,
  ownership_model text,
  occupancy_model text,
  operating_hours text,
  user_count integer,
  endpoint_count integer,
  business_criticality smallint check (business_criticality between 1 and 5),
  operational_dependency smallint check (operational_dependency between 1 and 5),
  safety_impact smallint check (safety_impact between 1 and 5),
  registry_state text not null default 'draft',
  assessment_status text not null default 'not-started',
  completeness_percent smallint not null default 0,
  last_verified_at text,
  next_review_at text,
  consultant_owner_id uuid,
  enterprise_owner_contact_id uuid,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);
create index if not exists sites_engagement_idx on sites(engagement_id);
create index if not exists sites_tenant_idx on sites(tenant_id);
create unique index if not exists sites_engagement_code_uidx on sites(engagement_id, code);

create table if not exists site_roles (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  role_kind text not null,
  role_value text not null
);

-- Services ---------------------------------------------------------------------
create table if not exists critical_services (
  id uuid primary key default gen_random_uuid(),
  enterprise_client_id uuid not null references enterprise_clients(id) on delete cascade,
  engagement_id uuid not null references engagements(id) on delete cascade,
  name text not null,
  description text,
  service_owner_contact_id uuid,
  business_function text,
  criticality text,
  operational_dependency smallint,
  rto_minutes integer,
  rpo_minutes integer,
  maximum_tolerable_outage_minutes integer,
  service_tier text,
  assurance_state text not null default 'not-assessed',
  verification_state text not null default 'unknown',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create table if not exists site_service_links (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  critical_service_id uuid not null references critical_services(id) on delete cascade
);

-- Providers, circuits, components, dependencies --------------------------------
create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  enterprise_client_id uuid not null references enterprise_clients(id) on delete cascade,
  name text not null,
  legal_name text,
  provider_type text not null,
  identifiers jsonb not null default '[]',
  account_numbers jsonb not null default '[]',
  primary_contact text,
  verification_state text not null default 'unknown',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);

create table if not exists circuits (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  role text not null,
  service_type text,
  service_identifier text,
  contracted_provider_id uuid references providers(id) on delete set null,
  underlying_provider_id uuid references providers(id) on delete set null,
  access_provider_id uuid references providers(id) on delete set null,
  bandwidth_value numeric,
  bandwidth_unit text,
  physical_medium text,
  building_entrance text,
  verification_state text not null default 'unknown',
  notes text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);
create index if not exists circuits_site_idx on circuits(site_id);

create table if not exists components (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  component_type text not null,
  layer text not null,
  manufacturer text,
  model text,
  serial_number text,
  redundancy_role text,
  lifecycle_state text,
  verification_state text not null default 'unknown',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);
create index if not exists components_site_idx on components(site_id);

create table if not exists dependencies (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  source_entity_type text not null,
  source_entity_id uuid not null,
  target_entity_type text not null,
  target_entity_id uuid not null,
  dependency_type text not null,
  state text not null default 'declared',
  criticality smallint check (criticality between 1 and 5),
  substitutability smallint check (substitutability between 1 and 5),
  failure_impact smallint check (failure_impact between 1 and 5),
  verification_state text not null default 'unknown',
  notes text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);
create index if not exists dependencies_engagement_idx on dependencies(engagement_id);

-- Evidence, provenance, data gaps, tasks ---------------------------------------
create table if not exists evidence_items (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  site_id uuid references sites(id) on delete cascade,
  evidence_type text not null,
  title text not null,
  source text,
  document_date date,
  received_date date,
  effective_date date,
  expiration_date date,
  verification_state text not null default 'unknown',
  attachment_ref text,
  notes text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists field_provenance (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  field_path text not null,
  source_type text not null,
  source_name text,
  source_record_id uuid,
  submitted_by_user_id uuid,
  observed_at timestamptz,
  received_at timestamptz not null default now(),
  verification_state text not null default 'unknown',
  evidence_item_id uuid references evidence_items(id) on delete set null,
  authoritative boolean not null default false,
  manually_overridden boolean not null default false,
  override_reason text,
  superseded_at timestamptz
);
create index if not exists field_provenance_entity_idx on field_provenance(entity_type, entity_id, field_path);

create table if not exists data_gaps (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  site_id uuid references sites(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  field_path text,
  title text not null,
  description text,
  gap_type text not null,
  priority text not null default 'medium',
  requested_from text not null default 'none',
  requires_authorization boolean not null default false,
  status text not null default 'open',
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  site_id uuid references sites(id) on delete cascade,
  kind text not null,
  title text not null,
  description text,
  assignee_user_id uuid,
  status text not null default 'open',
  due_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Assurance snapshots & audit --------------------------------------------------
create table if not exists assurance_snapshots (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  architecture_assurance_score integer,
  architecture_assurance_band text,
  assessment_coverage_percent integer,
  evidence_confidence_percent integer,
  residual_risk_count integer,
  publication_state text not null default 'provisional',
  profile_version text,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid references engagements(id) on delete set null,
  actor_user_id uuid,
  actor_role text,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_summary text,
  after_summary text,
  source text,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_engagement_idx on audit_events(engagement_id);

-- updated_at triggers ----------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','enterprise_clients','engagements','engagement_members','enterprise_contacts',
    'sites','critical_services','providers','circuits','components','dependencies','evidence_items','tasks'
  ] loop
    execute format('drop trigger if exists trg_%s_updated_at on %I;', t, t);
    execute format('create trigger trg_%s_updated_at before update on %I for each row execute function set_updated_at();', t, t);
  end loop;
end $$;

-- Row-level security (tenant isolation) ----------------------------------------
-- Enable RLS and scope reads/writes to the caller's tenant. The tenant claim is
-- expected in the JWT (auth.jwt() ->> 'tenant_id'). Concrete policies are
-- refined when the Supabase repositories are wired.
alter table sites enable row level security;
alter table enterprise_clients enable row level security;
alter table engagements enable row level security;

create policy sites_tenant_isolation on sites
  using (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''))
  with check (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));
