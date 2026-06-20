-- EliteCRM V10.6 Commission Engine
-- Run after database/v10_6_write_permissions.sql.

alter table public.profiles add column if not exists default_commission_type text default 'percentage';
alter table public.profiles add column if not exists default_commission_value numeric(12,2) default 0;
alter table public.companies add column if not exists commission_type text default 'percentage';
alter table public.companies add column if not exists commission_value numeric(12,2) default 0;

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  sales_id uuid references public.profiles(id) on update cascade on delete set null,
  company_id uuid references public.companies(id) on update cascade on delete set null,
  invoice_id uuid references public.invoices(id) on update cascade on delete cascade,
  base_amount numeric(12,2) not null default 0,
  commission_type text not null default 'percentage',
  commission_value numeric(12,2) not null default 0,
  commission_amount numeric(12,2) not null default 0,
  status text not null default 'due',
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists commissions_invoice_unique
  on public.commissions(invoice_id)
  where invoice_id is not null;
create index if not exists commissions_sales_status_idx on public.commissions(sales_id, status);
create index if not exists commissions_company_status_idx on public.commissions(company_id, status);

create or replace function public.calculate_invoice_commission(target_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invoice_row record;
  company_rule record;
  sales_rule record;
  rule_type text := 'percentage';
  rule_value numeric := 0;
  calculated numeric := 0;
begin
  select invoice.id, invoice.owner_id, invoice.company_id, invoice.amount, invoice.status
  into invoice_row
  from public.invoices invoice
  where invoice.id = target_invoice_id;

  if invoice_row.id is null then return; end if;

  if invoice_row.status <> 'paid' then
    update public.commissions
    set status = case when status = 'paid' then status else 'canceled' end,
        updated_at = now()
    where invoice_id = target_invoice_id;
    return;
  end if;

  select company.commission_type, company.commission_value
  into company_rule
  from public.companies company
  where company.id = invoice_row.company_id;

  select profile.default_commission_type, profile.default_commission_value
  into sales_rule
  from public.profiles profile
  where profile.id = invoice_row.owner_id;

  if coalesce(company_rule.commission_value, 0) > 0 then
    rule_type := coalesce(company_rule.commission_type, 'percentage');
    rule_value := company_rule.commission_value;
  else
    rule_type := coalesce(sales_rule.default_commission_type, 'percentage');
    rule_value := coalesce(sales_rule.default_commission_value, 0);
  end if;

  if rule_type = 'fixed' then
    calculated := greatest(rule_value, 0);
  else
    calculated := greatest(coalesce(invoice_row.amount, 0) * rule_value / 100, 0);
  end if;

  insert into public.commissions (
    sales_id, company_id, invoice_id, base_amount,
    commission_type, commission_value, commission_amount, status
  ) values (
    invoice_row.owner_id, invoice_row.company_id, invoice_row.id,
    greatest(coalesce(invoice_row.amount, 0), 0),
    rule_type, rule_value, calculated, 'due'
  )
  on conflict (invoice_id) where invoice_id is not null
  do update set
    sales_id = excluded.sales_id,
    company_id = excluded.company_id,
    base_amount = excluded.base_amount,
    commission_type = excluded.commission_type,
    commission_value = excluded.commission_value,
    commission_amount = excluded.commission_amount,
    status = case when public.commissions.status = 'paid' then 'paid' else 'due' end,
    updated_at = now();
end;
$$;

create or replace function public.recalculate_paid_invoice_commissions()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invoice_row record;
begin
  if auth.role() <> 'service_role'
     and public.current_app_role() not in ('developer','admin','finance') then
    raise exception 'لا تملك صلاحية إعادة احتساب العمولات.';
  end if;

  for invoice_row in
    select id from public.invoices where status = 'paid'
  loop
    perform public.calculate_invoice_commission(invoice_row.id);
  end loop;
end;
$$;

create or replace function public.sync_invoice_commission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.calculate_invoice_commission(new.id);
  return new;
end;
$$;

drop trigger if exists invoices_sync_commission on public.invoices;
create trigger invoices_sync_commission
after insert or update of status, amount, company_id, owner_id on public.invoices
for each row execute function public.sync_invoice_commission();

revoke all on function public.recalculate_paid_invoice_commissions() from public;
grant execute on function public.recalculate_paid_invoice_commissions() to authenticated;
