-- V3.1 Unified Customers Timeline
-- Run this in Supabase SQL Editor after applying V3.0.

create table if not exists public.customer_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text,
  action text not null,
  old_value text,
  new_value text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists customer_activities_lead_id_created_at_idx
  on public.customer_activities (lead_id, created_at desc);

create index if not exists customer_activities_actor_id_idx
  on public.customer_activities (actor_id);

alter table public.customer_activities enable row level security;

drop policy if exists "customer_activities_select_authenticated" on public.customer_activities;
create policy "customer_activities_select_authenticated"
  on public.customer_activities
  for select
  to authenticated
  using (true);

drop policy if exists "customer_activities_insert_authenticated" on public.customer_activities;
create policy "customer_activities_insert_authenticated"
  on public.customer_activities
  for insert
  to authenticated
  with check (true);

-- Safety columns used by the unified customers page.
alter table public.leads add column if not exists lead_type text not null default 'fresh';
alter table public.leads add column if not exists country_code text;
alter table public.leads add column if not exists phone_number text;
alter table public.leads add column if not exists course_name text;

create index if not exists leads_owner_followup_idx on public.leads (owner_id, next_follow_up_at);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_customer_status_idx on public.leads (customer_status);
create index if not exists leads_lead_type_idx on public.leads (lead_type);
