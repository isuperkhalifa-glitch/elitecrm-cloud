-- EliteCRM V8 Rebuild Foundation
-- Run this file in Supabase SQL Editor after the V8 patch is deployed.

alter table public.leads add column if not exists country_code text;
alter table public.leads add column if not exists phone_number text;
alter table public.leads add column if not exists lead_type text default 'fresh';
alter table public.leads add column if not exists operation_status text default 'pending_operation_dist';
alter table public.leads add column if not exists redirected_date timestamptz;
alter table public.leads add column if not exists next_call_at timestamptz;
alter table public.leads add column if not exists next_call_minutes integer;

create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_owner_id_idx on public.leads(owner_id);
create index if not exists leads_company_id_idx on public.leads(company_id);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_lead_type_idx on public.leads(lead_type);
create index if not exists leads_next_follow_up_at_idx on public.leads(next_follow_up_at);

create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  sales_id uuid references public.profiles(id) on delete set null,
  call_status text not null default 'connected',
  duration_seconds integer default 0,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists call_logs_lead_id_idx on public.call_logs(lead_id);
create index if not exists call_logs_sales_id_idx on public.call_logs(sales_id);
create index if not exists call_logs_created_at_idx on public.call_logs(created_at desc);

create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  check_in_at timestamptz,
  check_out_at timestamptz,
  source text default 'system',
  created_at timestamptz not null default now()
);

create index if not exists attendance_logs_user_id_idx on public.attendance_logs(user_id);
create index if not exists attendance_logs_created_at_idx on public.attendance_logs(created_at desc);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience_role text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists announcements_active_idx on public.announcements(is_active, created_at desc);

update public.leads
set lead_type = 'rejected'
where coalesce(status, customer_status) = 'wrong_number'
  and lead_type is distinct from 'rejected';
