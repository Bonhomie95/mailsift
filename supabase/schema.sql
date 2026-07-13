-- MailSift schema. Run this in the Supabase SQL editor.

-- Admin-managed mail-provider matching rules. These merge on top of the
-- built-in seed rules in the app (rows here override a seed with the same id).
create table if not exists public.providers (
  id text primary key,
  name text not null,
  category text not null default '',
  match_on text not null default 'mx' check (match_on in ('mx', 'ns', 'both')),
  mx_patterns text[] not null default '{}',
  ns_patterns text[] not null default '{}',
  priority int not null default 5,
  color text not null default '#6d5efc',
  icon text,
  created_at timestamptz not null default now()
);

-- Optional cross-instance DNS cache. The app works without it (per-instance
-- in-memory cache), but this makes cache hits shared across serverless
-- instances, which matters a lot under heavy traffic.
create table if not exists public.dns_cache (
  domain text primary key,
  mx text[] not null default '{}',
  ns text[] not null default '{}',
  fetched_at timestamptz not null default now()
);

-- API keys for programmatic access to /api/sort. Only the SHA-256 hash is
-- stored; the raw key is shown once at creation.
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  label text not null default 'Untitled key',
  key_hash text not null unique,
  preview text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_used timestamptz
);

-- User-submitted "add this mail host" suggestions (from the public form).
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  value text not null,
  note text,
  email text,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- The app talks to these tables with the service-role key (server-side only),
-- so Row Level Security can stay enabled with no public policies.
alter table public.providers enable row level security;
alter table public.dns_cache enable row level security;
alter table public.api_keys enable row level security;
alter table public.suggestions enable row level security;
