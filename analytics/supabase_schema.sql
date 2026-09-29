-- The Genius Test anonymous analytics schema
-- Supabase / PostgreSQL
-- v1: no names, email, phone, IP, user-agent, or device fingerprint stored in app tables.

create extension if not exists pgcrypto;

create table if not exists public.test_runs (
  id uuid primary key,
  schema_version smallint not null default 1 check (schema_version = 1),
  test_version text not null check (char_length(test_version) between 1 and 20),

  started_at timestamptz,
  completed_at timestamptz not null default now(),
  duration_ms integer check (duration_ms is null or (duration_ms >= 0 and duration_ms <= 3600000)),

  base_answers jsonb not null check (jsonb_typeof(base_answers) = 'array'),
  adaptive_answers jsonb not null default '[]'::jsonb check (jsonb_typeof(adaptive_answers) = 'array'),
  adaptive_used boolean not null default false,
  adaptive_key text,

  top1 text not null,
  top1_score smallint not null check (top1_score between 0 and 100),
  top2 text not null,
  top2_score smallint not null check (top2_score between 0 and 100),
  score_gap numeric(8,5),

  similar_player text,
  ally_player text,
  opposite_player text,
  dominant_traits jsonb check (dominant_traits is null or jsonb_typeof(dominant_traits) = 'array'),

  utm_source text check (utm_source is null or char_length(utm_source) <= 80),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 80),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 120),

  created_at timestamptz not null default now()
);

create table if not exists public.test_events (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.test_runs(id) on delete cascade,
  event_type text not null check (event_type in ('share_native','share_copy','self_rating')),
  event_value jsonb not null default '{}'::jsonb check (jsonb_typeof(event_value) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists idx_test_runs_created_at on public.test_runs(created_at desc);
create index if not exists idx_test_runs_top1 on public.test_runs(top1);
create index if not exists idx_test_events_run_id on public.test_events(run_id);
create index if not exists idx_test_events_type on public.test_events(event_type);

alter table public.test_runs enable row level security;
alter table public.test_events enable row level security;

revoke all on public.test_runs from anon, authenticated;
revoke all on public.test_events from anon, authenticated;

grant insert on public.test_runs to anon, authenticated;
grant insert on public.test_events to anon, authenticated;
grant usage, select on sequence public.test_events_id_seq to anon, authenticated;

drop policy if exists "anonymous insert test_runs" on public.test_runs;
create policy "anonymous insert test_runs"
on public.test_runs for insert
to anon, authenticated
with check (
  schema_version = 1
  and jsonb_array_length(base_answers) between 12 and 14
  and jsonb_array_length(adaptive_answers) between 0 and 2
  and top1 <> ''
  and top2 <> ''
);

drop policy if exists "anonymous insert test_events" on public.test_events;
create policy "anonymous insert test_events"
on public.test_events for insert
to anon, authenticated
with check (
  event_type in ('share_native','share_copy','self_rating')
  and (
    event_type <> 'self_rating'
    or (
      event_value ? 'rating'
      and (event_value->>'rating')::int between 1 and 5
    )
  )
);

-- Important: no SELECT/UPDATE/DELETE policy is created for browser users.
-- Dashboard/admin analysis should use Supabase dashboard, SQL editor,
-- or a server-side/service-role context only.
