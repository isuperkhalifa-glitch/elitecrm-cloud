-- EliteCRM V7 Clean Operating System
-- Run in Supabase SQL Editor after deploying the patch.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('developer','admin','manager','moderator','marketer','sales','finance','data_analyst'));

create sequence if not exists public.customer_code_seq start with 100001 increment by 1;

alter table public.leads
  add column if not exists customer_code text;

update public.leads
set customer_code = 'CUST-' || lpad(nextval('public.customer_code_seq')::text, 6, '0')
where customer_code is null or btrim(customer_code) = '';

create unique index if not exists leads_customer_code_unique
  on public.leads(customer_code)
  where customer_code is not null;

create or replace function public.set_lead_customer_code()
returns trigger
language plpgsql
as $$
begin
  if new.customer_code is null or btrim(new.customer_code) = '' then
    new.customer_code := 'CUST-' || lpad(nextval('public.customer_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_lead_customer_code on public.leads;
create trigger trg_set_lead_customer_code
before insert on public.leads
for each row execute function public.set_lead_customer_code();

create index if not exists leads_customer_code_idx on public.leads(customer_code);
create index if not exists leads_owner_followup_idx on public.leads(owner_id, next_follow_up_at);
create index if not exists leads_status_idx on public.leads(status, customer_status);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references public.registrations(id) on update cascade on delete cascade,
  lead_id uuid references public.leads(id) on update cascade on delete cascade,
  company_id uuid references public.companies(id) on update cascade on delete set null,
  amount numeric(12,2) not null default 0,
  method text default 'cash',
  status text not null default 'confirmed',
  reference text,
  notes text,
  paid_at timestamptz default now(),
  created_by uuid references public.profiles(id) on update cascade on delete set null,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

drop policy if exists payments_all_authenticated on public.payments;
create policy payments_all_authenticated on public.payments for all to authenticated using (true) with check (true);

create index if not exists payments_registration_id_idx on public.payments(registration_id);
create index if not exists payments_lead_id_idx on public.payments(lead_id);
create index if not exists payments_company_id_idx on public.payments(company_id);
create index if not exists payments_paid_at_idx on public.payments(paid_at);
