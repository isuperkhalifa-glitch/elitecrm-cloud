-- EliteCRM V6.0 Operating Model Foundation
-- Run manually in Supabase SQL Editor after this patch is deployed.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('developer','admin','manager','moderator','marketer','sales','finance','data_analyst'));

alter table public.leads add column if not exists campaign_name text;
alter table public.leads add column if not exists intake_by uuid references public.profiles(id) on update cascade on delete set null;
alter table public.leads add column if not exists reviewed_by uuid references public.profiles(id) on update cascade on delete set null;
alter table public.leads add column if not exists reviewed_at timestamptz;
alter table public.leads add column if not exists assigned_by uuid references public.profiles(id) on update cascade on delete set null;
alter table public.leads add column if not exists workflow_stage text not null default 'lead_created';

alter table public.registrations add column if not exists created_by uuid references public.profiles(id) on update cascade on delete set null;
alter table public.registrations add column if not exists updated_by uuid references public.profiles(id) on update cascade on delete set null;
alter table public.registrations add column if not exists finance_reviewed_by uuid references public.profiles(id) on update cascade on delete set null;
alter table public.registrations add column if not exists finance_reviewed_at timestamptz;
alter table public.registrations add column if not exists payment_method text;
alter table public.registrations add column if not exists payment_reference text;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references public.registrations(id) on update cascade on delete cascade,
  lead_id uuid references public.leads(id) on update cascade on delete cascade,
  company_id uuid references public.companies(id) on update cascade on delete set null,
  course_id text references public.courses(id) on update cascade on delete set null,
  amount numeric(12,2) not null default 0,
  payment_method text,
  payment_reference text,
  status text not null default 'pending',
  paid_at timestamptz,
  reviewed_by uuid references public.profiles(id) on update cascade on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_workflow_stage_idx on public.leads(workflow_stage);
create index if not exists leads_campaign_name_idx on public.leads(campaign_name);
create index if not exists payments_registration_id_idx on public.payments(registration_id);
create index if not exists payments_lead_id_idx on public.payments(lead_id);
create index if not exists payments_company_id_idx on public.payments(company_id);
create index if not exists payments_status_idx on public.payments(status);

alter table public.payments enable row level security;

drop policy if exists payments_all_authenticated on public.payments;
create policy payments_all_authenticated on public.payments for all to authenticated using (true) with check (true);
