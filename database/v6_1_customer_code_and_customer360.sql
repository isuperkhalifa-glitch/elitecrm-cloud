-- EliteCRM V6.1 Customer Code + Customer 360 Fix
-- Run this file in Supabase SQL Editor after deploying the patch.

create sequence if not exists public.customer_code_seq start with 100001 increment by 1;

alter table public.leads
  add column if not exists customer_code text;

create unique index if not exists leads_customer_code_unique
  on public.leads(customer_code)
  where customer_code is not null;

update public.leads
set customer_code = 'CUST-' || lpad(nextval('public.customer_code_seq')::text, 6, '0')
where customer_code is null or btrim(customer_code) = '';

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