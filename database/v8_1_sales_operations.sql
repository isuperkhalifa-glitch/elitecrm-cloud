-- EliteCRM V8.1 Sales Operations
-- Run this file in Supabase SQL Editor after deployment.

create extension if not exists pgcrypto;

alter table public.leads add column if not exists call_outcome text;
alter table public.leads add column if not exists last_call_at timestamptz;
alter table public.leads add column if not exists next_call_duration_minutes integer;
alter table public.leads add column if not exists queue_type text default 'manual';
alter table public.leads add column if not exists pending_operation_dist boolean default false;
alter table public.leads add column if not exists redirected_date timestamptz;

alter table public.leads drop constraint if exists leads_lead_type_check;
alter table public.leads add constraint leads_lead_type_check
  check (lead_type is null or lead_type in ('fresh','retargeted','redirected','rejected'));

alter table public.leads drop constraint if exists leads_queue_type_check;
alter table public.leads add constraint leads_queue_type_check
  check (queue_type is null or queue_type in ('manual','import','campaign','retargeting'));

create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text,
  outcome text not null check (outcome in ('interested','not_interested','need_offer','missed','wrong_number','paid','busy')),
  course_id uuid references public.courses(id) on delete set null,
  note text,
  next_follow_up_at timestamptz,
  duration_minutes integer,
  created_at timestamptz not null default now()
);

create index if not exists call_logs_lead_created_idx
  on public.call_logs(lead_id, created_at desc);
create index if not exists call_logs_actor_created_idx
  on public.call_logs(actor_id, created_at desc);
create index if not exists leads_next_follow_up_idx
  on public.leads(next_follow_up_at) where next_follow_up_at is not null;
create index if not exists leads_queue_owner_idx
  on public.leads(queue_type, owner_id, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'system',
  entity_type text,
  entity_id uuid,
  action text,
  title text,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.call_logs enable row level security;
alter table public.notifications enable row level security;

drop policy if exists call_logs_authenticated_select on public.call_logs;
create policy call_logs_authenticated_select
  on public.call_logs for select
  to authenticated
  using (true);

drop policy if exists call_logs_authenticated_insert on public.call_logs;
create policy call_logs_authenticated_insert
  on public.call_logs for insert
  to authenticated
  with check (auth.uid() = actor_id or actor_id is null);

drop policy if exists notifications_owner_select on public.notifications;
create policy notifications_owner_select
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_update
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists notifications_authenticated_insert on public.notifications;
create policy notifications_authenticated_insert
  on public.notifications for insert
  to authenticated
  with check (true);

create or replace function public.enforce_wrong_number_rejection()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'wrong_number' or new.customer_status = 'wrong_number' then
    new.lead_type := 'rejected';
  end if;
  return new;
end;
$$;

drop trigger if exists leads_wrong_number_rejection on public.leads;
create trigger leads_wrong_number_rejection
before insert or update of status, customer_status
on public.leads
for each row execute function public.enforce_wrong_number_rejection();
